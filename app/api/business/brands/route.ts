import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { BrandService } from "@/lib/services/business/brand-service";



export async function POST(request: NextRequest) {

        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }
        const { userId, businessId, businessSlug } = session;
        const body = await request.json();
        const response = await BrandService.createBrandService(body, userId, businessId, businessSlug);
  
        if (response.success && response.message) {
            return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }      
}

export async function GET(request: NextRequest) {

        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const { businessId } = session;

        const response =  await BrandService.getAllBrandsService(businessId);

        if (response.success && response.data) {
            return NextResponse.json({success: response.success, brands: response.data}, {status: 200})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: 500})
        }

}