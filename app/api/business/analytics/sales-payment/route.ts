import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { DateFilterPreset, PaymentGroupByType, PaymentSalesAnalyticsService } from "@/lib/services/analytics_dashboards/sale-by-pamentType-analytics.service";


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

        // 2. Resolve date filter preset
        const filterParam = searchParams.get("filter");
        const validFilters: DateFilterPreset[] = ["daily", "current_week", "last_week", "current_month", "last_month", "custom"];
        const filter = validFilters.includes(filterParam as DateFilterPreset) ? (filterParam as DateFilterPreset) : "current_month";

        // 3. Parse custom dates only if they are passed
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const customStartDate = startDateParam ? parseISO(startDateParam) : undefined;
        const customEndDate = endDateParam ? parseISO(endDateParam) : undefined;

        // 4. Optional comparison flag (defaults to true if not specified)
        const compareWithPreviousParam = searchParams.get("compareWithPrevious");
        const compareWithPrevious = compareWithPreviousParam !== null ? compareWithPreviousParam === "true" : true;

        // 5. Group by parameter (defaults to "Payment Method")
        const groupByParam = searchParams.get("groupBy");
        const validGroupBys: PaymentGroupByType[] = ["Payment Method", "Daily", "Shop"];
        const groupBy = validGroupBys.includes(groupByParam as PaymentGroupByType) ? (groupByParam as PaymentGroupByType) : "Payment Method";

        // 6. Fetch payment sales analytics report using the service method
        const paymentSalesData = await PaymentSalesAnalyticsService.getPaymentSalesAnalyticsReport({
            businessId,
            shopId: shopId || undefined,
            filter,
            customStartDate,
            customEndDate,
            compareWithPrevious,
            groupBy,
        });
        
        return NextResponse.json(
            {
                success: true,
                message: "Payment sales analytics report retrieved successfully.",
                data: paymentSalesData,
            },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error("API_FETCH_PAYMENT_SALES_ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message || "An unexpected error occurred while fetching payment sales records.",
            },
            { status: 500 }
        );
    }
}