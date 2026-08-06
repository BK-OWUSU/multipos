import { ResendOTPService } from "@/lib/services/auth/resend-otp-service"
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
   
  const response = await ResendOTPService.resendOTPService();
  return response;
}