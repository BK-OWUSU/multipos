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
        const response = await LoyaltyService.getSummaryMetrics(businessId);
        
        if (response.success && response.data) {
            const loyaltySummaryMetrics = response.data
            return NextResponse.json({success: response.success, data: loyaltySummaryMetrics }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}