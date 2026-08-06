import { getPOSCashSession } from "@/lib/auths-functions";
import { SaleService } from "@/lib/services/business/sale-service";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
    // 1. Get and verify the session cookie
    const session = await getPOSCashSession();
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
    }
    
    const {shopId, employeeId, businessId} = session;
    const response = await  SaleService.getActiveOpenCashSession(shopId, employeeId, businessId);
    
    if (response.success && response.data) {
        const activeSession = response.data
            return NextResponse.json({success: response.success, data: activeSession }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
    }
}