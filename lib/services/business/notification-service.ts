import { prisma } from "@/lib/dbHelper"
import { Prisma, NotificationPriority, NotificationChannel, NotificationCategory, RoleName } from "@/generated/prisma/client"
import { AppResponse } from "@/types/auth/auth"

export class NotificationService {

 static async getRecipientIdsByRoles(
    businessId: string,
    roles: RoleName[],
    excludeEmployeeId?: string
  ): Promise<string[]> {
    try {
      const employees = await prisma.employee.findMany({
        where: {
          businessId,
          role: {
            name: {
              in: roles,
            },
          },
          isActive: true,
          isDeleted: false,
          ...(excludeEmployeeId && { NOT: { id: excludeEmployeeId } }),
        },
        select: { id: true },
      })

      return employees.map((emp) => emp.id)
    } catch (error) {
      console.error("[GET_RECIPIENTS_BY_ROLES_ERROR]", error)
      return []
    }
  }

  /**
   * Create a notification inside an optional Prisma transaction client
   */
  static async createInTx(
    tx: Prisma.TransactionClient,
    data: {
      businessId: string
      employeeId: string
      shopId?: string
      title: string
      message: string
      category?: NotificationCategory
      priority?: NotificationPriority
      channel?: NotificationChannel
    }
  ) {
    return tx.notification.create({
      data: {
        businessId: data.businessId,
        employeeId: data.employeeId,
        shopId: data.shopId,
        title: data.title,
        message: data.message,
        category: data.category ?? NotificationCategory.GENERAL,
        priority: data.priority ?? NotificationPriority.NORMAL,
        channel: data.channel ?? NotificationChannel.IN_APP,
      },
    })
  }

  /**
   * Broadcast notifications to multiple employees in bulk (supports transactions)
   */
  static async createManyInTx(
    tx: Prisma.TransactionClient,
    employeeIds: string[],
    baseData: {
      businessId: string
      shopId?: string
      title: string
      message: string
      category?: NotificationCategory
      priority?: NotificationPriority
      channel?: NotificationChannel
    }
  ) {
    const notificationsData = employeeIds.map((employeeId) => ({
      businessId: baseData.businessId,
      employeeId,
      shopId: baseData.shopId,
      title: baseData.title,
      message: baseData.message,
      category: baseData.category ?? NotificationCategory.GENERAL,
      priority: baseData.priority ?? NotificationPriority.NORMAL,
      channel: baseData.channel ?? NotificationChannel.IN_APP,
    }))

    return tx.notification.createMany({
      data: notificationsData,
      skipDuplicates: true,
    })
  }

  /**
   * Fetch notifications with pagination, search, and category filters scoped to business & employee
   */
  static async getNotifications(params: {
    businessId: string
    employeeId: string
    isRead?: boolean
    category?: NotificationCategory
    search?: string
    page?: number
    limit?: number
  }) {
    try {
      const page = Math.max(1, params.page || 1)
      const limit = Math.max(1, Math.min(100, params.limit || 20))
      const skip = (page - 1) * limit

      const whereClause: Prisma.NotificationWhereInput = {
        businessId: params.businessId,
        employeeId: params.employeeId,
      }

      if (typeof params.isRead === "boolean") {
        whereClause.isRead = params.isRead
      }

      if (params.category) {
        whereClause.category = params.category
      }

      if (params.search) {
        const cleanSearch = params.search.trim()
        whereClause.OR = [
          { title: { contains: cleanSearch, mode: "insensitive" } },
          { message: { contains: cleanSearch, mode: "insensitive" } },
        ]
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          include: {
            shop: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: whereClause }),
      ])

      return {
        success: true,
        data: notifications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error("[FETCH_NOTIFICATIONS_ERROR]", error)
      return { success: false, error: "Failed to retrieve notifications." }
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(businessId: string, notificationId: string, employeeId: string) {
    try {
      const updated = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          businessId,
          employeeId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      if (updated.count === 0) {
        return { success: false, error: "Notification not found or already read." }as AppResponse
      }

      return { success: true, message: "Notification marked as read." } as AppResponse
    } catch (error) {
      console.error("[MARK_AS_READ_ERROR]", error)
      return { success: false, error: "Internal failure." } as AppResponse
    }
  }

  /**
   * Toggle a single notification between read and unread states
   */
  static async toggleRead(businessId: string, notificationId: string, employeeId: string) {
    try {
      // 1. Find the current state of the notification
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          businessId,
          employeeId,
        },
        select: {
          isRead: true,
        }
      });

      if (!notification) {
        return { success: false, error: "Notification not found." } as AppResponse;
      }

      // 2. Determine the opposite state
      const nextReadState = !notification.isRead;

      // 3. Update the record dynamically
      await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: nextReadState,
          readAt: nextReadState ? new Date() : null, // Set date if read, clear it if unread
        },
      });

      return { 
        success: true, 
        message: `Notification marked as ${nextReadState ? "read" : "unread"}.`,
        meta: nextReadState 
      } as AppResponse;
    } catch (error) {
      console.error("[TOGGLE_READ_ERROR]", error);
      return { success: false, error: "Internal failure." } as AppResponse;
    }
  }

  /**
   * Mark all unread notifications as read for an employee in a business
   */
  static async markAllAsRead(businessId: string, employeeId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          businessId,
          employeeId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return { success: true, meta: result.count, message: `${result.count} message(s) marked as read.` } as AppResponse;
    } catch (error) {
      console.error("[MARK_ALL_AS_READ_ERROR]", error)
      return { success: false, error: "Internal failure." } as AppResponse;
    }
  }
}