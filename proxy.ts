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

    // 1. SKIP ASSETS & LOGGING ENDPOINTS
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next();
    }

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

    // Cookie configuration helper for sliding session & redirects
    const setSessionCookie = (res: NextResponse) => {
        if (requestSession) {
            res.cookies.set(POS_COOKIE_NAME, requestSession.value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1800, // 30 minutes
                path: '/',
                sameSite: 'lax'
            });
        }
    };

    // 2. HANDLING EXPIRED TOKEN
    if (isTokenExpired && session) {
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

    // 3. BASE RESPONSE INITIALIZATION & SLIDING SESSION
    const response = NextResponse.next();
    if (requestSession && !isTokenExpired) {
        setSessionCookie(response);
    }

    // 4. UNIFIED PASSWORD CHANGE ENFORCEMENT
    if (session?.needsPasswordChange) {
        const resetPath = `/${session.businessSlug}/reset-password`;
        
        if (isApiRequest) {
            const allowedApiRoutes = ['/api/auth/reset-password', '/api/auth/logout'];
            const isAllowedApi = allowedApiRoutes.some(route => pathname.startsWith(route));
            if (!isAllowedApi) {
                return NextResponse.json(
                    { error: "Password change required", code: "PASSWORD_RESET_REQUIRED" }, 
                    { status: 403 }
                );
            }
            return response;
        }

        if (pathname !== resetPath) {
            const redirectPass = NextResponse.redirect(new URL(resetPath, request.url));
            setSessionCookie(redirectPass);
            return redirectPass;
        }
        
        return response;
    }

    // Pass API requests immediately after session checks & password verification
    if (isApiRequest) {
        return response;
    }

    // --- PAGE-LEVEL ROUTING LOGIC --- 
    const pathSegments = pathname.split("/").filter(Boolean);
    const urlSlug = pathSegments[0];
    
    const publicPaths = ["/login", "/signup", "/verify-email", "/"];
    if (session?.businessSlug) {
        publicPaths.push(`/${session.businessSlug}/reset-password`);
    }
    
    const isPublicPath = publicPaths.includes(pathname);
    const isTenantPath = pathSegments.length >= 2 && !isPublicPath;

    const allSystemKeys = getAllAccessKeys(); 
    const routeKey = pathSegments.find(segment => allSystemKeys.includes(segment)) || pathSegments[1];

    console.log("===================== ROUTING EVALUATION =========================");
    console.log("Evaluated Target Pathname:", pathname);
    console.log("Identified Role Security Key:", routeKey);

    const determineFallbackRoute = (userAccess: string[]): string => {
        if (userAccess.includes("*") || userAccess.includes("dashboard")) {
            return "dashboard";
        }
        if (userAccess.includes("shop-dashboard")) {
            return "shops/shop-dashboard"; 
        }
        const firstMatchingKey = userAccess.find(key => allSystemKeys.includes(key));
        if (firstMatchingKey === "shops") {
            return "shops/shop-dashboard";
        }
        return firstMatchingKey || "profile";
    };

    // 5. UNAUTHENTICATED TENANT ROUTE ACCESS
    if (isTenantPath && !session) {
        if (routeKey === "reset-password" && reset_pass_token) {
            return response;
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 6. AUTHENTICATED USER TRYING TO ACCESS PUBLIC PATHS
    if (session && isPublicPath) {
        const targetFallback = determineFallbackRoute(session.access);
        const redirectDash = NextResponse.redirect(new URL(`/${session.businessSlug}/${targetFallback}`, request.url));
        setSessionCookie(redirectDash);
        return redirectDash;
    }

    // 7. TENANT ISOLATION & PERMISSIONS
    if (session && isTenantPath) {
        const targetFallback = determineFallbackRoute(session.access);

        if (urlSlug !== session.businessSlug) {
            const redirectIso = NextResponse.redirect(new URL(`/${session.businessSlug}/${targetFallback}`, request.url));
            setSessionCookie(redirectIso);
            return redirectIso;
        }

        // Shop Selection Enforcement
        const isAccessingShopScopedRoute = SHOP_SCOPED_KEYS.includes(routeKey) || pathSegments.includes("shops");
        const isTargetingBaseShopsSelectionPage = pathSegments[1] === "shops" && pathSegments.length === 2;

        if (isAccessingShopScopedRoute && !isTargetingBaseShopsSelectionPage && !session.shopSlug) {
            console.log(`Redirecting to base selection layout: Missing shopSlug context for route key: ${routeKey}`);
            const redirectShopsSelection = NextResponse.redirect(
                new URL(`/${session.businessSlug}/shops`, request.url)
            );
            setSessionCookie(redirectShopsSelection);
            return redirectShopsSelection;
        }
    
        // Universal System Routes
        const universalSystemRoutes = ["profile", "reset-password"];
        if (universalSystemRoutes.includes(routeKey)) {
            return response;
        }

        const hasFullAccess = session.access.includes("*");
        const hasSpecificAccess = session.access.includes(routeKey);

        if (!hasFullAccess && !hasSpecificAccess) {
            console.log(`Access Denied for ${routeKey}. Redirecting to priority route: ${targetFallback}`);
            const permanentSafetyTarget = targetFallback === routeKey ? "profile" : targetFallback;

            const redirectAuth = NextResponse.redirect(new URL(`/${session.businessSlug}/${permanentSafetyTarget}`, request.url));
            setSessionCookie(redirectAuth);
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