import { prisma } from "@/lib/dbHelper";
import { getSession } from "@/lib/auths-functions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateDiscountSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0, "Value cannot be negative"),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        const { id } = await params;
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const discount = await prisma.discount.findFirst({
            where: { id, businessId: session.businessId },
            select: {
                id: true,
                name: true,
                type: true,
                value: true,
                isActive: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!discount) {
            return NextResponse.json({ error: "Discount not found", success: false }, { status: 404 });
        }

        return NextResponse.json({ success: true, discount }, { status: 200 });
    } catch (error) {
        console.error("GET_DISCOUNT_ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch discount", success: false }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        const { id } = await params;


        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const { userId, businessId } = session;
        const body = await request.json();
        const validatedData = updateDiscountSchema.parse(body);

        // Check if discount name is unique within business (excluding current discount)
        const existingDiscount = await prisma.discount.findFirst({
            where: {
                name: validatedData.name,
                businessId: businessId,
                NOT: { id }
            }
        });
        if (existingDiscount) {
            return NextResponse.json(
                { error: "A discount with this name already exists in your business.", success: false },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const updatedDiscount = await tx.discount.update({
                where: { id, businessId },
                data: {
                    name: validatedData.name,
                    type: validatedData.type,
                    value: validatedData.value,
                    isActive: validatedData.isActive,
                    startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
                    endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "UPDATE_DISCOUNT",
                    entity: "DISCOUNT",
                    entityId: id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            return updatedDiscount;
        });

        return NextResponse.json(
            { success: true, message: `Discount ${result.name} updated successfully`, discount: result },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Discount update error:", error);
        return NextResponse.json({ error: "Update failed", success: false }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession()

        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const { userId, businessId } = session;

        const currentDiscount = await prisma.discount.findFirst({
            where: { id, businessId },
            select: { name: true }
        });

        if (!currentDiscount) {
            return NextResponse.json({ error: "Discount not found", success: false }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    action: "DELETE_DISCOUNT",
                    entity: "DISCOUNT",
                    entityId: id,
                    userId: userId,
                    businessId: businessId,
                }
            });

            await tx.discount.delete({
                where: { id, businessId }
            });
        });

        return NextResponse.json(
            { success: true, message: `Discount deleted successfully` },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Discount delete error:", error);
        if (error instanceof Error && 'code' in error && error.code === 'P2003') {
            return NextResponse.json({
                error: "Cannot delete discount with associated products or sales. Remove associations first.",
                success: false
            }, { status: 400 });
        }
        return NextResponse.json({ error: "Delete failed", success: false }, { status: 500 });
    }
}