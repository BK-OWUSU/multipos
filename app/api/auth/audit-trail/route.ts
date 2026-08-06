import { NextRequest, NextResponse } from "next/server";
import { AuditLogQueryFiltersSchema } from "@/types/auth/auditLogs";
import { AuditLogService } from "@/lib/services/business/audit-log-service";
import { getSession } from "@/lib/auths-functions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

     const session = await getSession();
            if (!session || typeof session === "string") {
                return NextResponse.json({ error: "Unauthorized",success: false }, { status: 401 });
            }
        const { businessId } = session;

    // 1. Map URL Search Params into an object for Zod evaluation
    const queryPayload = {
      businessId: businessId,
      tab: searchParams.get("tab") || "all",
      shopId: searchParams.get("shopId") || null,
      userId: searchParams.get("userId") || null,
      search: searchParams.get("search") || "",
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      startDate: searchParams.get("startDate") || null,
      endDate: searchParams.get("endDate") || null,
    };

    // 2. Safe parsing via your Zod runtime configuration schema
    const validationResult = AuditLogQueryFiltersSchema.safeParse(queryPayload);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_FAILED",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 3. Request payload transmission down to database aggregator
    const logDashboardData = await AuditLogService.getDashboardPayload(validationResult.data);

    // 4. Return unified response data payload
    return NextResponse.json(logDashboardData, { status: 200 });

  } catch (error: unknown) {
    console.error("CRITICAL_AUDIT_LOG_FETCH_FAILURE:", error);
    
    return NextResponse.json(
      { 
        error: "INTERNAL_SERVER_ERROR", 
        message: "Failed to assemble unified multi-tenant audit logs." 
      },
      { status: 500 }
    );
  }
}