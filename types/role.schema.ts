import { z } from "zod";

export const RoleTypeEnum = z.enum(["SYSTEM", "CUSTOM", "TEMPORARY"]);

export const CreateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  permissions: z.array(z.string()).default([]),
  access: z.array(z.string()).default([]),
  description: z.string().max(500).optional().nullable(),
  type: RoleTypeEnum.default("CUSTOM"),
  expiresAt: z
    .string()
    .datetime({ message: "Invalid ISO datetime string" })
    .optional()
    .nullable(),
});

export const UpdateRoleSchema = CreateRoleSchema.partial();
// Static TypeScript inference types generated directly from your Zod schemas
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;