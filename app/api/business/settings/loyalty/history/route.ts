import { LoyaltyActionType } from "@/generated/prisma/enums";
import { getSession } from "@/lib/auths-functions";
import { LoyaltyService } from "@/lib/services/business/LoyaltyService";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
    try {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        const { businessId } = session;

        // 2. Extract filter & pagination query strings from the request URL
        const { searchParams } = new URL(request.url);
        
        const search = searchParams.get("search") || undefined;
        const shopId = searchParams.get("shopId") || undefined;
        
        // Handle type parameter safely matching your LoyaltyActionType Enum
        const rawType = searchParams.get("type");
        const type = rawType ? (rawType as LoyaltyActionType) : undefined;
        
        // Coerce pagination strings safely to numbers
        const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
        const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

        // 3. Call the ledger service with parsed filters
        const response = await LoyaltyService.getHistoryLedger(businessId, {
            search,
            shopId,
            type,
            page,
            limit
        });
        
        // 4. Return combined payload data + pagination metadata matching your Zustand expectations
        if (response.success && response.data) {
            return NextResponse.json({
                success: true, 
                data: response.data, // This will map to `transactions` on the frontend
                meta: response.meta  // Contains total, page, limit, totalPages
            }, { status: 200 });
        } else {
            return NextResponse.json({ 
                error: response.error || "Failed to fetch ledger rows", 
                success: false 
            }, { status: response.status || 400 });
        }

    } catch (error) {
        console.error("LOYALTY_LEDGER_API_GET_ERROR:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            success: false 
        }, { status: 500 });
    }
}