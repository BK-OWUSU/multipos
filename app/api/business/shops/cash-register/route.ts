import { getSession } from "@/lib/auths-functions";
import { SaleService } from "@/lib/services/business/sale-service";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        
        const { businessId, shopId } = session;
        const response = await SaleService.getAllCashSessions({businessId,shopId })
        
        if (response.success) {
            const sessions = response.sessions

            return NextResponse.json({success: response.success, data: sessions }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: 400 });
        }
}