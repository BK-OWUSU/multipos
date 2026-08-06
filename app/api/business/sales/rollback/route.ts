import { getPOSCashSession } from "@/lib/auths-functions";
import { SaleService } from "@/lib/services/business/sale-service";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    // 1. Get and verify the session cookie
    const session = await getPOSCashSession();
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
    }
    const {shopId, employeeId, businessId, userId} = session;
    const {saleId} = await request.json();


    const response = await SaleService.rollbackCheckout(saleId, shopId, employeeId,businessId,userId)
    if (response.success && response.message) {
        return NextResponse.json({ success: true, message: response.message},{ status: response.status });
    } else {
        return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
    }
}
