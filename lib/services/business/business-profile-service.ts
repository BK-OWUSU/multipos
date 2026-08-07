import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { businessProfileSchema, BusinessProfileInput } from "@/types/schema/business-profile.schema";
import { BusinessProfileResponse} from "@/types/types/business-profile.type";

/**
 * Service class for managing business profile configurations and tenant settings.
 */
export class BusinessService {

  /**
   * Retrieves the business profile by its unique ID or slug.
   */
  static async getBusinessProfileService(businessId: string) {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          _count: {
            select: {
              shops: true,
              employee: true,
              products: true,
              customers: true,
            },
          },
        },
      });

      if (!business) {
        return { success: false, message: "Business profile not found", data: null };
      }

      const formattedData = {
        name: business.name,
        businessSlug: business.slug,
        email: business.email,
        phone: business.phone || "",
        address: business.address || "",
        country: business.countryCode || "",
        countryCode: business.countryCode || "",
        currencyCode: business.currencyCode,
        currencySymbol: business.currencySymbol,
        locale: business.locale,
        dateFormat: business.dateFormat || "DD/MM/YYYY",
        timeFormat: "24h",
        numberFormat: "en-US",
        timezone: "UTC",
        isEmailVerified: business.isEmailVerified,
        termsAgreement: business.termsAgreement,
        isOnboarded: business.isOnboarded,
        onboardingStep: business.onboardingStep,
        logoUrl: business.logoUrl || "",
        fileKey: business.fileKey || "",
        workStartTime: business.workHrsStartTime ? new Date(business.workHrsStartTime).toISOString().substring(11, 16) : "08:00",
        workCloseTime: business.workHrsCloseTime ? new Date(business.workHrsCloseTime).toISOString().substring(11, 16) : "22:00",
        // Analytics count properties for the UI cards
        counts: {
          shops: business._count.shops,
          employees: business._count.employee,
          products: business._count.products,
          customers: business._count.customers,
        },
      };

      return {
        success: true,
        message: "Business profile retrieved successfully",
        data: formattedData as BusinessProfileResponse,
      } as AppResponse;
    } catch (error: unknown) {
      console.error("Error fetching business profile:", error);
      return { success: false, error: (error as Error).message || "Internal server error"} as AppResponse;
    }
  }

/**
   * Updates an existing business profile with validation, data transformation, and audit logging.
   */
  static async updateBusinessProfileService(
    data: Partial<BusinessProfileInput>,
    businessId: string,
    userId: string,
    ipAddress: string
  ) {
    try {
      // Validate incoming payload with Zod partial schema
      const validatedData = businessProfileSchema.partial().parse(data);

      // Check if slug is being updated and ensure it remains unique
      if (validatedData.businessSlug) {
        const existingSlug = await prisma.business.findFirst({
          where: {
            slug: validatedData.businessSlug,
            NOT: { id: businessId },
          },
        });

        if (existingSlug) {
          return { success: false, error: "Business slug is already taken by another enterprise." } as AppResponse;
        }
      }

      // Fetch the existing business state for the audit trail (oldValue)
      const existingBusiness = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!existingBusiness) {
        return { success: false, error: "Business profile not found." } as AppResponse;
      }

      // Helper to parse time strings (e.g. "08:00") into a dummy Date object if stored as DateTime in Prisma
      const parseTimeString = (timeStr?: string) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(":");
        const date = new Date();
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return date;
      };

      // Perform update and create audit log within a transaction
      const updatedBusiness = await prisma.$transaction(async (tx) => {
        const business = await tx.business.update({
          where: { id: businessId },
          data: {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.businessSlug && { slug: validatedData.businessSlug }),
            ...(validatedData.email && { email: validatedData.email }),
            ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
            ...(validatedData.logoUrl !== undefined && { logoUrl: validatedData.logoUrl }),
            ...(validatedData.fileKey !== undefined && { fileKey: validatedData.fileKey }),
            ...(validatedData.address !== undefined && { address: validatedData.address }),
            ...(validatedData.countryCode !== undefined && { countryCode: validatedData.countryCode }),
            ...(validatedData.currencyCode && { currencyCode: validatedData.currencyCode }),
            ...(validatedData.currencySymbol && { currencySymbol: validatedData.currencySymbol }),
            ...(validatedData.locale && { locale: validatedData.locale }),
            ...(validatedData.dateFormat !== undefined && { dateFormat: validatedData.dateFormat }),
            ...(validatedData.workStartTime && { workHrsStartTime: parseTimeString(validatedData.workStartTime) }),
            ...(validatedData.workCloseTime && { workHrsCloseTime: parseTimeString(validatedData.workCloseTime) }),
          },
        });

        await tx.auditLog.create({
          data: {
            action: "UPDATE",
            entity: "BUSINESS_PROFILE",
            entityId: business.id,
            oldValue: JSON.stringify(existingBusiness),
            newValue: JSON.stringify(business),
            userId: userId,
            businessId: businessId,
            ipAddress: ipAddress,
            logType: "SETTINGS_UPDATE",
          },
        });

        return business;
      });

      return {
        success: true,
        message: "Business profile updated successfully",
        data: updatedBusiness,
      } as AppResponse;
    } catch (error: unknown) {
      console.error("Error updating business profile:", error);
      return {
        success: false,
        error: (error as Error).message || "Failed to update business profile",
      } as AppResponse;
    }
  }
}