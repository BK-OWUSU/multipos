import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        //TODO: App settings will be implemented later
      
}