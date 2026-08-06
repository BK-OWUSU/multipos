import { NextResponse } from "next/server";
import { getSession } from "@/lib/auths-functions";
import { TimeCardService } from "@/lib/services/business/timecard-service";

export async function GET(req: Request) {
  try {
    // 1. Verify user authorization context via secure JWT signature
    const session = await getSession();
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized access.", success: false }, { status: 401 });
    }
    const { businessId, employeeId, shopId } = session;

    // 2. Extract query filters from frontend store URL append
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "current-week";

    // Helper to format Date instances into standard "YYYY-MM-DD" local format strings
    const toDateString = (date: Date) => date.toISOString().split("T")[0];

    const today = new Date();
    let startDateString: string | undefined;
    let endDateString: string | undefined;

    // 3. Match period tokens to concrete string boundaries
    switch (period) {
      case "today":
        startDateString = toDateString(today);
        endDateString = toDateString(today);
        break;

      case "current-week": {
        const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - currentDay); // Rollback to Sunday
        
        startDateString = toDateString(sunday);
        endDateString = toDateString(today); // Up to right now
        break;
      }

      case "last-week": {
        const currentDay = today.getDay();
        const previousSunday = new Date(today);
        previousSunday.setDate(today.getDate() - currentDay - 7); // Go back to last week Sunday
        
        const previousSaturday = new Date(previousSunday);
        previousSaturday.setDate(previousSunday.getDate() + 6); // End on last week Saturday
        
        startDateString = toDateString(previousSunday);
        endDateString = toDateString(previousSaturday);
        break;
      }

      case "current-month": {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateString = toDateString(firstDayOfMonth);
        endDateString = toDateString(today);
        break;
      }
      
      default:
        // Fallback option if dynamic filters aren't specified or mismatch
        startDateString = undefined;
        endDateString = undefined;
    }

    // 4. Fire the service request using parameters matching your TimeCardQueryFilters shape
    const response = await TimeCardService.getTimeCardLogs({
      businessId,
      employeeId,
      shopId: shopId || undefined,
      startDate: startDateString, // Passes string e.g. "2026-06-11"
      endDate: endDateString,     // Passes string e.g. "2026-06-17"
    });

    return NextResponse.json(response, { status: response.status || 200 });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Fatal server retrieval error.";
    return NextResponse.json({ error: errMsg, success: false }, { status: 500 });
  }
}