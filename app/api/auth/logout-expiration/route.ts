import { LogoutService } from "@/lib/services/auth/logout-service";
import {clearEmailVerificationSessionCookie, clearPOSAppSessionCookie, getSession } from "@/lib/auths-functions"
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
      const reason = "Inactivity Timeout"
        
        const session = await getSession();
          if (!session || typeof session === "string") {
            return NextResponse.json({ error: "User already logout", success: false }, { status: 401 });
          }
        const { sessionLogId , userId, businessId, businessSlug } = session;
        // Save backend session/audit log here
        console.log(`User ${userId} from ${businessSlug} logged out due to: ${reason}`);
        
        const response = await LogoutService.logoutExpiration(sessionLogId || "", userId, businessId, reason);
        if (response.status && response.success) {
        const res = NextResponse.json({success: true, message: "Logged out successfully" },{ status: 200 })

        clearPOSAppSessionCookie(res);
        clearEmailVerificationSessionCookie(res)
        return res;
    } else {
        return NextResponse.json({ error: response.error, success: false }, { status: response.status || 500 });
    }

    } catch (error: unknown) {
        console.error("Error logging session expiration: ", error);
        return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
    }
}
