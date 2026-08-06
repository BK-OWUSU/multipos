import { NextResponse } from "next/server";
import { getSession } from "@/lib/auths-functions";
import { TimeCardService } from "@/lib/services/business/timecard-service";

export async function POST(req: Request) {
  try {
    // Extract optional payload variables provided by the client terminal UI form
    const body = await req.json().catch(() => ({}));
    const { notes } = body;

    // Verify user authorization context via secure JWT signature
    const session = await getSession();
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized access.", success: false }, { status: 401 });
    }
          
    const { businessId, shopId, employeeId, userId } = session;

    // Guard: Ensure the session actually has a valid employeeId associated with it
    if (!employeeId) { return NextResponse.json({ error: "Session context is missing a linked employee profile setup.", success: false}, { status: 400 });
    }

    // Call the transaction service handler using secure variables from the session
    const response = await TimeCardService.clockIn({
      employeeId,
      businessId,
      userId,
      shopId: shopId || undefined,
      notes, // forward the custom optional notes
    });

    if (response.success) {
      return NextResponse.json({success: true,message: "Shift started successfully.",data: response.data}, { status: 200 });
    }

    return NextResponse.json({ error: response.error,success: false}, { status: response.status || 400 });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Fatal router gateway error.";
    return NextResponse.json({ error: errMsg, success: false }, { status: 500 });
  }
}