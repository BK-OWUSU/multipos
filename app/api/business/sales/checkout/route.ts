import { getPOSCashSession } from "@/lib/auths-functions";
import { getRequestMeta } from "@/lib/getRequestMeta";
import { SaleService } from "@/lib/services/business/sale-service";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    // 1. Get and verify the session cookie
    const session = await getPOSCashSession();
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
    }
    const { ipAddress } = await getRequestMeta();
    const {shopId, employeeId, businessId, cashSessionId, userId} = session;
    const body = await request.json();
    const response = await SaleService.processCheckout(body,shopId, employeeId,userId,businessId, cashSessionId,ipAddress);
    if (response.status && response.message) {
        const data = response.data;
        return NextResponse.json({ success: true, message: response.message, data: data },{ status: 201 });
    } else {
        return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
    }
}
