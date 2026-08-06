import { getSession } from "@/lib/auths-functions";
import { MeService } from "@/lib/services/auth/me-service";
import { NextResponse } from "next/server";
// export const dynamic = "force-dynamic";

export async function GET() {
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized",success: false }, { status: 401 });
        }
        const { userId, businessId } = session;
        const response = await  MeService.getCurrentUser(userId, businessId);
        if (response.success && response.user) {
            const user = response.user;
            return NextResponse.json({ success: true, user }, { status: 200 });
        }else {
            return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: response.status });
        }  
}