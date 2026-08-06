import { prisma } from "@/lib/dbHelper";
import { generateNextCustomId } from "@/lib/utils";
import { createDiscountSchema, CreateDiscountSchema } from "@/types/schema/inventory.schema";
import { AppResponse } from "@/types/auth/auth";
import { DiscountType, Prisma } from "@/generated/prisma/client";


export type DiscountStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE";

export class DiscountService {

  /**
   * Private utility to calculate a discount's lifecycle state at runtime.
   */
  private static calculateStatus(discount: {
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
  }): DiscountStatus {
    if (!discount.isActive) return "INACTIVE";

    const now = new Date();

    if (discount.startDate && discount.startDate > now) {
      return "SCHEDULED";
    }

    if (discount.endDate && discount.endDate < now) {
      return "EXPIRED";
    }

    return "ACTIVE";
  }

  /**
   * ── METHOD: CREATE NEW DISCOUNT MATRIX ──────────────────────────────────
   */
  static async createDiscount(
    data: CreateDiscountSchema,
    businessId: string,
    userId: string
  ): Promise<AppResponse> {
    try {
      // 1. Validate form schema alignment
      const validatedData = createDiscountSchema.parse(data);

      // 2. Open an isolated runtime transaction atomic context
      const discount = await prisma.$transaction(async (tx) => {
        // Generate continuous sequence values using your custom sequential ID generator
        const discountCustomId = await generateNextCustomId({
          tx,
          businessId,
          sequenceType: "DISCOUNT",
          prefix: "DSC",
        });

        const newDiscount = await tx.discount.create({
          data: {
            customId: discountCustomId, 
            name: validatedData.name,
            type: validatedData.type as DiscountType,
            description: validatedData.description || null, 
            value: validatedData.value,
            isActive: validatedData.isActive,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
            businessId,
          },
        });

        // Write actions context records downstream to your security trails
        await tx.auditLog.create({
          data: {
            action: "CREATE",
            entity: "DISCOUNT",
            entityId: newDiscount.id,
            userId,
            businessId,
            oldValue: "None",
            details: `Created new discount matrix: ${newDiscount.customId} - ${validatedData.name} (${validatedData.type})`,
          },
        });

        return newDiscount;
      });

      return {
        success: true,
        message: `${discount.name} discount created successfully.`,
        status: 201,
      } as unknown as AppResponse;

    } catch (error: unknown) {
      console.error("CRITICAL_CREATE_DISCOUNT_ERROR:", error);
      return {
        success: false,
        error: (error as Error).message || "An unexpected system error occurred building the discount record.",
        status: 500,
      } as unknown as AppResponse;
    }
  }

  /**
   * ── METHOD: UPDATE RUNNING DISCOUNT METRICS ─────────────────────────────
   */
  static async updateDiscount(
    discountId: string,
    data: Partial<CreateDiscountSchema>,
    businessId: string,
    userId: string
  ): Promise<AppResponse> {
    try {
      // Find and verify context isolation ownership constraints
      const existingDiscount = await prisma.discount.findFirst({
        where: { id: discountId, businessId, isDeleted: false },
      });

      if (!existingDiscount) {
        return {
          success: false,
          error: "Requested discount context not found or unauthorized access attempt.",
          status: 404,
        } as unknown as AppResponse;
      }

      const updatedDiscount = await prisma.$transaction(async (tx) => {
        const updatePayload = await tx.discount.update({
          where: { id: discountId },
          data: {
            name: data.name,
            type: data.type ? (data.type as DiscountType) : undefined,
            description: data.description !== undefined ? data.description : undefined, 
            value: data.value,
            isActive: data.isActive,
            startDate: data.startDate ? new Date(data.startDate) : data.startDate === null ? null : undefined,
            endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
          },
        });

        await tx.auditLog.create({
          data: {
            action: "UPDATE_DISCOUNT",
            entity: "DISCOUNT",
            entityId: discountId,
            userId,
            businessId,
            oldValue: JSON.stringify(existingDiscount),
            details: `Updated attributes on discount item ${existingDiscount.customId}`,
          },
        });

        return updatePayload;
      });

      return {
        success: true,
        message: "Discount records modified systematically.",
        data: {
          ...updatedDiscount,
          status: this.calculateStatus({
            isActive: updatedDiscount.isActive,
            startDate: updatedDiscount.startDate,
            endDate: updatedDiscount.endDate,
          }),
        },
        status: 200,
      } as unknown as AppResponse;

    } catch (error: unknown) {
      console.error("CRITICAL_UPDATE_DISCOUNT_ERROR:", error);
      return {
        success: false,
        error: (error as Error).message || "Internal mutation failure rewriting structural parameters.",
        status: 500,
      } as unknown as AppResponse;
    }
  }

  /**
   * ── METHOD: RETRIEVE ALL DISCOUNTS WITH RUNTIME FILTER PARAMS ───────────
   */
  static async getAllDiscounts(params: {
    businessId: string;
    type?: "PERCENTAGE" | "FIXED";
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    try {
      const { businessId, type, isActive, page = 1, limit = 10 } = params;

      const skip = (page - 1) * limit;

      const whereClause: Prisma.DiscountWhereInput = {
        businessId,
        isDeleted: false,
      };

      if (type) whereClause.type = type;
      if (isActive !== undefined) whereClause.isActive = isActive;

      const [discounts, totalCount] = await prisma.$transaction([
        prisma.discount.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.discount.count({ where: whereClause }),
      ]);

      const transformedDiscounts = discounts.map((discount) => ({
        ...discount,
        status: this.calculateStatus({
          isActive: discount.isActive,
          startDate: discount.startDate,
          endDate: discount.endDate,
        }),
      }));

      return {
        success: true,
        discounts: transformedDiscounts,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
        status: 200,
      };

    } catch (error) {
      console.error("CRITICAL_GET_DISCOUNTS_HISTORY_ERROR:", error);
      return {
        success: false,
        error: "An unexpected runtime variation broke the historical datasets stream compilation.",
        status: 500,
      };
    }
  }

  /**
   * ── METHOD: RETRIEVE SINGLE DISCOUNT OBJECT BY INSTANCE ID ───────────────
   */
  static async getDiscountById(discountId: string, businessId: string) {
    try {
      const discount = await prisma.discount.findFirst({
        where: { id: discountId, businessId, isDeleted: false },
      });

      if (!discount) {
        return { success: false, error: "Requested asset pointer does not exist under this scope.", status: 404 };
      }

      return {
        success: true,
        discount: {
          ...discount,
          status: this.calculateStatus({
            isActive: discount.isActive,
            startDate: discount.startDate,
            endDate: discount.endDate,
          }),
        },
        status: 200,
      };
    } catch (error) {
      console.error("CRITICAL_GET_DISCOUNT_BY_ID_ERROR:", error);
      return { success: false, error: "Failed tracking contextual index matching selection.", status: 500 };
    }
  }

  /**
   * ── METHOD: SOFT DELETE DISCOUNT METADATA REFERENCES ─────────────────────
   */
  static async deleteDiscount(discountId: string, businessId: string, userId: string): Promise<AppResponse> {
    try {
      const existing = await prisma.discount.findFirst({
        where: { id: discountId, businessId, isDeleted: false },
      });

      if (!existing) {
        return {
          success: false,
          error: "Requested target file row does not exist or access rights are restrictive.",
          status: 404,
        } as unknown as AppResponse;
      }

      await prisma.$transaction(async (tx) => {
        await tx.discount.update({
          where: { id: discountId },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            action: "DELETE_DISCOUNT",
            entity: "DISCOUNT",
            entityId: discountId,
            userId,
            businessId,
            oldValue: JSON.stringify(existing),
            details: `Soft deleted discount item matching custom ID: ${existing.customId}`,
          },
        });
      });

      return {
        success: true,
        message: "Discount removed and cleared safely from operational views.",
        status: 200,
      } as unknown as AppResponse;

    } catch (error) {
      console.error("CRITICAL_DELETE_DISCOUNT_CYCLE_ERROR:", error);
      return {
        success: false,
        error: "Internal transactional thread execution variance aborted deletion.",
        status: 500,
      } as unknown as AppResponse;
    }
  }
}