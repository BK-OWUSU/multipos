import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { DashboardService, DatePreset } from "@/lib/services/analytics_dashboards/business-dashboard.service";

const dashboardService = new DashboardService();

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }

        const { businessId } = session;
        const searchParams = request.nextUrl.searchParams;

        // 1. Extract shopId and preset query parameters
        const shopId = searchParams.get("shopId") || undefined;
        const presetParam = searchParams.get("preset");
        
        // Validate if preset matches expected values, otherwise leave undefined to let the service handle defaults/customs
        const validPresets: DatePreset[] = ["daily", "current_week", "current_month", "last_month", "custom"];
        const preset = validPresets.includes(presetParam as DatePreset) ? (presetParam as DatePreset) : undefined;

        // 2. Parse custom dates only if they are passed
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const startDate = startDateParam ? parseISO(startDateParam) : undefined;
        const endDate = endDateParam ? parseISO(endDateParam) : undefined;

        const params = { 
            businessId, 
            shopId, 
            preset, 
            startDate, 
            endDate 
        };

        // Fetch all dashboard data concurrently
        const [metrics, overview, categorySales, widgets] = await Promise.all([
            dashboardService.getDashboardMetrics(params),
            dashboardService.getSalesOverview(params),
            dashboardService.getSalesByCategory(params),
            dashboardService.getDashboardWidgets(params),
        ]);

        return NextResponse.json(
            {
                success: true,
                message: "Dashboard analytics retrieved successfully.",
                data: {
                    metrics,
                    overview,
                    categorySales,
                    ...widgets,
                },
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API_FETCH_DASHBOARD_ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message || "An unexpected error occurred while fetching dashboard records.",
            },
            { status: 500 }
        );
    }
}