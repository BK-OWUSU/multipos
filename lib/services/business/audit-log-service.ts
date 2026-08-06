import { prisma } from "@/lib/dbHelper";
import { AuditLogQueryFilters, AuditLogDashboardData, NormalizedLogEntry } from "@/types/auth/auditLogs";
import { Prisma } from "@/generated/prisma/client";

export class AuditLogService {


  static async getDashboardPayload(filters: AuditLogQueryFilters): Promise<AuditLogDashboardData> {
  const { businessId, shopId, userId, search, page, limit, startDate, endDate, tab } = filters;

  // 1. Establish Unbounded Mode Strategy for client-side tables
  const isUnbounded = limit <= 0;
  const skip = isUnbounded ? undefined : (page - 1) * limit;

  // Calculate take directly using numbers to completely avoid type errors
  const take = isUnbounded 
    ? undefined 
    : (tab === "all" ? page * limit : limit);

    // Date Range Processing
    const dateRange: Prisma.DateTimeFilter = {};
    if (startDate) dateRange.gte = new Date(startDate);
    if (endDate) dateRange.lte = new Date(endDate);
    const hasDateRange = Object.keys(dateRange).length > 0;

    // Shared Tenant Conditions
    const baseAuditWhere: Prisma.AuditLogWhereInput = {
      businessId,
      ...(shopId && { shopId }),
      ...(userId && { userId }),
      ...(hasDateRange && { createdAt: dateRange }),
      ...(search && {
        OR: [
          { action: { contains: search, mode: "insensitive" } },
          { entity: { contains: search, mode: "insensitive" } },
          { details: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const baseSessionWhere: Prisma.UserSessionLogWhereInput = {
      businessId,
      ...(userId && { userId }),
      ...(hasDateRange && { createdAt: dateRange }),
      ...(search && { reason: { contains: search, mode: "insensitive" } }),
    };

    const baseStockWhere: Prisma.StockLogWhereInput = {
      businessId,
      ...(shopId && { shopId }),
      ...(userId && { employee: { user: { id: userId } } }),
      ...(hasDateRange && { createdAt: dateRange }),
      ...(search && {
        OR: [
          { action: { contains: search, mode: "insensitive" } },
          { reason: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // 3. Parallelized Counting and Query Window Grabs
    const [
      countAudits,
      countSessions,
      countStocks,
      rawAudits,
      rawSessions,
      rawStocks
    ] = await Promise.all([
      prisma.auditLog.count({ where: baseAuditWhere }),
      prisma.userSessionLog.count({ where: baseSessionWhere }),
      prisma.stockLog.count({ where: baseStockWhere }),

      // Fetch AuditLogs resolving User -> Employee -> Role
      tab === "all" || tab === "system" ? prisma.auditLog.findMany({
        where: baseAuditWhere,
        orderBy: { createdAt: "desc" },
        skip: isUnbounded ? undefined : 0, // In multi-table mode, take complete pool before memory slice
        take: take,
        include: {
          shop: true,
          user: {
            include: {
              employee: {
                include: { role: true }
              }
            }
          }
        }
      }) : Promise.resolve([]),

      // Fetch UserSessionLogs resolving User -> Employee -> Role
      tab === "all" || tab === "security" ? prisma.userSessionLog.findMany({
        where: baseSessionWhere,
        orderBy: { createdAt: "desc" },
        skip: isUnbounded ? undefined : 0,
        take: take,
        include: {
          user: {
            include: {
              employee: {
                include: { role: true }
              }
            }
          }
        }
      }) : Promise.resolve([]),

      // Fetch StockLogs resolving Employee -> Role directly
      tab === "all" || tab === "stock" ? prisma.stockLog.findMany({
        where: baseStockWhere,
        orderBy: { createdAt: "desc" },
        skip: isUnbounded ? undefined : (tab === "stock" ? skip : 0),
        take: take,
        include: {
          shop: true,
          employee: {
            include: { role: true }
          }
        }
      }) : Promise.resolve([]),
    ]);

    const combinedRawLogs: NormalizedLogEntry[] = [];

    // 4. Safe Mapping of Data Layout Segments
    
    // System Data Changes
    rawAudits.forEach(log => {
      const emp = log.user?.employee;
      combinedRawLogs.push({
        id: log.id,
        createdAt: log.createdAt,
        user: emp ? `${emp.firstName} ${emp.lastName}`.trim() : "System Automated",
        role: emp?.role?.name || "No Role Assigned",
        action: log.action,
        module: log.entity,
        logType: "SYSTEM_AUDIT",
        description: log.details || `Modified ${log.entity} model configurations.`,
        ipAddress: log.ipAddress || "0.0.0.0",
        branch: log.shop?.name || "Global Management",
      });
    });

    // User Sessions
    rawSessions.forEach(log => {
      const emp = log.user?.employee;
      combinedRawLogs.push({
        id: log.id,
        createdAt: log.createdAt,
        user: emp ? `${emp.firstName} ${emp.lastName}`.trim() : "Unknown Identity",
        role: emp?.role?.name || "No Role Assigned",
        action: log.reason || "Gateway Access",
        module: "SessionGateway",
        logType: "SECURITY",
        description: `Session interaction registered via user agent client: ${log.userAgent || "Unknown Device"}`,
        ipAddress: log.ipAddress || "0.0.0.0",
        branch: "Identity Management",
      });
    });

    // Stock Level Adjustments
    rawStocks.forEach(log => {
      const emp = log.employee;
      combinedRawLogs.push({
        id: log.id,
        createdAt: log.createdAt,
        user: emp ? `${emp.firstName} ${emp.lastName}`.trim() : "Staff Member",
        role: emp?.role?.name || "No Role Assigned",
        action: log.action || "Stock Alteration",
        module: "InventoryMatrix",
        logType: "STOCK_INVENTORY",
        description: `Adjusted quantity by factor [ ${log.change} ] for model configurations. Reason: ${log.reason || "None given"}`,
        ipAddress: log.ipAddress || "0.0.0.0",
        branch: log.shop?.name || "Unassigned Outlet",
      });
    });

    // 5. Sort entries chronologically from newest to oldest
    const sortedLogs = combinedRawLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Only slice records if we are NOT in unbounded mode AND reading across "all" tabs
    const finalLogsOutput = (isUnbounded || tab !== "all" || typeof skip !== "number")
      ? sortedLogs 
      : sortedLogs.slice(skip, skip + limit);

    const activeLogsCount = tab === "system" ? countAudits : tab === "security" ? countSessions : tab === "stock" ? countStocks : (countAudits + countSessions + countStocks);

  return {
    metrics: {
      allLogs: countAudits + countSessions + countStocks,
      userActivity: countSessions,
      dataChanges: countAudits,
      systemEvents: countAudits,
      stockLogs: countStocks,
      userSessions: countSessions,
    },
    pagination: {
      total: activeLogsCount,
      page: isUnbounded ? 1 : page,
      limit: isUnbounded ? activeLogsCount : limit,
      totalPages: isUnbounded ? 1 : Math.ceil(activeLogsCount / limit),
    },
    logs: finalLogsOutput,
  };
 }

}