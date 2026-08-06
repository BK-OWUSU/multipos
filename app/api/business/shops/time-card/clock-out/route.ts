import { NextResponse } from "next/server";
import { getSession } from "@/lib/auths-functions";
import { TimeCardService } from "@/lib/services/business/timecard-service";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { timeCardId, notes } = body;

    // 1. Guard against empty structural references
    if (!timeCardId) {
      return NextResponse.json({ error: "Target time card reference identifier is missing.", success: false }, { status: 400 });
    }

    // 2. Verify authorization state
    const session = await getSession();
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized access.", success: false }, { status: 401 });
    }
          
    const { businessId, userId, employeeId } = session;

    // 3. Dispatch changes to the atomic database service wrapper
    const response = await TimeCardService.clockOut({
      employeeId,
      timeCardId,
      businessId,
      userId,
      notes, // save custom shift closing remarks
    });

    if (response.success) {
      return NextResponse.json({
        success: true,
        message: "Shift closed cleanly. Duration logged to file.",
        data: response.data,
      }, { status: 200 });
    }

    return NextResponse.json({ 
      error: response.error, 
      success: false 
    }, { status: response.status || 400 });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Fatal router gateway error.";
    return NextResponse.json({ error: errMsg, success: false }, { status: 500 });
  }
}