import { prisma } from "@/lib/dbHelper";
import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session || typeof session === "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch role to check if it's a system role or has users
    const role = await prisma.role.findUnique({
      where: { id, businessId: session.businessId },
      include: { _count: { select: { employee: true } } }
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // 2. Prevent deletion of system roles
    if (role.isSystem) {
      return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
    }

    // 3. Prevent deletion if users are assigned (Referential Integrity)
    if (role._count.employee > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. ${role._count.employee} employee(s) are currently assigned to it.` 
      }, { status: 400 });
    }

    await prisma.role.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    console.log("Delete Role Error: ",error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}


