import { getSession } from "@/lib/auths-functions";
import { LoyaltyService } from "@/lib/services/business/LoyaltyService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        const { businessId } = session;
        const response = await LoyaltyService.getConfiguration(businessId);
        
        if (response.success && response.data) {
            const loyaltyConfig = response.data
            return NextResponse.json({success: response.success, data: loyaltyConfig }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}