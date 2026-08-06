import { getSession } from "@/lib/auths-functions";
import { LoyaltyService } from "@/lib/services/business/LoyaltyService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        
        const { businessId } = session;

        // 2. Extract query parameters from URL safely
        const { searchParams } = new URL(request.url);
        
        const search = searchParams.get("search") || undefined;
        const tierId = searchParams.get("tierId") || undefined;
        
        // Validate status parameter value against your service's union types
        const rawStatus = searchParams.get("status");
        const status = (rawStatus === "ACTIVE" || rawStatus === "BLOCKED") ? rawStatus : "ACTIVE"; // defaults to ACTIVE if invalid
        
        // Coerce pagination values into numbers safely
        const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
        const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

        // 3. Call the updated service method passing the extracted filters
        const response = await LoyaltyService.getMembersList(businessId, {
            search,
            tierId,
            status,
            page,
            limit
        });
        
        // 4. Return response matching the layout expected by your table/view
        if (response.success && response.data) {
            return NextResponse.json({
                success: true, 
                data: response.data, 
                meta: response.meta 
            }, { status: 200 });
        } else {
            return NextResponse.json({ 
                error: response.error || "Failed to fetch members", 
                success: false 
            }, { status: response.status || 400 });
        }

    } catch (error) {
        console.error("LOYALTY_MEMBERS_API_GET_ERROR:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            success: false 
        }, { status: 500 });
    }
}