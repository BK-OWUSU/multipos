import { OTPResponse } from "@/types/auth/auth";
import { prisma } from "./dbHelper";
import bcrypt from "bcrypt"
import { Prisma } from "@/generated/prisma/client";
import crypto from "crypto"

// Generate OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Save OTP (HASHED)
export async function saveOTP(userId: string, code: string, transact: Prisma.TransactionClient): Promise<void> {
    const hashedOTP = await bcrypt.hash(code, 10);
    // delete old OTPs
    await transact.oTPVerification.deleteMany({
      where: { userId, isUsed: false },
    });

    // save new OTP
    await transact.oTPVerification.create({
      data: {userId,code: hashedOTP,expiresAt: new Date(Date.now() + 10 * 60 * 1000)},
      });
  
}

//Verify OTP
export async function verifyOTP(userId: string, code: string): Promise<OTPResponse> {
  if (!code) return { valid: false, message: "OTP code is required" };

  return await prisma.$transaction(async (tx) => {
    // 1. Fetching the OTP within the transaction
    const otp = await tx.oTPVerification.findFirst({
      where: { userId, isUsed: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return { valid: false, message: "Invalid or already used OTP" };
    }

    // 2. CHECK EXPIRY (Before heavy bcrypt work)
    if (new Date() > otp.expiresAt) {
      return { valid: false, message: "OTP has expired. Please request a new one" };
    }

    // 3. COMPARE HASH
    const isMatch = await bcrypt.compare(code, otp.code);
    if (!isMatch) {
      return { valid: false, message: "Invalid OTP" };
    }

    // 4. MARK AS USED (Inside the same transaction)
    await tx.oTPVerification.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return { valid: true, message: "OTP verified successfully" };
  });
}