import { prisma } from "@/lib/dbHelper";
import { generateNextCustomId } from "@/lib/utils";
import { AppResponse } from "@/types/auth/auth";
import { ClockInDTO, ClockOutDTO, TimeCardQueryFilters } from "@/types/timecards.type";
import { Decimal } from "@prisma/client/runtime/client";
import { NotificationService } from "./notification-service";
import { NotificationCategory, NotificationChannel, NotificationPriority } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";




export class TimeCardService {
  /**
   * Clocks an employee in. Auto-resolves forgotten old shifts from prior days.
   */
 static async clockIn(dto: ClockInDTO): Promise<AppResponse> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Check for any existing open shifts (where clockOut is missing)
      const existingActiveShift = await tx.timeCard.findFirst({
        where: {
          employeeId: dto.employeeId,
          businessId: dto.businessId,
          clockOut: null,
          status: "ACTIVE",
        },
      });

      if (existingActiveShift) {
        // Check if the existing shift was started on a previous calendar day
        const shiftStartDate = new Date(existingActiveShift.clockIn).setHours(0, 0, 0, 0);
        const todayDate = new Date(now).setHours(0, 0, 0, 0);

        if (shiftStartDate < todayDate) {
          // 🛑 CRITICAL STATE TRACE: Employee forgot to clock out yesterday.
          // Flag old shift as missed and close it gracefully without system crash
          await tx.timeCard.update({
            where: { id: existingActiveShift.id },
            data: {
              status: "MISSED_CLOCK_OUT",
              notes: existingActiveShift.notes 
                ? `${existingActiveShift.notes} | System Auto-Closed: Employee missed clock out.` 
                : "System Auto-Closed: Employee missed clock out.",
            },
          });

          // Write an audit trail flag for tracking managers to review later
          await tx.auditLog.create({
            data: {
              action: "UPDATE",
              entity: "TIMECARD",
              entityId: existingActiveShift.id,
              userId: dto.userId,
              businessId: dto.businessId,
              oldValue: "ACTIVE",
              details: `Timecard auto-flagged as MISSED_CLOCK_OUT upon subsequent shift attempt.`,
            },
          });

          // ── DISPATCH MISSED CLOCK-OUT EXCEPTION NOTIFICATION ──
          const recipientIds = await NotificationService.getRecipientIdsByRoles(
            dto.businessId,
            ["OWNER", "ADMIN", "MANAGER"],
            dto.employeeId
          );

          if (recipientIds.length > 0) {
            await NotificationService.createManyInTx(tx, recipientIds, {
              businessId: dto.businessId,
              title: "Missed Clock-Out Exception",
              message: `An unclosed shift (${existingActiveShift.customId}) from a prior day was auto-flagged as missed during a new clock-in attempt.`,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.URGENT,
              channel: NotificationChannel.IN_APP,
            });
          }
        } else {
          // Employee is trying to clock in twice on the exact same day
          throw new Error("Employee is already clocked into an active shift session today.");
        }
      }

      // 2. Generate custom human-readable sequential tracking code
      const generatedCustomId = await generateNextCustomId({
        tx,
        businessId: dto.businessId,
        sequenceType: "TIME_CARD",
        prefix: "TC",
      });

      // 3. Build new active timecard line item
      const newTimeCard = await tx.timeCard.create({
        data: {
          customId: generatedCustomId,
          employeeId: dto.employeeId,
          businessId: dto.businessId,
          shopId: dto.shopId || null,
          clockIn: now,
          date: now,
          status: "ACTIVE",
          notes: dto.notes || null,
        },
        include: {
          employee: {
            select: { firstName: true, lastName: true, designation: true },
          },
        },
      });

      // 4. Log the creation audit trace
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "TIMECARD",
          entityId: newTimeCard.id,
          userId: dto.userId,
          businessId: dto.businessId,
          oldValue: "None",
          details: `Employee shift record started. Status set to ACTIVE. ID: ${generatedCustomId}`,
        },
      });

      return newTimeCard;
    });

    // 🟢 Return structured success response matching your route expectations
    return {
      success: true,
      data: result,
      status: 200
    } as AppResponse;

  } catch (error: unknown) {
    // 🟢 Return structured error response to prevent unhandled app crashes
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during clock in.",
      status: 400
    } as AppResponse;
  }
 }

 static async clockOut(dto: ClockOutDTO): Promise<AppResponse> {
  try {
    const results = await prisma.$transaction(async (tx) => {
      
      // 1. Fetch the targeted shift record immediately with employee details
      const timeCard = await tx.timeCard.findUnique({
        where: { id: dto.timeCardId },
        include: {
          employee: {
            select: { firstName: true, lastName: true },
          },
        },
      });
      

      if (!timeCard) {
        throw new Error("Target timecard shift log index could not be located.");
      }
      
      // 2. Core Status Guards
      if (timeCard.status === "COMPLETED" || timeCard.clockOut) {
        throw new Error("This timecard shift record has already been completed.");
      }
      if (timeCard.status === "MISSED_CLOCK_OUT") {
        throw new Error("Cannot clock out of an expired shift record flagged as missed.");
      }

      // 🛑 NEW: INTERCEPT YESTERDAY'S DRIFT
      // Normalize dates to midnight to compare calendar days perfectly
      const shiftStartDate = new Date(timeCard.clockIn).setHours(0, 0, 0, 0);
      const todayDate = new Date().setHours(0, 0, 0, 0);

      if (shiftStartDate < todayDate) {
        // The employee is clicking "Clock Out" today for a shift that started on a previous day.
        // Instead of completing it, we flag it as MISSED_CLOCK_OUT to clean up their state.
        const updatedMissedCard = await tx.timeCard.update({
          where: { id: dto.timeCardId },
          data: {
            status: "MISSED_CLOCK_OUT",
            notes: dto.notes 
              ? `${timeCard.notes || ''} | ${dto.notes} | Auto-flagged: Shift crossed calendar days.`.trim() 
              : `${timeCard.notes || ''} | Auto-flagged: Shift crossed calendar days.`.trim(),
          },
        });

        // Log the audit trail for management tracking
        await tx.auditLog.create({
          data: {
            action: "UPDATE",
            entity: "TIMECARD",
            entityId: timeCard.id,
            userId: dto.userId,
            businessId: dto.businessId,
            oldValue: "ACTIVE",
            details: `Shift auto-flagged as MISSED_CLOCK_OUT because clock-out action occurred on a subsequent calendar day.`,
          },
        });

        // ── DISPATCH MISSED CLOCK-OUT EXCEPTION NOTIFICATION ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          dto.businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          dto.employeeId
        );

        if (recipientIds.length > 0) {
          const empName = `${timeCard.employee.firstName} ${timeCard.employee.lastName}`;
          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId: dto.businessId,
            title: "Missed Clock-Out Exception",
            message: `${empName}'s shift (${timeCard.customId}) crossed calendar days without check-out and was auto-flagged.`,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.URGENT,
            channel: NotificationChannel.IN_APP,
          });
        }
        // Return early so the transaction finishes cleanly and resets the worker's state
        return updatedMissedCard;
      }

      // 3. REGULAR CLOCK OUT FLOW (Same Day Shift)
      const clockOutTime = new Date();
      const timeDifferenceMs = clockOutTime.getTime() - timeCard.clockIn.getTime();
      const computedHours = Math.max(0, timeDifferenceMs / (1000 * 60 * 60));
      const formattedHours = parseFloat(computedHours.toFixed(2));

      const updatedTimeCard = await tx.timeCard.update({
        where: { id: dto.timeCardId },
        data: {
          clockOut: clockOutTime,
          totalHours: new Decimal(formattedHours),
          status: "COMPLETED",
          notes: dto.notes ? `${timeCard.notes || ''} | ${dto.notes}`.trim() : timeCard.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "TIMECARD",
          entityId: timeCard.id,
          userId: dto.userId,
          businessId: dto.businessId,
          oldValue: "ACTIVE",
          details: `Employee shift closed cleanly. Status: COMPLETED, Duration: ${formattedHours} hrs.`,
        },
      });

      return updatedTimeCard;
    });

    return {
      success: true,
      data: results,
      status: 200,
    } as AppResponse;

  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during clock out.",
      status: 400,
    } as AppResponse;
  }
}

  /**
   * Retrieves active, un-closed shifts for real-time monitoring across terminal dashboards
   */
  static async getActiveShopsTimeCards(businessId: string, shopId?: string) {
    return await prisma.timeCard.findMany({
      where: {
        businessId,
        ...(shopId && { shopId }),
        status: "ACTIVE", // 🟢 Updated to filter explicitly by your state tracking enum
      },
      include: {
        employee: {
          select: { 
            firstName: true, 
            lastName: true, 
            designation: true, 
            imageUrl: true 
          },
        },
      },
      orderBy: { clockIn: "desc" },
    });
  }

  /**
   * Fetches historical logs based on dynamic structural filtering parameters
   */
static async getTimeCardLogs(filters: TimeCardQueryFilters): Promise<AppResponse> {
  try {
    const { businessId, shopId, employeeId, status, startDate, endDate } = filters;

    const results = await prisma.timeCard.findMany({
      where: {
        businessId,
        ...(shopId && { shopId }),
        ...(employeeId && { employeeId }),
        ...(status && { status }), 
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { gte: new Date(`${startDate}T00:00:00.000Z`) }),
            ...(endDate && { lte: new Date(`${endDate}T23:59:59.999Z`) }),
          }
        } : {}),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, designation: true },
        },
        shop: {
          select: { id: true, name: true },
        },
      },
      orderBy: { clockIn: "desc" },
    });

    return { 
      success: true, 
      data: results, 
      status: 200 
    } as AppResponse;

  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An internal server error occurred while retrieving logs.",
      status: 500
    } as AppResponse;
  }
 }


/**
   * Retrieves paginated and filtered time card logs with analytics counters safely typed.
   */
 static async totalHoursWorked(
    filters: TimeCardQueryFilters & { page?: number; limit?: number; search?: string }
  ): Promise<AppResponse> {
    try {
      const { 
        businessId, 
        shopId, 
        employeeId, 
        status, 
        startDate, 
        endDate, 
        search,
        page = 1, 
        limit = 10 
      } = filters;

      if (!businessId) {
        return { success: false, error: "Business ID is required.", status: 400 };
      }

      const skip = (page - 1) * limit;

      const whereClause: Prisma.TimeCardWhereInput = {
        businessId,
        ...(shopId ? { shopId } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status } : {}),
        ...((startDate || endDate) ? {
          date: {
            ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
            ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
          }
        } : {}),
        ...(search ? {
          OR: [
            { notes: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { 
              employee: {
                OR: [
                  { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  { customId: { contains: search, mode: Prisma.QueryMode.insensitive } }
                ]
              }
            }
          ]
        } : {})
      };

      // Execute queries in parallel to power both the table and all top KPI cards
      const [
        timeCards, 
        totalCount, 
        aggregateStats, 
        activeEmployeesList, 
        totalShopsCount, 
        monthlyStats
      ] = await Promise.all([
        prisma.timeCard.findMany({
          where: whereClause,
          include: {
            employee: {
              select: { firstName: true, lastName: true, designation: true, imageUrl: true, customId: true },
            },
            shop: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { clockIn: "desc" },
          skip,
          take: limit,
        }),
        prisma.timeCard.count({ where: whereClause }),
        prisma.timeCard.aggregate({
          where: whereClause,
          _sum: { totalHours: true },
        }),
        // Get unique active employees for the filtered scope
        prisma.timeCard.findMany({
          where: whereClause,
          select: { employeeId: true },
          distinct: ["employeeId"],
        }),
        // Total shops count for the business
        prisma.shop.count({
          where: { businessId },
        }),
        
        // Current month's aggregated hours
        prisma.timeCard.aggregate({
          where: {
            ...whereClause,
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lte: new Date(),
            }
          },
          _sum: { totalHours: true },
        })
      ]);

      const totalHoursSum = aggregateStats._sum.totalHours ?? 0;
      const activeEmployeesTotal = activeEmployeesList.length;
      
      // Calculate average hours per active employee safely
      const avgHoursPerEmployee = activeEmployeesTotal > 0 
        ? Number(Number(totalHoursSum) / activeEmployeesTotal).toFixed(2)
        : 0;

      return { 
        success: true, 
        data: timeCards,
        meta: { 
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
          },
          metrics: {
            totalHoursSum,
            activeEmployees: activeEmployeesTotal,
            avgHoursPerEmployee,
            totalShops: totalShopsCount,
            thisMonthHours: monthlyStats._sum.totalHours ?? 0,
          }
        }, 
        status: 200 
      };

    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An internal server error occurred while retrieving logs.",
        status: 500
      };
    }
  }

}