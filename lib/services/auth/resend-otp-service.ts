import { prisma } from "@/lib/dbHelper"
import { saveOTP, generateOTP } from "@/lib/otp"
import { sendOTPEmail } from "@/lib/email"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {setEmailVerificationSessionCookie, VERIFY_COOKIE_NAME, verifyEmailVerificationToken } from "@/lib/auths-functions"

export class ResendOTPService {
static async resendOTPService() {
  try {
    const cookieStore = await cookies();
    const verify_token = cookieStore.get(VERIFY_COOKIE_NAME)?.value;

    if (!verify_token) {
        return NextResponse.json({ error: "Unauthorized", success: false },{ status: 401 })
    } 

    const decode = verifyEmailVerificationToken(verify_token) || null;
    if (!decode) {
        return NextResponse.json({ error: "Invalid or expired verification session", success: false },{ status: 401 });
    }

    const { userId, email: tokenEmail } = decode; 

    // 1. Find user and their linked employee record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true 
      }
    })

    if (!user || !user.employee) {
      return NextResponse.json({ error: "Account record not found", success: false },{ status: 404 })
    }

    // 2. Validate token email against Employee email
    if (user.employee.email !== tokenEmail) {
      return NextResponse.json({ error: "Invalid verification session", success: false },{ status: 401 });
    }

    // 3. Check verification status
    if (user.isVerified) {
      return NextResponse.json({ error: "Email already verified", success: false },{ status: 400 })
    }

    // 4. Generate and save new OTP within a transaction
    const results = await prisma.$transaction(async (transact) => {
      const otp = generateOTP();
      await saveOTP(user.id, otp, transact);
      return { code: otp };
    });
    
    const { code } = results;

    // 5. Send the email using Employee data
    try {
      await sendOTPEmail(
          user.employee.email,
          user.employee.firstName,
          code
      );
      
      console.log("Email sent to", user.employee.email, "with OTP:", code);
    } catch (emailError) {
      console.error("Error sending OTP email: ", emailError);
      return NextResponse.json({ error: "Failed to send OTP email", success: false },{ status: 500 });
    }

    // 6. Generate a fresh token and update the cookie
    const emailToken_object = {
      userId: user.id, 
      email: user.employee.email,
      purpose: "New OTP Email verification",
      businessId: user.employee.businessId, 
    }

    const response = NextResponse.json({ success: true, message: "New OTP sent to your email" },{ status: 200 });
    setEmailVerificationSessionCookie(response, emailToken_object);
    return response;
  } catch (error) {
    console.error("Resend OTP error:", error)
    return NextResponse.json({ error: "Internal Server Error", success: false },{ status: 500 })
  }
}
}