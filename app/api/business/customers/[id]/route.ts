import { getSession } from "@/lib/auths-functions";
import { CustomerService } from "@/lib/services/business/customer-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const { id } = await params;
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        const {businessId} = session
        const response = await CustomerService.getCustomerById(id, businessId)

        if (response.success && response.data) {
            const customer = response.data
            return NextResponse.json({ success: true, customer }, { status: 200 });
        }else {
            return NextResponse.json({ error: response.error, success: false }, { status: response.status });
        }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const { id } = await params;
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 

        const { userId,employeeId, businessId } = session;
        const body = await request.json();
        
        const response = await CustomerService.updateCustomer(body, id, businessId, userId);
        if (response.success && response.message) {
            return NextResponse.json(
                { success: true, message: response.message, data: response.data },
                { status: response.status }
            );
        }else {
            return NextResponse.json({ error: response.error, success: false }, { status: response.status });
        }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
        const { id } = await params;
        const session = await getSession();
        if (!session || typeof session === "string"){
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        } 
        const { userId, businessId } = session;

        const response = await CustomerService.softDeleteCustomer(id,userId,businessId, session.businessSlug);

        if (response.success && response.message) {
            return NextResponse.json({ success: true, message: response.message },{ status: response.status });
        }else {
            return NextResponse.json({ error: response.error, success: false }, { status: response.status });
        }
}