import { NextResponse } from "next/server";
import { ProductService } from "@/lib/services/business/product-service";
import { getSession } from "@/lib/auths-functions";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
 // 1. Verify the session
    const session = await getSession();
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }
            
    const {businessId, employeeId, userId} = session;
    const result = await ProductService.updateShopInventory(
      body,
      employeeId || "",
      userId,
      businessId
    );

    return NextResponse.json(result, { status: result.status });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}