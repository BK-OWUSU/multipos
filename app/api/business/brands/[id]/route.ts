import { getSession} from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { BrandService } from "@/lib/services/business/brand-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        //Get Current user session
        const session = await getSession();
        const { id } = await params;
        
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 }); 
        }

        const { businessId } = session;
        const response = await BrandService.getBrandByIdService(id, businessId);

        if (!response.success || !response.data) {
            return NextResponse.json({ success: false, error: response.error }, { status: response.status });
        }

        const brandsData = response.data ;
        return NextResponse.json({ success: true, brand: brandsData }, { status: 200 });        
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        //Get Current user session
        const session = await getSession();
        const { id } = await params;

        if (!session || typeof session === "string"){
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 

        const { userId, businessId } = session;
        const body = await request.json();
        const response = await BrandService.updateBrandService(id, body, userId, businessId, session.businessSlug);
        if (response.success && response.message) {
           return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
           return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }     

}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
         //Get Current user session
        const session = await getSession();
        const { id } = await params;
        
        if (!session || typeof session === "string"){
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 

        const { userId, businessId } = session;
        const response = await BrandService.deleteBrandService(id, userId, businessId, session.businessSlug);
        if (response.success && response.message) {
            return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }   
       
}