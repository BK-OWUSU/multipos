import { z } from "zod";

// Runtime Validation for the Query Filters
export const AuditLogQueryFiltersSchema = z.object({
  businessId: z.string().cuid("Invalid business identity context context"),
  tab: z.string().default("all"),
  shopId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  search: z.string().optional().default(""),
  // Adjusted to allow 1 or higher (dropping .positive() which is strictly > 0)
  page: z.coerce.number().int().min(1).default(1),
  // Allows -1 or 0 to bypass database boundaries cleanly for client-side TanStack paging
  limit: z.coerce.number().int().min(-1).default(-1),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

// Infer TypeScript interface automatically from the Zod Schema
export type AuditLogQueryFilters = z.infer<typeof AuditLogQueryFiltersSchema>;

// Interface shape for a fully structured and uniform row element
export interface NormalizedLogEntry {
  id: string;
  createdAt: Date;
  user: string;
  role: string;
  action: string;
  module: string;    // Maps perfectly to "SESSION", "INVENTORY", etc.
  logType: string;   // Maps to "SECURITY", "SYSTEM_AUDIT", "STOCK_INVENTORY"
  description: string;
  ipAddress: string;
  branch: string;    // Displays branch name or "Global Management"
}

// Interface for the dashboard payload response holding metadata metrics + items
export interface AuditLogDashboardData {
  metrics: {
    allLogs: number;
    userActivity: number;
    dataChanges: number;
    systemEvents: number;
    stockLogs: number;
    userSessions: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  logs: NormalizedLogEntry[];
}

// export interface AuditLogQueryFilters {
//   businessId: string;
//   tab?: string;
//   shopId?: string | null;
//   userId?: string | null;
//   search?: string;
//   page?: number;
//   limit?: number;
//   startDate?: string | null;
//   endDate?: string | null;
// }

// export interface NormalizedLogEntry {
//   id: string;
//   createdAt: Date;
//   user: string;
//   role: string;
//   action: string;
//   module: string;
//   logType: string;
//   description: string;
//   ipAddress: string;
//   branch: string;
// }

// export interface AuditLogDashboardData {
//   metrics: {
//     allLogs: number;
//     userActivity: number;
//     dataChanges: number;
//     systemEvents: number;
//     stockLogs: number;
//     userSessions: number;
//   };
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
//   logs: NormalizedLogEntry[];
// }