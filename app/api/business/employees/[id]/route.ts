import { getSession} from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { EmployeeService } from "@/lib/services/business/employee-services";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    //Get current user session
    const session = await getSession();
    const { id } = await params;
    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {userId, businessId, businessSlug} = session; 
    // Toggle the isActive status of the employee
    const response = await EmployeeService.toggleSingleEmployeeStatus(id, userId, businessId, businessSlug);
    return NextResponse.json(response);
  } catch (error) {
    console.error("TOGGLE_EMPLOYEE_STATUS_ERROR:", error);
    return NextResponse.json({ error: "Failed to update employee status." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    //Get current user session
    const session  = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {userId, businessId, businessSlug} = session;
    // Delete the employee
    const response = await EmployeeService.softDeleteSingleEmployee(id, userId, businessId, businessSlug);
    return NextResponse.json(response);
  } catch (error) {
    console.error("DELETE_EMPLOYEE_ERROR:", error);
    return NextResponse.json({ error: "Failed to delete employee." }, { status: 500 });
  }
}