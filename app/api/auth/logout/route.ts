import { clearEmailVerificationSessionCookie, clearPOSAppSessionCookie, getSession } from "@/lib/auths-functions"
import { LogoutService } from "@/lib/services/auth/logout-service";
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || typeof session === "string") {
    return NextResponse.json({ error: "User already logout", success: false }, { status: 401 });
  }
  const response = await LogoutService.logout(session);
  if (response.status && response.success) {
        const res = NextResponse.json({success: true, message: "Logged out successfully" },{ status: 200 })

        clearPOSAppSessionCookie(res);
        clearEmailVerificationSessionCookie(res)
        return res;
    } else {
        return NextResponse.json({ error: response.error, success: false }, { status: response.status || 500 });
    }
  }