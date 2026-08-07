import { getSession } from "@/lib/auths-functions";
import { DiscountService } from "@/lib/services/business/discount-service";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {

    const session = await getSession();
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
    }

    const data = await request.json().catch(() => ({}));
    const { userId, businessId } = session;
     
     const response = await DiscountService.createDiscount(data, businessId, userId)

     if (response.success && response.message) {
         return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
     }else {
         return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
     }       

}

export async function GET(request: NextRequest) {
  
        const  session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }
        const {businessId} = session
        const response = await DiscountService.getAllDiscounts({businessId: businessId})

     if (response.success) {
        const discount = response.discounts
         return NextResponse.json({success: response.success, data: discount}, {status: response.status})
     }else {
         return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
     }       


}