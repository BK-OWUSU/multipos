import { getSession } from "@/lib/auths-functions";
import { EmployeeService,  } from "@/lib/services/business/employee-services";
import { NextRequest, NextResponse } from "next/server";



export async function POST(request: NextRequest) {
    // try {
        //Getting current user session
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Invalid or expired session", success: false }, { status: 401 });
        }
        const { userId,employeeId, businessId } = session;
        const body = await request.json();
        const response = await EmployeeService.createEmployee(body, userId,employeeId || "", businessId)

        if (response.success && response.message) {
            return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }
}

export async function GET(request: NextRequest) {
    const session = await getSession();
    
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {businessId, userId, employeeId} = session;

    // Call the service with params from session
    const result = await EmployeeService.getAllEmployees(businessId, userId, employeeId || "");

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
}