import { prisma } from "@/lib/dbHelper";
import { hashPassword, PASSWORD_RESET_COOKIE_NAME, verifyEmailVerificationToken, clearPOSAppSessionCookie, clearPasswordResetSessionCookie } from "@/lib/auths-functions";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export class ResetPasswordService {
  static async resetPasswordService(request: NextRequest) {
    try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PASSWORD_RESET_COOKIE_NAME)?.value;

    if (!token) {
       console.log("HERE WAS HIT:  ", token);
       return NextResponse.json({ error: "No active session found. Please log in again.", success: false }, { status: 401 });
      }
      
      const decoded = verifyEmailVerificationToken(token);
      console.log("HERE WAS DECODE:  ", decoded);
      if (!decoded) {
      return NextResponse.json({ error: "Session expired or invalid.", success: false }, { status: 401 });
    }

    const { userId, businessId } = decoded;
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long.", success: false },{ status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Find user using findFirst to check the linked employee's businessId
      const user = await tx.user.findFirst({
        where: { 
          id: userId,
          employee: { businessId: businessId } 
        },
        include: {
          employee: {include: { business: true, role: true }},
        }
      });

      if (!user || !user.employee) {
        throw new Error("User or Employee record not found.");
      }

      // Security check: Only allow this if the flag is true
      if (!user.needsPasswordChange) {
        throw new Error("Password change is not required for this account.");
      }

      const hashed = await hashPassword(newPassword);

      // 2. Update user (must use unique 'id' for update)
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashed,
          needsPasswordChange: false,
        }
      });

      if (user.employee.role.name==="OWNER" && user.employee.business.isEmailVerified) {
          // Update the business profile to mark email as verified
          await tx.business.update({
            where: { id: user.employee.businessId },
            data: { onboardingStep: 2, isOnboarded: true }
          });
      }

      // 3. Audit Log - using user.employee.businessId
      await tx.auditLog.create({
        data: {
          action: "PASSWORD_UPDATE",
          entity: "USER",
          entityId: userId,
          userId: userId,
          businessId: user.employee.businessId,
          newValue: "User completed complete password reset",
          oldValue: "***SENSITIVE***",
          details: `User, ${user.employee.firstName} ${user.employee.lastName} changed password successfully.`
        }
      });
    });

    const response = NextResponse.json({ success: true, message: "Password updated successfully!", redirectTo: "/login" }, { status: 200 });
    // Clear both cookies
    clearPOSAppSessionCookie(response);
    clearPasswordResetSessionCookie(response)
    
    return response;

  } catch (error: unknown) {
    console.error("CHANGE_PASSWORD_ERROR:", error);
    // Provide slightly more descriptive error for project debugging
    return NextResponse.json({ error: "Internal Server Error", success: false },{ status:500 });
  }
}
}