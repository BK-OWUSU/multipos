import { getSession } from "@/lib/auths-functions";
import { ProductService } from "@/lib/services/business/product-service";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
        // 1. Verify the session
        const session = await getSession();

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }
        
        const { businessId, shopId } = session;
        const response = await ProductService.getProductVariantsServiceQueryFilters({businessId, shopId: shopId})
        
        if (response.status && response.data) {
            const productsVariants = response.data
            console.log(productsVariants)
            return NextResponse.json({success: response.success, productsVariants }, { status: response.status });
        } else {
            return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
        }
}