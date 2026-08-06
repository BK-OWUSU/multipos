import { NextResponse } from "next/server";
import { getSession } from "@/lib/auths-functions";
import { InvoiceService } from "@/lib/services/business/invoice-service"; // Adjust path to match your service directory layout

// ── EXPLICIT UNION TYPE BOUNDARIES MATCHING INVOICE/SALE SCHEMAS ──
type SaleStatus = "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED";
type PaymentType = "CASH" | "MOMO" | "CARD" | "SPLIT";

export async function GET(req: Request) {
  try {
    // 1. Verify multi-tenant authorization context via secure server session
    const session = await getSession();
    if (!session || typeof session === "string") {
      return NextResponse.json(
        { error: "Unauthorized access profile configuration.", success: false }, 
        { status: 401 }
      );
    }
    const { businessId, shopId } = session;

    // 2. Extract dynamic filters and pagination markers from the incoming URL query stream
    const { searchParams } = new URL(req.url);
    
    const period = searchParams.get("period") || "current-week";
    const statusQuery = searchParams.get("status");
    const paymentTypeQuery = searchParams.get("paymentType");
    const shopParam = searchParams.get("shopId") || undefined;
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Formatter helper to isolate standard "YYYY-MM-DD" local time boundaries
    const toDateString = (date: Date) => date.toISOString().split("T")[0];

    const today = new Date();
    let startDateString: string | undefined;
    let endDateString: string | undefined;
    let selectedShopId: string | undefined;

    // 3. Evaluate scope routing based on incoming shop parameters
    switch (shopParam) {
      case "current-shop":
        selectedShopId = shopId || undefined;
        break;
      case "all":
        selectedShopId = undefined;
        break;
      default:
        selectedShopId = shopParam;    
    }

    // 4. Map calendar tracking tokens to concrete string date filters
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

    // 5. Strict Type Guards: Sanitize parameters before passing down to Prisma 
    const isValidStatus = (val: string | null): val is SaleStatus => 
      ["COMPLETED", "PENDING", "CANCELLED", "REFUNDED"].includes(val ?? "");

    const isValidPayment = (val: string | null): val is PaymentType => 
      ["CASH", "MOMO", "CARD", "SPLIT"].includes(val ?? "");

    const status = isValidStatus(statusQuery) ? statusQuery : undefined;
    const paymentType = isValidPayment(paymentTypeQuery) ? paymentTypeQuery : undefined;

    // 6. Execute background service stream using unified payload schema criteria
    const response = await InvoiceService.getInvoiceHistory({
      businessId,
      shopId: selectedShopId,
      status,
      paymentType,
      startDate: startDateString,
      endDate: endDateString,
      page,
      limit,
    });

    return NextResponse.json(response, { status: response.status || 200 });

  } catch (error: unknown) {
    console.error("Fatal route compilation crash across invoice API gateway:", error);
    const errMsg = error instanceof Error ? error.message : "Fatal system exception processing dataset.";
    return NextResponse.json({ error: errMsg, success: false }, { status: 500 });
  }
}