import { NextRequest } from "next/server"
import { VerifyOTPService } from "@/lib/services/auth/verify-otp-service"

export async function POST(request: NextRequest) {
  const response = await VerifyOTPService.verifyOTP(request);
  return response
}