import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { FetchRolesOptions, RolesWithRelations } from "@/types/auth/role.type";
import { CreateRoleInput, CreateRoleSchema, UpdateRoleInput, UpdateRoleSchema } from "@/types/role.schema";


interface RequestMetadataContext {
  userId: string;
  businessId: string;
  shopId?: string | null;
  ipAddress?: string | null;
}


export class RoleService {

 /**
   * Provisions a new role with runtime validation and auditing footprints.
   */
  static async createRole(
    data: CreateRoleInput, 
    ctx: RequestMetadataContext
  ): Promise<AppResponse> {
    try {
      if (!ctx.businessId || !ctx.userId) {
        throw new Error("Missing critical security or isolation context parameters.");
      }

      // 1. Runtime validation using your Zod schema
      const validatedData = CreateRoleSchema.parse(data);

      const role = await prisma.$transaction(async (tx) => {
        // 2. Perform the database write operation using type-safe validated fields
        const newRole = await tx.role.create({
          data: {
            name: validatedData.name,
            permissions: validatedData.permissions,
            access: validatedData.access,
            description: validatedData.description || null,
            type: validatedData.type,
            expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
            businessId: ctx.businessId,
            createdById: ctx.userId,
            updatedById: ctx.userId,
          },
        });

        // 3. Document the structural change inside the system audit ledger
        await tx.auditLog.create({
          data: {
            action: "ROLE_CREATE",
            entity: "Role",
            entityId: newRole.id,
            oldValue: null,
            newValue: JSON.stringify(newRole),
            userId: ctx.userId,
            businessId: ctx.businessId,
            shopId: ctx.shopId || null,
            logType: "SECURITY_ACCESS",
            ipAddress: ctx.ipAddress || null,
            details: `Role "${newRole.name}" (${newRole.type}) created with ${newRole.permissions.length} permissions and ${newRole.access.length} access endpoints.`,
          },
        });

        return newRole;
      });

      return {
        success: true,
        data: role,
        status: 201,
        message: `${role.name} role created Successfully`
      } as AppResponse;

    } catch (error: unknown) {
      console.error("ROLE_SERVICE_CREATE_ERROR:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return { error: errorMessage, status: 500, success: false } as AppResponse;
    }
  }


/**
 * Modifies an existing custom role while maintaining atomic validation and transactions.
 * Returns only the base role data since Zustand handles the relation re-fetch.
 */
static async updateRole(
  roleId: string, 
  data: UpdateRoleInput, 
  ctx: RequestMetadataContext
): Promise<AppResponse> { 
  try {
    if (!roleId || !ctx.businessId || !ctx.userId) {
      throw new Error("Missing critical configuration arguments or session contexts.");
    }

    // 1. Runtime validation using your Zod schema
    const validatedData = UpdateRoleSchema.parse(data);

    const role = await prisma.$transaction(async (tx) => {
      // 2. Validate resource identity matches current active workspace context boundary
      const existingRole = await tx.role.findFirst({
        where: { id: roleId, businessId: ctx.businessId, isDeleted: false },
      });

      if (!existingRole) {
        throw new Error("The requested role profile configuration framework does not exist.");
      }

      if (existingRole.isSystem) {
        throw new Error("Modifying hard-coded system role configurations is structurally prohibited.");
      }

      // 3. Apply validation records changes via database mutator query 
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name: validatedData.name !== undefined ? validatedData.name : existingRole.name,
          description: validatedData.description !== undefined ? (validatedData.description || null) : existingRole.description,
          type: validatedData.type !== undefined ? validatedData.type : existingRole.type,
          expiresAt: validatedData.expiresAt !== undefined 
            ? (validatedData.expiresAt ? new Date(validatedData.expiresAt) : null) 
            : existingRole.expiresAt,
          
          permissions: validatedData.permissions !== undefined ? validatedData.permissions : existingRole.permissions,
          access: validatedData.access !== undefined ? validatedData.access : existingRole.access,
          
          updatedById: ctx.userId,
        },
      });

      // 4. Log the state delta changes cleanly
      await tx.auditLog.create({
        data: {
          action: "ROLE_UPDATE",
          entity: "Role",
          entityId: roleId,
          oldValue: JSON.stringify(existingRole),
          newValue: JSON.stringify(updatedRole),
          userId: ctx.userId,
          businessId: ctx.businessId,
          shopId: ctx.shopId || null,
          logType: "SECURITY_ACCESS",
          ipAddress: ctx.ipAddress || null,
          details: `Role configuration profile "${updatedRole.name}" updated successfully.`,
        },
      });

      return updatedRole;
    });

    return {
      success: true,
      data: role as unknown as RolesWithRelations, // Returns just the basic Role object
      message: `${role.name} role updated successfully`,
      status: 200,
    };

  } catch (error: unknown) {
    console.error("ROLE_SERVICE_UPDATE_ERROR:", error);
    return { 
      error: error instanceof Error ? error.message : "Unknown error occurred", 
      status: 500, 
      success: false 
    };
  }
}

/**
 * Fetches all active roles for a specific business tenant with complete auditing footprints.
 * * @param businessId - The tenant group ID scope filter
 * @param includeDeleted - Optional flag to fetch archived/deleted roles for system audits
 */
 static async getRolesByBusiness(
  businessId: string, 
  includeDeleted: boolean = false,
  options?: FetchRolesOptions 
) {
  try {
    if (!businessId) {
      throw new Error("Missing structural business identification parameter.");
    }

    const roles = await prisma.role.findMany({
      where: {
        businessId,
        // 1. Conditionally filter out soft-deleted entities
        ...(includeDeleted ? {} : { isDeleted: false }),
        
        // 2. Handle dynamic exclusions and constraints
        ...(options?.excludeSystem ? { isSystem: false } : {}),
        ...(options?.onlyRoleType ? { type: options.onlyRoleType } : {}),
        
        // 3. Exclude arrays of types, custom IDs, or specific names
        AND: [
          options?.excludeTemporary ? { type: { not: "TEMPORARY" } } : {},
          options?.excludeIds && options.excludeIds.length > 0 
            ? { id: { notIn: options.excludeIds } } 
            : {},
          // New: Filter out any roles whose names match items in the excludeNames array
          options?.excludeNames && options.excludeNames.length > 0
            ? {
                name: {
                  notIn: options.excludeNames,
                  mode: 'insensitive' // Prevents case discrepancies (e.g., "admin" vs "Admin")
                }
              }
            : {}
        ]
      },
      
      include: {
        creator: {
          select: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        updater: {
          select: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        business: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            employee: true,
          },
        },
      },
      orderBy: [
        { isSystem: "desc" },
        { createdAt: "asc" }
      ]
    });

    const rolesData = roles as RolesWithRelations[];
    return {
      success: true,
      data: rolesData,
      status: 200,
    } as AppResponse;

  } catch (error) {
    console.error("ROLE_SERVICE_FETCH_ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      error: errorMessage,
      status: 500,
      success: false,
    } as AppResponse;
  }
}
  /**
   * Fetches a single unique role row profile by its ID.
   */
  static async getRoleById(roleId: string, businessId: string){
    try {
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          businessId,
          isDeleted: false,
        },
        include: {
          creator: {
            select: { employee: { select: { firstName: true, lastName: true } } },
          },
          updater: {
            select: { employee: { select: { firstName: true, lastName: true } } },
          },
          _count: {
            select: { employee: true },
          },
        },
      });

      const roleData = role as RolesWithRelations;
        return {
            success: true,
            data: roleData,
            status: 200,
        } as AppResponse;
    } catch (error) {
      console.error("ROLE_SERVICE_SINGLE_FETCH_ERROR:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        error: errorMessage,
        status: 500,
        success: false,
      } as AppResponse;
    }
  }
}