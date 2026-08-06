import { NotificationCategory } from "@/generated/prisma/client";
import { getSession } from "@/lib/auths-functions";
import { NotificationService } from "@/lib/services/business/notification-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
          const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }

        const { employeeId, businessId } = session;
        const searchParams = request.nextUrl.searchParams;

        // Parse query parameters matching your service method signature
        const isReadParam = searchParams.get("isRead");
        const isRead = isReadParam !== null ? isReadParam === "true" : undefined;
        
        const category = searchParams.get("category") as NotificationCategory | undefined;
        const search = searchParams.get("search") || undefined;
        
        const pageParam = searchParams.get("page");
        const page = pageParam ? parseInt(pageParam, 10) : undefined;
        
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : undefined;

        const empId = employeeId ? employeeId : ""
        
        const response = await NotificationService.getNotifications({
            businessId,
            employeeId: empId,
            isRead,
            category,
            search,
            page,
            limit,
        });

        if (!response.success) {
            return NextResponse.json({ error: response.error, success: false }, { status: 500 });
        }

        return NextResponse.json(
            {
                success: true,
                message: "Notifications retrieved successfully.",
                data: response.data,
                meta: response.meta,
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("API_FETCH_NOTIFICATIONS_ERROR:", error);
        return NextResponse.json(
            {
                success: false,
                error: (error as Error).message || "An unexpected error occurred while fetching notifications.",
            },
            { status: 500 }
        );
    }
}