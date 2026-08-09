import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { DateFilterPreset, ShopDashboardService } from "@/lib/services/analytics_dashboards/shop-dashbaord.service";


export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }

        const { businessId, shopId: sessionShopId } = session;
        const searchParams = request.nextUrl.searchParams;

        // 1. Get shopId from query params (for switching branches) or fallback to session shopId
        const shopId = searchParams.get("shopId") || sessionShopId;
        if (!shopId) {
            return NextResponse.json(
                { error: "shopId is missing from session and query parameters", success: false },
                { status: 400 }
            );
        }

        const filterParam = searchParams.get("filter");
        const validFilters: DateFilterPreset[] = ["daily", "current_week", "current_month", "last_month", "custom"];
        const filter = validFilters.includes(filterParam as DateFilterPreset) ? (filterParam as DateFilterPreset) : "daily";

        // 2. Parse custom dates only if they are passed
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const customStartDate = startDateParam ? parseISO(startDateParam) : undefined;
        const customEndDate = endDateParam ? parseISO(endDateParam) : undefined;

        // 3. Fetch all aggregated dashboard data using the static service method
        const dashboardData = await ShopDashboardService.getStoreDashboardData({
            businessId,
            shopId,
            filter,
            customStartDate,
            customEndDate,
        });
        
        return NextResponse.json(
            {
                success: true,
                message: "Shop dashboard analytics retrieved successfully.",
                data: dashboardData,
            },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error("API_FETCH_SHOP_DASHBOARD_ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message || "An unexpected error occurred while fetching shop dashboard records.",
            },
            { status: 500 }
        );
    }
}