import { SignUpService } from "@/lib/services/auth/signup-service";
import { NextRequest,  } from "next/server";

export async function POST(request: NextRequest) {
        const rawData = await request.json();
        const response = await SignUpService.signUp(rawData);
        return response;
}