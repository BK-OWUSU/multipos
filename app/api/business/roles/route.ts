import { getSession} from "@/lib/auths-functions";
import { NextResponse } from "next/server";
import { RoleService } from "@/lib/services/auth/role-service";

export async function GET() {
  try {
     //Get Current user session
     const session = await getSession();
    
            if (!session || typeof session === "string") {
                return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
            }
            
            const { businessId, roleId } = session;
            const response = await RoleService.getRolesByBusiness(businessId,false,{
              excludeIds: [roleId],
              excludeNames: ["OWNER"]
            })
            if (response.status && response.data) {
                const roles = response.data; 
                return NextResponse.json({success: response.success, data: roles }, { status: response.status });
            } else {
                return NextResponse.json({ error: response.error, success: response.success }, { status: response.status });
            }
  } catch (error) {
    console.log("Fetching Roles Error :", error)
    return NextResponse.json({ error: "Failed to fetch roles", success: false }, { status: 500 });
  }
}