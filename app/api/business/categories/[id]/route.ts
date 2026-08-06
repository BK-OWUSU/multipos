import { getSession} from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { CategoryService} from "@/lib/services/business/category-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

        const session = await getSession();
        const { id } = await params;

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const { businessId } = session;
        const response = await CategoryService.getCategoryByIdService(id, businessId);

        if (!response.success || !response.data) {
            return NextResponse.json({ success: false, error: response.error }, { status: response.status });
        }

        const category = response.data;
        return NextResponse.json({ success: true, category }, { status: 200 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
         const session = await getSession();
         const { id } = await params;
      
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const { userId, businessId } = session;
        const body = await request.json();
        const response = await CategoryService.updateCategoryService(id, body, userId, businessId, session.businessSlug);
        if (response.success && response.message) {
            return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
          const session = await getSession();
        const { id } = await params;

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const { userId, businessId, businessSlug } = session;
        const response = await CategoryService.deleteCategoryService(id, userId, businessId, businessSlug);
        
        if (response.success && response.message) {
            return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }   
}