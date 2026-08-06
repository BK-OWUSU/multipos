import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
// import { getProductByIdService, softProductDeleteService, updateProductService } from "@/lib/services/business/product-service";

// export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//         const { id } = await params;
//         const session = await getSession();
//         if (!session) {
//             return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
//         }
//         const {businessId} = session
//         const response = await getProductByIdService(id, businessId)

//         if (response.success && response.product) {
//             const product = response.product
//             return NextResponse.json({ success: true, product }, { status: 200 });
//         }else {
//             return NextResponse.json({ error: response.error, success: false }, { status: response.status });
//         }
// }

// export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//         const { id } = await params;
//         const session = await getSession();

//         if (!session || typeof session === "string") {
//             return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
//         } 

//         const { userId,employeeId, businessId } = session;
//         const body = await request.json();
        
//         const response = await updateProductService(id, body,userId,employeeId || "", businessId);
//         if (response.success && response.message) {
//             return NextResponse.json(
//                 { success: true, message: `Product ${response.product.name} updated successfully`, product: response.product },
//                 { status: response.status }
//             );
//         }else {
//             return NextResponse.json({ error: response.error, success: false }, { status: response.status });
//         }
// }

// export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//         const { id } = await params;
//         const session = await getSession();
//         if (!session || typeof session === "string"){
//             return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
//         } 
//         const { userId,employeeId, businessId } = session;

//         const response = await softProductDeleteService(id,userId,employeeId || "",businessId);

//         if (response.success && response.message) {
//             return NextResponse.json({ success: true, message: response.message },{ status: response.status });
//         }else {
//             return NextResponse.json({ error: response.error, success: false }, { status: response.status });
//         }
// }