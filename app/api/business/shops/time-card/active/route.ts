import { NextResponse } from "next/server";
import { getSession } from "@/lib/auths-functions";
import { TimeCardService } from "@/lib/services/business/timecard-service";

export async function GET(req: Request) {
  try {
    // 1. Verify user authorization context via secure JWT signature
    const session = await getSession();
    if (!session || typeof session === "string") {
      return NextResponse.json(
        { error: "Unauthorized access.", success: false }, 
        { status: 401 }
      );
    }
          
    const { businessId, shopId, employeeId } = session;

    // 2. Guard: Ensure the session actually has a valid employeeId associated with it
    if (!employeeId) {
      return NextResponse.json(
        { error: "Session context is missing a linked employee profile setup.", success: false }, 
        { status: 400 }
      );
    }

    // 3. Request logs from service layer specifically filtered for the active shift
    const response = await TimeCardService.getTimeCardLogs({
      businessId,
      shopId: shopId || undefined,
      employeeId,
      status: "ACTIVE", // 🟢 Hardcoded safety filter: fetches ONLY open running shifts
    });

    // 4. Return matching operational response
    if (response.success) {
      return NextResponse.json({
        success: true,
        message: "Active shift state synchronized successfully.",
        data: response.data, // 🟢 Returns list of active items (typically just 1)
      }, { status: 200 });
    }

    return NextResponse.json(
      { error: response.error, success: false }, 
      { status: response.status || 400 }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Fatal active shift router gateway error.";
    return NextResponse.json({ error: errMsg, success: false }, { status: 500 });
  }
}