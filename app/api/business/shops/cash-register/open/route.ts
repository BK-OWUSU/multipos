import { NextResponse } from "next/server";

import { getSession, setPOSCashSessionCookie } from "@/lib/auths-functions";
import { PosPayload } from "@/types/auth/auth";
import { SaleService } from "@/lib/services/business/sale-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const session = await getSession();
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }
            
    const {businessId, shopId, employeeId, userId, businessSlug, shopSlug} = session;

    // 1. Fire core service database allocations
    const serviceResult = await SaleService.openSession(
      body, 
      businessId, 
      shopId || "",
      userId, 
      employeeId || ""
    );

    if (!serviceResult.success || !serviceResult.data) {
      return NextResponse.json({ error: serviceResult.error }, { status: serviceResult.status });
    }

    // 2. Synthesize payload layout using database state values
    const sessionData: PosPayload = {
      userId: userId,
      businessId ,
      businessSlug,
      employeeId: employeeId || "",
      cashSessionId: serviceResult.data.id, // Freshly created session ID from Prisma
      shopId: serviceResult.data.shopId,
      shopSlug: shopSlug || "",
    };

    // 3. Instantiate structural JSON response 
    const response = NextResponse.json(serviceResult, { status: serviceResult.status });

    // 4. Set the secure cookie using your updated function!
    setPOSCashSessionCookie(response, sessionData);

    return response;

  } catch (error: unknown) {
    return NextResponse.json({ error: "Fatal router gateway error." }, { status: 500 });
  }
}