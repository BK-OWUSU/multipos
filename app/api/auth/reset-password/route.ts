import { NextRequest,  } from "next/server";
import { ResetPasswordService} from "@/lib/services/auth/reset-password-service";

export async function POST(request: NextRequest) {
   const response = await ResetPasswordService.resetPasswordService(request)
   return response;
  }