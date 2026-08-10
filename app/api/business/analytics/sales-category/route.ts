import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { CategorySalesAnalyticsService, DateFilterPreset } from "@/lib/services/analytics_dashboards/sales-by-category-analytics";

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }

        const { businessId, shopId: sessionShopId } = session;
        const searchParams = request.nextUrl.searchParams;

        // 1. Get shopId from query params (or fallback to session shopId or "All Shops")
        const shopId = searchParams.get("shopId") || sessionShopId;
        if (!businessId) {
            return NextResponse.json(
                { error: "businessId is missing from session", success: false },
                { status: 400 }
            );
        }

        const filterParam = searchParams.get("filter");
        const validFilters: DateFilterPreset[] = ["daily", "current_week", "last_week", "current_month", "last_month", "custom"];
        const filter = validFilters.includes(filterParam as DateFilterPreset) ? (filterParam as DateFilterPreset) : "current_month";

        // 2. Parse custom dates only if they are passed
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const customStartDate = startDateParam ? parseISO(startDateParam) : undefined;
        const customEndDate = endDateParam ? parseISO(endDateParam) : undefined;

        // 3. Optional comparison flag (defaults to true if not specified)
        const compareWithPreviousParam = searchParams.get("compareWithPrevious");
        const compareWithPrevious = compareWithPreviousParam !== null ? compareWithPreviousParam === "true" : true;

        // 4. Fetch comprehensive category sales analytics report using the service method
        const categorySalesData = await CategorySalesAnalyticsService.getCategorySalesAnalyticsReport({
            businessId,
            shopId: shopId || undefined,
            filter,
            customStartDate,
            customEndDate,
            compareWithPrevious,
        });
        
        return NextResponse.json(
            {
                success: true,
                message: "Category sales analytics report retrieved successfully.",
                data: categorySalesData,
            },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error("API_FETCH_CATEGORY_SALES_ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message || "An unexpected error occurred while fetching category sales records.",
            },
            { status: 500 }
        );
    }
}