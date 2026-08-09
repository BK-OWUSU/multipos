import { NextResponse } from "next/server";
import { getSession } from "@/lib/auths-functions";
import { TimeCardService } from "@/lib/services/business/timecard-service";
// 🟢 Define explicit union types matching your TimeCard system models
type TimeCardStatus = "ACTIVE" | "COMPLETED" | "MISSED_CLOCK_OUT";

export async function GET(req: Request) {
  try {
    // 1. Verify user authorization context via secure session
    const session = await getSession();
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized access.", success: false }, { status: 401 });
    }
    const { businessId, shopId } = session;

    // 2. Extract query filters and pagination tokens from the URL
    const { searchParams } = new URL(req.url);
    
    const period = searchParams.get("period") || "current-week";
    const statusQuery = searchParams.get("status");
    const shop = searchParams.get("shopId") || undefined;
    const targetEmployeeId = searchParams.get("employeeId") || undefined;
    const search = searchParams.get("search") || undefined;
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Helper to format Date instances into standard "YYYY-MM-DD" local strings
    const toDateString = (date: Date) => date.toISOString().split("T")[0];

    const today = new Date();
    let startDateString: string | undefined;
    let endDateString: string | undefined;
    let selectedShopId: string | undefined;

    // Smart parsing for shop context abstraction
    switch (shop) {
      case "current-shop":
        selectedShopId = shopId || undefined;
        break;
      case "all":
        selectedShopId = undefined;
        break;
      default:
        selectedShopId = shop;    
    }

    // 3. Match period tokens to concrete string boundaries
    switch (period) {
      case "custom":
        startDateString = customStartDate || undefined;
        endDateString = customEndDate || undefined;
        break;
      case "today":
        startDateString = toDateString(today);
        endDateString = toDateString(today);
        break;

      case "current-week": {
        const currentDay = today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - currentDay);
        
        startDateString = toDateString(sunday);
        endDateString = toDateString(today);
        break;
      }

      case "last-week": {
        const currentDay = today.getDay();
        const previousSunday = new Date(today);
        previousSunday.setDate(today.getDate() - currentDay - 7);
        
        const previousSaturday = new Date(previousSunday);
        previousSaturday.setDate(previousSunday.getDate() + 6);
        
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
        startDateString = undefined;
        endDateString = undefined;
    }

    // 🟢 Strict Type Guard: Verifies status values belong to the valid set before casting
    const isValidStatus = (val: string | null): val is TimeCardStatus => 
      ["ACTIVE", "COMPLETED", "MISSED_CLOCK_OUT"].includes(val ?? "");

    const status = isValidStatus(statusQuery) ? statusQuery : undefined;

    // 4. Fire the service request using parameters matching your totalHoursWorked service schema
    const response = await TimeCardService.totalHoursWorked({
      businessId,
      shopId: selectedShopId,
      employeeId: targetEmployeeId, 
      status,
      startDate: startDateString,
      endDate: endDateString,
      search,
      page,
      limit,
    });

    return NextResponse.json(response, { status: response.status || 200 });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Fatal server retrieval error.";
    return NextResponse.json({ error: errMsg, success: false }, { status: 500 });
  }
}