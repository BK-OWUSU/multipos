import { getSession } from "@/lib/auths-functions";
import { ShopService } from "@/lib/services/business/shop-service";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
        const body = await request.json();
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        
        const { businessId, userId } = session;
        const response = await ShopService.createShop(body,businessId, userId);
        
        if (response.success && response.message) {
            const shop = response.data
            return NextResponse.json({success: response.success, shop, message: response.message }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}


export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        const { businessId } = session;
        const response = await ShopService.getShops(businessId);
        
        if (response.success && response.data) {
            const shops = response.data
            return NextResponse.json({success: response.success, data: shops }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}