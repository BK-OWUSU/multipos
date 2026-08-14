import { NextRequest, NextResponse } from "next/server";
import { JwtPayload } from "./types/auth/auth";
import { getAllAccessKeys } from "./lib/accessAndPermissionsDef";
import { verifyPOSTokenEdge } from "./lib/auths-functions.edge";
import { SHOP_SCOPED_KEYS } from "./lib/nav-data";

const POS_COOKIE_NAME = "pos_token";
const PASSWORD_RESET_COOKIE_NAME = "password_reset";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isApiRequest = pathname.startsWith('/api');

    // 1. SKIP ASSETS
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Protect our logging endpoints from middleware execution loops
    if (pathname === '/api/auth/logout-expiration' || pathname === '/api/auth/log-expiration') {
        return NextResponse.next();
    }

    const requestSession = request.cookies.get(POS_COOKIE_NAME);
    const token = requestSession?.value;
    const reset_pass_token = request.cookies.get(PASSWORD_RESET_COOKIE_NAME)?.value;

    let session: JwtPayload | null = null;
    let isTokenExpired = false;

    if (token) {
        const authResult = await verifyPOSTokenEdge(token);
        if (authResult) {
            session = authResult.payload as JwtPayload;
            isTokenExpired = authResult.isExpired;
        }
    }

    // 2. HANDLING EXPIRED TOKEN
    if (isTokenExpired && session) {
        // Safe asynchronous background fetch execution (No await to avoid blocking)
        fetch(`${request.nextUrl.origin}/api/auth/logout-expiration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionLogId: session.sessionLogId,
                userId: session.userId,
                businessId: session.businessId,
                reason: 'Expired User Session',
                businessSlug: session.businessSlug 
            }),
        }).catch((e) => console.error("Failed to log backend session timeout:", e));

        if (isApiRequest) {
            const errResponse = NextResponse.json({ error: "Session expired" }, { status: 401 });
            errResponse.cookies.delete(POS_COOKIE_NAME);
            return errResponse;
        } else {
            const redirectResponse = NextResponse.redirect(new URL("/login?reason=expired", request.url));
            redirectResponse.cookies.delete(POS_COOKIE_NAME);
            return redirectResponse;
        }
    }

    // 3. BASE RESPONSE INITIALIZATION
    const response = NextResponse.next();

    // SLIDING SESSION (Apply to base response)
    if (requestSession && !isTokenExpired) {
        response.cookies.set(POS_COOKIE_NAME, requestSession.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1800, // 30 minutes
            path: '/',
            sameSite: 'lax'
        });
    }

    // Move this block ABOVE the "if (isApiRequest)" check:
// 4. PASSWORD CHANGE ENFORCEMENT
if (session?.needsPasswordChange) {
    const resetPath = `/${session.businessSlug}/reset-password`;
    
    // If it's a page navigation and they are NOT on the reset page, force redirect them
    if (!isApiRequest && pathname !== resetPath) {
        const redirectPass = NextResponse.redirect(new URL(resetPath, request.url));
        if (requestSession) redirectPass.cookies.set(POS_COOKIE_NAME, requestSession.value);
        return redirectPass;
    }
    
    // If it's an API request, block profile fetches but allow the password change submission API
    if (isApiRequest) {
        const allowedApiRoutes = ['/api/auth/reset-password', '/api/auth/logout']; 
        const isAllowedApi = allowedApiRoutes.some(route => pathname.startsWith(route));
        
        if (!isAllowedApi) {
            // Stop auth/me from polling cleanly by throwing an explicit 403 or specific status
            return NextResponse.json(
                { error: "Password change required", code: "PASSWORD_RESET_REQUIRED" }, 
                { status: 403 }
            );
        }
    }
}

    // Pass API requests immediately with updated cookie
    if (isApiRequest) {
        return response;
    }

     // --- PAGE-LEVEL ROUTING LOGIC --- 
    const pathSegments = pathname.split("/").filter(Boolean);
    const urlSlug = pathSegments[0];
    const resetPasswordPage = `/${session?.businessSlug}/reset-password`
    const publicPaths = ["/login", "/signup", "/verify-email", "/",resetPasswordPage];
    const isPublicPath = publicPaths.includes(pathname);
    const isTenantPath = pathSegments.length >= 2 && !isPublicPath;

    const allSystemKeys = getAllAccessKeys(); 
    const routeKey = pathSegments.find(segment => allSystemKeys.includes(segment)) || pathSegments[1];

    console.log("===================== ROUTING EVALUATION =========================");
    console.log("Evaluated Target Pathname:", pathname);
    console.log("Identified Role Security Key:", routeKey);

    // Helper to calculate landing route based on your precise strict priority rules:
    // 1. Full Admin (*) -> "dashboard"
    // 2. Explicit access to "dashboard" -> "dashboard"
    // 3. Explicit access to "shop-dashboard" -> Redirect to a shop fallback or general dashboard path
    // 4. Scan for the very first valid key they actually have access to.

    const determineFallbackRoute = (userAccess: string[]): string => {
        console.log(userAccess)
        // 1. Check for full admin or main business dashboard access
        if (userAccess.includes("*") || userAccess.includes("dashboard")) {
            return "dashboard";
        }
        
        // 2. Check for shop dashboard access (routes directly to the static sub-folder page)
        if (userAccess.includes("shop-dashboard")) {
            return "shops/shop-dashboard"; 
        }
        
        // 3. Last resort fallback: find their first valid matching module key
        const firstMatchingKey = userAccess.find(key => allSystemKeys.includes(key));
        // const shopRoutes = SHOP_SCOPED_KEYS;
        // const isShopRoutes = firstMatchingKey ? shopRoutes.includes(firstMatchingKey) : false;
        // if (isShopRoutes) {
        //     return "shops"
        // }
        
        // Safety check: if their first key is generic "shops", force them to the actual page "shops/shop-dashboard"
        if (firstMatchingKey === "shops") {
            return "shops/shop-dashboard";
        }

        return firstMatchingKey || "profile"; // Ultimate safety net
    };


    // 4. PASSWORD CHANGE ENFORCEMENT
    if (session?.needsPasswordChange) {
        const resetPath = `/${session.businessSlug}/reset-password`;
        if (pathname !== resetPath) {
            const redirectPass = NextResponse.redirect(new URL(resetPath, request.url));
            if (requestSession) redirectPass.cookies.set(POS_COOKIE_NAME, requestSession.value, response.cookies.get(POS_COOKIE_NAME));
            return redirectPass;
        }
        return response; 
    }

    // 5. UNAUTHENTICATED TENANT ROUTE ACCESS
    if (isTenantPath && !session) {
        if (routeKey === "reset-password" && reset_pass_token) {
            return response;
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 6. AUTHENTICATED USER TRYING TO ACCESS PUBLIC PATHS (e.g. hitting "/" or "/login")
    if (session && isPublicPath) {
        const targetFallback = determineFallbackRoute(session.access);
        const redirectDash = NextResponse.redirect(new URL(`/${session.businessSlug}/${targetFallback}`, request.url));
        if (requestSession) redirectDash.cookies.set(POS_COOKIE_NAME, requestSession.value, response.cookies.get(POS_COOKIE_NAME));
        return redirectDash;
    }

    // 7. TENANT ISOLATION & PERMISSIONS
    if (session && isTenantPath) {
        const targetFallback = determineFallbackRoute(session.access);

        if (urlSlug !== session.businessSlug) {
            const redirectIso = NextResponse.redirect(new URL(`/${session.businessSlug}/${targetFallback}`, request.url));
            if (requestSession) redirectIso.cookies.set(POS_COOKIE_NAME, requestSession.value, response.cookies.get(POS_COOKIE_NAME));
            return redirectIso;
        }

                // 🚨 B. NEW ENFORCED SHOP SELECTION CHECK 🚨
        // Identify if they are trying to access a sub-route meant ONLY for active branches
        const isAccessingShopScopedRoute = SHOP_SCOPED_KEYS.includes(routeKey) || pathSegments.includes("shops");
        const isTargetingBaseShopsSelectionPage = pathSegments[1] === "shops" && pathSegments.length === 2;

        // If they are targeting a sub-route but don't have an active shop selected in their token session
        if (isAccessingShopScopedRoute && !isTargetingBaseShopsSelectionPage && !session.shopSlug) {
            console.log(`Redirecting to base selection layout: Missing shopSlug context for route key: ${routeKey}`);
            
            const redirectShopsSelection = NextResponse.redirect(
                new URL(`/${session.businessSlug}/shops`, request.url)
            );
            
            if (requestSession) {
                redirectShopsSelection.cookies.set(POS_COOKIE_NAME, requestSession.value);
            }
            return redirectShopsSelection;
        }
    
        // Critical: Remove "dashboard" from universal system paths so it is strictly evaluated by access checks!
        const universalSystemRoutes = ["profile", "reset-password"];
        if (universalSystemRoutes.includes(routeKey)) {
            return response;
        }

        const hasFullAccess = session.access.includes("*");
        const hasSpecificAccess = session.access.includes(routeKey);

        // UNAUTHORIZED ACCESSED ROUTE EXECUTION
        if (!hasFullAccess && !hasSpecificAccess) {
            console.log(`Access Denied for ${routeKey}. Redirecting to priority route: ${targetFallback}`);
            
            // Defend against an infinite routing execution loop if the fallback happens to be what they are failing on
            const permanentSafetyTarget = targetFallback === routeKey ? "profile" : targetFallback;

            const redirectAuth = NextResponse.redirect(new URL(`/${session.businessSlug}/${permanentSafetyTarget}`, request.url));
            if (requestSession) redirectAuth.cookies.set(POS_COOKIE_NAME, requestSession.value, response.cookies.get(POS_COOKIE_NAME));
            return redirectAuth;
        }
    }
    return response;
}

export const config = {
  matcher: [
      '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};