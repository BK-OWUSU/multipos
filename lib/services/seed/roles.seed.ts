import { Prisma, RoleName, RoleType } from "@/generated/prisma/client";


export async function seedRoles(userId:string, businessId:string, transaction: Prisma.TransactionClient) {
    const rolesData = [
        { name: RoleName.MANAGER, permissions: ["*"], access: ["*"], isSystem:true, type: RoleType.SYSTEM },
        { name: RoleName.ADMIN, permissions: ["*"], access: ["shops"], isSystem:true, type: RoleType.SYSTEM },
        { name: RoleName.CASHIER, permissions: ["process_sales"], access: ["pos","cash-register,time-card"], isSystem:true, type: RoleType.SYSTEM},
    ];

    try {
        for (const roleData of rolesData) {
        await transaction.role.create({
            data: {
                name: roleData.name,
                permissions: roleData.permissions,
                access: roleData.access,
                businessId: businessId,
                isSystem: roleData.isSystem,
                type: roleData.type,
                createdById: userId,
                updatedById: userId
            }
        });
    }
    } catch (error) {
        console.error("Error seeding roles:", error);
        throw error; // Rethrow to ensure transaction is rolled back
    }
}