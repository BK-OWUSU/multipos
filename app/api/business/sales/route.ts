import { NextResponse } from "next/server";
import { getSession } from "@/lib/auths-functions";
import { SaleService } from "@/lib/services/business/sale-service"; 

// 🟢 Define explicit union types matching your system models
type SaleStatus = "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED";
type PaymentMethod = "CASH" | "MOMO" | "SPLIT";

export async function GET(req: Request) {
  try {
    // 1. Verify user authorization context via secure session
    const session = await getSession();
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized access.", success: false }, { status: 401 });
    }
    const { businessId, employeeId, shopId } = session;

    // 2. Extract query filters and pagination tokens from the URL
    const { searchParams } = new URL(req.url);
    
    const period = searchParams.get("period") || "current-week";
    const statusQuery = searchParams.get("status");
    const paymentTypeQuery = searchParams.get("paymentType");
    const shop = searchParams.get("shopId") || undefined;
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
        // Extract the custom selection parameters directly from your calendar picker inputs
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

    // 🟢 Strict Type Guards: Verifies values belong to the union set before casting
    const isValidStatus = (val: string | null): val is SaleStatus => 
      ["COMPLETED", "PENDING", "CANCELLED", "REFUNDED"].includes(val ?? "");

    const isValidPayment = (val: string | null): val is PaymentMethod => 
      ["CASH", "MOMO", "SPLIT"].includes(val ?? "");

    const status = isValidStatus(statusQuery) ? statusQuery : undefined;
    const paymentType = isValidPayment(paymentTypeQuery) ? paymentTypeQuery : undefined;

    // 4. Fire the service request using parameters matching your Service schema
    const response = await SaleService.getSalesHistory({
      businessId,
      shopId: selectedShopId,
      employeeId: employeeId || undefined, 
      status,
      paymentType,
      startDate: startDateString,
      endDate: endDateString,
      page,
      limit,
    });

    return NextResponse.json(response, { status: response.status || 200 });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Fatal server retrieval error.";
    return NextResponse.json({ error: errMsg, success: false }, { status: 500 });
  }
}