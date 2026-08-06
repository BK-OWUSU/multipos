import { getSession } from "@/lib/auths-functions";
import { InventoryService } from "@/lib/services/business/shopInventory.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }

        const { businessId } = session;
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters from the frontend request URL
        const shopId = searchParams.get("shopId") || undefined;
        const search = searchParams.get("search") || undefined;
        const categoryId = searchParams.get("categoryId") || undefined;
        
        // Validate and map status parameter if present
        const statusParam = searchParams.get("status");
        const status = (statusParam === "IN_STOCK" || statusParam === "LOW_STOCK" || statusParam === "OUT_OF_STOCK") 
            ? statusParam 
            : undefined;

        const pageParam = searchParams.get("page");
        const page = pageParam ? parseInt(pageParam, 10) : undefined;
        
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam) : undefined;

        // Call the inventory query service method
        const response = await InventoryService.getInventoryList({
            businessId,
            shopId,
            search,
            categoryId,
            status,
            page,
            limit,
        });

        if (!response.success) {
            return NextResponse.json({ error: response.error, success: false }, { status: response.status || 500 });
        }

        return NextResponse.json(
            {
                success: true,
                message: "Inventory items retrieved successfully.",
                data: response.data,
                meta: response.meta,
            },
            { status: response.status || 200 }
        );
    } catch (error: unknown) {
        console.error("API_FETCH_INVENTORY_ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message || "An unexpected error occurred while fetching inventory records.",
            },
            { status: 500 }
        );
    }
}