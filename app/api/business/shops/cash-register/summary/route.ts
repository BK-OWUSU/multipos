import { getSession } from "@/lib/auths-functions";
import { SaleService } from "@/lib/services/business/sale-service";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        
        const { businessId, shopId } = session;
        const response = await SaleService.getAllCashSessions({businessId,shopId })
        
        if (response.success && response.sessions) {
            const mappedSessions = response.sessions.map((session) => {
            // Safely concatenate employee names if they exist
            const openedByEmployee = session.openedBy 
            ? `${session.openedBy.firstName} ${session.openedBy.lastName}`.trim()
            : "System Operator";

            const closedByEmployee = session.closedBy
            ? `${session.closedBy.firstName} ${session.closedBy.lastName}`.trim()
            : null;

            return {
            id: session.id,
            customId: session.customId,
            openedBy: openedByEmployee,       // Combined cleanly for your UI column
            closedBy: closedByEmployee,       // Combined cleanly for your UI column
            openedAt: session.openedAt,
            closedAt: session.closedAt,
            startFloat: session.startFloat,
            status: session.status
            };
        });

            return NextResponse.json({success: response.success, data: mappedSessions }, { status: 200 });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: 400 });
        }
}