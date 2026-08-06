import { Prisma } from "@/generated/prisma/client";

export type RolesWithRelations = Prisma.RoleGetPayload<{
    include: {
        creator: {select: {employee: {select: {firstName: true; lastName: true}}}};
        updater: {select: {employee: {select: {firstName: true; lastName: true}}}};
        business: {select: {name: true}};
        _count: {select: {employee: true}};
    }
}>;


export interface FetchRolesOptions {
  excludeSystem?: boolean;      // Exclude base default system structural configurations
  excludeTemporary?: boolean;   // Exclude expired/short-term temp roles
  excludeIds?: string[];        // Explicitly exclude an array of specific role IDs
  excludeNames?: string[];      // New: Explicitly exclude roles matching these names (e.g., ["Admin"])
  onlyRoleType?: "SYSTEM" | "CUSTOM" | "TEMPORARY";
}