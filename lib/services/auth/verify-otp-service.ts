import { prisma } from "@/lib/dbHelper"
import { verifyOTP } from "@/lib/otp"
import { clearEmailVerificationSessionCookie, setEmailVerificationSessionCookie, setPOSAppSessionCookie, VERIFY_COOKIE_NAME, verifyEmailVerificationToken } from "@/lib/auths-functions"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { JwtPayload } from "@/types/auth/auth"

export class VerifyOTPService {
  static async verifyOTP(request: NextRequest) {
    const cookieStore = await cookies();
    const verify_token = cookieStore.get(VERIFY_COOKIE_NAME)?.value;
    const { code } = await request.json();
    const ipAddress =request.headers.get("x-forwarded-for") ||request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    if (!verify_token) {
      return NextResponse.json({ error: "Unauthorized or expired verification session", success: false }, { status: 401 })
    } 

    const decode = verifyEmailVerificationToken(verify_token) || null;
    if (!decode) {
      return NextResponse.json({ error: "Invalid or expired verification session", success: false }, { status: 401 });
    }

    const { userId, email: tokenEmail } = decode; 

    // 1. Fetch user including the nested employee profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        employee: {
          include: { business: true, role: true }
        } 
      }
    })

    if (!user || !user.employee) {
      return NextResponse.json({ error: "Account record not found", success: false }, { status: 404 })
    }

    const emp = user.employee;

    // 2. Validate session email against the employee profile email
    if (emp.email !== tokenEmail) {
      return NextResponse.json({ error: "Invalid verification session", success: false }, { status: 401 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Email already verified", success: false }, { status: 400 })
    }
    
    // 3. Verify OTP code
    const result = await verifyOTP(userId, code)
    if (!result.valid) {
      return NextResponse.json({ error: result.message, success: false }, { status: 400 })
    }


    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isVerified: true }
      });

      if (emp.role.name === "OWNER" && !emp.business.isEmailVerified) {
          // Update the business profile to mark email as verified
          await tx.business.update({
            where: { id: emp.businessId },
            data: { isEmailVerified: true }
          });

          // Create an audit log entry for the email verification
          await tx.auditLog.create({
            data: {
              action: "EMAIL_VERIFICATION",
              entity: "USER",
              entityId: userId,
              userId: userId,
              businessId: emp.businessId,
              newValue: "User email verified",
              oldValue: "***SENSITIVE***",
              details: `User, ${emp.firstName} ${emp.lastName}, completed email verification.`
            }
          });
      }
    });

    // 5. Handle initial password change requirement
    if (user.needsPasswordChange) {
      const response = NextResponse.json(
        {
          message: "Email verified. Please change your password to continue.",
          success: true,
          requiresPasswordChange: true, 
          redirectTo: `/${emp.business.slug}/reset-password`,
        },
        { status: 200 }
      );

      const user_details = {
        userId: user.id, 
        email: user.employee.email,
        purpose: "New OTP Email verification",
        businessId: user.employee.businessId,
      }

      //Setting Cookie for user who need password change for the first time 
      setEmailVerificationSessionCookie(response, user_details)
      return response;
    }

    // 6. Generate the final Session Token (Include employeeId and businessId)
    const token_object: JwtPayload = {
        userId: user.id,
        employeeId: emp.id,
        businessId: emp.businessId,
        businessSlug: emp.business.slug,
        roleName: emp.role.name,
        roleId: emp.role.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        access: emp.role.access,
        needsPasswordChange: user.needsPasswordChange
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        businessSlug: emp.business.slug,
        redirectTo: `/${emp.business.slug}/dashboard`
      },
      { status: 200 }
    )

    setPOSAppSessionCookie(response, token_object);
    // Clear verification session
    clearEmailVerificationSessionCookie(response)
      // 4. Successful Login - 
      // Creating session log
       await prisma.userSessionLog.create({
       data: {
           userId: user.id,
           businessId: emp.businessId,
           ipAddress: ipAddress,
           userAgent: userAgent,
           },
       });

    // 3. Audit Log - using user.employee.businessId
      await prisma.auditLog.create({
        data: {
          action: "OTP_VERIFICATION",
          entity: "USER",
          entityId: userId,
          userId: userId,
          businessId: user.employee.businessId,
          newValue: "User verified setup OTP",
          oldValue: "***SENSITIVE***",
          details: `User, ${user.employee.firstName} ${user.employee.lastName} completed OTP verification.`
        }
      });
    return response

  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", success: false },
      { status: 500 }
    )
  }
}
}