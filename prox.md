import { NextRequest, NextResponse } from "next/server";
import { JwtPayload } from "./types/auth/auth";
import { getAllAccessKeys } from "./lib/accessAndPermissionsDef";
import { verifyPOSTokenEdge } from "./lib/auths-functions.edge";

const POS_COOKIE_NAME = "pos_token";
const PASSWORD_RESET_COOKIE_NAME = "password_reset";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isApiRequest = pathname.startsWith('/api');

    // 1. SKIP ASSETS
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // Protect our logging endpoint from infinite loops
    if (pathname === '/api/auth/log-expiration') {
        return NextResponse.next();
    }

    // CREATE A MUTABLE RESPONSE BASE (Crucial)
    const response = NextResponse.next();

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

    // HANDLING EXPIRED TOKEN
    if (isTokenExpired && session) {
        try {
            await fetch(`${request.nextUrl.origin}/api/auth/logout-expiration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sessionLogId: session.sessionLogId,
                    userId: session.userId,
                    businessId: session.businessId,
                    reason: 'Expired User Session',
                    businessSlug: session.businessSlug 
                }),
            });
        } catch (e) {
            console.error("Failed to log backend session timeout:", e);
        }

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

    // SLIDING SESSION (Refactored: No early returns)
    if (requestSession && !isTokenExpired) {
        // We set the cookie directly on our mutable response object instead of returning early
        response.cookies.set(POS_COOKIE_NAME, requestSession.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 60, // 30 minutes in seconds
            path: '/',
        });
    }

    // Let API requests pass straight through with the modified response cookie
    if (isApiRequest) {
        return response;
    }

    // --- PAGE-LEVEL ROUTING LOGIC --- 
    const pathSegments = pathname.split("/").filter(Boolean);
    const urlSlug = pathSegments[0];
    
    const publicPaths = ["/login", "/signup", "/verify-email", "/"];
    const isPublicPath = publicPaths.includes(pathname);
    const isTenantPath = pathSegments.length >= 2 && !isPublicPath;

    const allSystemKeys = getAllAccessKeys(); 
    const routeKey = pathSegments.find(segment => allSystemKeys.includes(segment)) || pathSegments[1];

    // THIS LOG WILL NOW RUN PERFECTLY ON EVERY SINGLE VISITED WEB ROUTE
    console.log("===================== ROUTING EVALUATION =========================");
    console.log("Evaluated Target Pathname:", pathname);
    console.log("Identified Role Security Key:", routeKey);

    // 2. PASSWORD CHANGE ENFORCEMENT
    if (session?.needsPasswordChange) {
        const resetPath = `/${session.businessSlug}/reset-password`;
        if (pathname !== resetPath) {
            return NextResponse.redirect(new URL(resetPath, request.url));
        }
        return response; 
    }

    if (isTenantPath && !session) {
        if (routeKey === "reset-password" && reset_pass_token) {
            return response;
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session && isPublicPath) {
        return NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
    }

    // 4. TENANT ISOLATION & PERMISSIONS
    if (session && isTenantPath) {
        if (urlSlug !== session.businessSlug) {
            return NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
        }
    
        const systemRoutes = ["dashboard", "profile", "reset-password"];
        if (systemRoutes.includes(routeKey)) {
            return response;
        }


        const hasFullAccess = session.access.includes("*");
        const hasSpecificAccess = session.access.includes(routeKey);

        console.log("SESSION ROLE: ",session.roleName)
        console.log("SESSION ACCESS: ",session.access)
        console.log("HAS FULL ACCESS: ",hasFullAccess,"    ROUTE: ",routeKey)
        console.log("HAS SPECIFIC ACCESS: ",hasSpecificAccess ,"    ROUTE: ",routeKey)

        if (!hasFullAccess && !hasSpecificAccess) {
            return NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
        }
    }

    // Return the response containing the refreshed sliding cookie mutation configuration
    return response;
}

export const config = {
  matcher: [
      '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};


/// 2
import { NextRequest, NextResponse } from "next/server";
import { JwtPayload } from "./types/auth/auth";
import { getAllAccessKeys } from "./lib/accessAndPermissionsDef";
import { verifyPOSTokenEdge } from "./lib/auths-functions.edge";

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

    // Pass API requests immediately with updated cookie
    if (isApiRequest) {
        return response;
    }

    // --- PAGE-LEVEL ROUTING LOGIC --- 
    const pathSegments = pathname.split("/").filter(Boolean);
    const urlSlug = pathSegments[0];
    
    const publicPaths = ["/login", "/signup", "/verify-email", "/"];
    const isPublicPath = publicPaths.includes(pathname);
    const isTenantPath = pathSegments.length >= 2 && !isPublicPath;

    const allSystemKeys = getAllAccessKeys(); 
    const routeKey = pathSegments.find(segment => allSystemKeys.includes(segment)) || pathSegments[1];

    console.log("===================== ROUTING EVALUATION =========================");
    console.log("Evaluated Target Pathname:", pathname);
    console.log("Identified Role Security Key:", routeKey);

    // 4. PASSWORD CHANGE ENFORCEMENT
    if (session?.needsPasswordChange) {
        const resetPath = `/${session.businessSlug}/reset-password`;
        if (pathname !== resetPath) {
            const redirectPass = NextResponse.redirect(new URL(resetPath, request.url));
            // Clone sliding session cookie to the new redirect response object
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

    // 6. AUTHENTICATED USER TRYING TO ACCESS PUBLIC PATHS
    if (session && isPublicPath) {
        const redirectDash = NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
        if (requestSession) redirectDash.cookies.set(POS_COOKIE_NAME, requestSession.value, response.cookies.get(POS_COOKIE_NAME));
        return redirectDash;
    }

    // 7. TENANT ISOLATION & PERMISSIONS
    if (session && isTenantPath) {
        if (urlSlug !== session.businessSlug) {
            const redirectIso = NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
            if (requestSession) redirectIso.cookies.set(POS_COOKIE_NAME, requestSession.value, response.cookies.get(POS_COOKIE_NAME));
            return redirectIso;
        }
    
        const systemRoutes = ["dashboard", "profile", "reset-password"];
        if (systemRoutes.includes(routeKey)) {
            return response;
        }

        const hasFullAccess = session.access.includes("*");
        const hasSpecificAccess = session.access.includes(routeKey);

        if (!hasFullAccess && !hasSpecificAccess) {
            const redirectAuth = NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
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


