import { getSession } from "@/lib/auths-functions";
import { BusinessService } from "@/lib/services/business/business-profile-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await getSession();

    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
    }

    const { businessId } = session;

    if (!businessId) {
        return NextResponse.json({ error: "Business ID not found in session", success: false }, { status: 400 });
    }

    const response = await BusinessService.getBusinessProfileService(businessId);

    if (response.success) {
        return NextResponse.json(
            { success: response.success, data: response.data }, 
            { status: 200 }
        );
    } else {
        return NextResponse.json(
            { success: response.success, error: response.message }, 
            { status: 404 }
        );
    }
}