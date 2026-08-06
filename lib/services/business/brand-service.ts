import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { BrandFormValues, brandSchema } from "@/types/schema/inventory.schema";



export class BrandService {
/**
 * Creates a new brand and records the action in the audit log.
 */
//POST
//CREATE BRAND
static async createBrandService(
  data: BrandFormValues, 
  userId: string,
  businessId: string,
  businessSlug: string
) {

  try {

    const validatedData =  brandSchema.parse(data);
    // Check if brand name is unique within business
    const existingBrand = await prisma.brand.findFirst({
        where: {
            name: validatedData.name,
            businessId: businessId
        }
        });
        if (existingBrand) {
            return {
                error: "A brand with this name already exists in your business.", 
                success: false,
                status: 400 
            } as AppResponse;
        }

    const newBrand = await prisma.$transaction(async (tx) => {
      const brand = await tx.brand.create({
        data: {
          ...validatedData,
          businessId: businessId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "BRAND",
          entityId: brand.id,
          newValue: JSON.stringify(brand),
          userId: userId,
          businessId: businessId,
        },
      });

      return brand;
    });

    return {
      success: true,
      message: `Brand ${newBrand.name} created successfully`,
      redirectTo: `/${businessSlug}/brands`,
      data: newBrand
    } as AppResponse;
  } catch (error) {
    console.error("CREATE_BRAND_ERROR:", error);
    return { success: false, error: "Failed to create brand." } as AppResponse;
  }
}

/**
 * Updates an existing brand, logs changes, and handles old file cleanup if the icon changed.
 */
//GET ALL BRANDS FOR A BUSINESS
static async getAllBrandsService(businessId: string) {
    try {
        const brands = await prisma.brand.findMany({
            where: {
                businessId: businessId,
            },
            select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                fileKey: true,
                isActive: true,
                createdAt: true,
                // Automatically count products per brand for the "Products" column in your UI
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { 
            success: true, 
            data: brands 
        } as AppResponse;

    } catch (error) {
        console.error("GET_BRANDS_ERROR:", error);
        return { success: false, error: "Failed to fetch brands.", status: 500 } as AppResponse;
    }
}

//GET SINGLE BRAND BY ID
static async getBrandByIdService(brandId: string, businessId: string): Promise<AppResponse> {
    try {
         const brand = await prisma.brand.findFirst({
            where: { id: brandId, businessId: businessId },
            select: {
                id: true,
                name: true,
                createdAt: true,
            }
        });

        if (!brand) {
            return { error: "Brand not found", success: false, status: 404 } as AppResponse;
         }

        return { 
            success: true, 
            data: brand 
        } as AppResponse;

    } catch (error) {
        console.error("GET_BRAND_ERROR:", error);
        return { success: false, error: "Failed to fetch brand.", status: 500 } as AppResponse;
    }
}


//UPDATE BRAND
static async updateBrandService(
  id: string,
  data: BrandFormValues,
  userId: string,
  businessId: string,
  businessSlug: string
) {

  const validatedData =  brandSchema.parse(data);
  // Check if brand name is unique within business (excluding current brand)
        const existingBrand = await prisma.brand.findFirst({
            where: {
                name: validatedData.name,
                businessId: businessId,
                NOT: { id }
            }
        });
        if (existingBrand) {
            return {
                error: "A brand with this name already exists in your business.",
                success: false
            } as AppResponse;
        } 

  try {
    const result = await prisma.$transaction(async (tx) => {
      const oldBrand = await tx.brand.findUnique({
        where: { id, businessId },
      });

      if (!oldBrand) throw new Error("Brand not found.");

      const updatedBrand = await tx.brand.update({
        where: { id },
        data: validatedData,
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entity: "BRAND",
          entityId: id,
          oldValue: JSON.stringify(oldBrand),
          newValue: JSON.stringify(updatedBrand),
          userId: userId,
          businessId: businessId,
        },
      });

      // If a new file was uploaded, return the old key for cleanup
      if (data.fileKey && oldBrand.fileKey && data.fileKey !== oldBrand.fileKey) {
        return oldBrand.fileKey;
      }
      return null;
    });

    // Cleanup old file from UploadThing if replaced
    if (result) {
      await deleteUTFile(result);
    }

    return {
      success: true,
      message: "Brand updated successfully.",
      redirectTo: `/${businessSlug}/brands`
    } as AppResponse;
  } catch (error: unknown) {
    console.error("UPDATE_BRAND_ERROR:", error);
    return { success: false, error: "Failed to update brand.", status: 500 } as AppResponse;
  }
}

/**
 * Deletes a single brand and its associated icon.
 */

//DELETE BRAND
static async deleteBrandService(
  id: string,
  userId: string,
  businessId: string,
  businessSlug: string
) {
  try {
    const fileToDelete = await prisma.$transaction(async (tx) => {
      const brand = await tx.brand.findUnique({
        where: { id, businessId },
      });

      if (!brand) throw new Error("Brand not found.");

      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "BRAND",
          entityId: id,
          oldValue: JSON.stringify(brand),
          userId: userId,
          businessId: businessId,
        },
      });

      await tx.brand.delete({
        where: { id },
      });

      return brand.fileKey;
    });

    if (fileToDelete) {
      await deleteUTFile(fileToDelete);
    }

    return {
      success: true,
      message: "Brand deleted successfully.",
      redirectTo: `/${businessSlug}/brands`
    } as AppResponse;
  } catch (error: unknown) {
    console.error("DELETE_BRAND_ERROR:", error);
    if (error instanceof Error && 'code' in error && error.code === 'P2003') {
                return {
                    error: "Cannot delete brand with associated products. Remove products first.",
                    success: false,
                    status: 400
                } as AppResponse;
            }
     return { success: false, error: "Failed to delete brand.", status: 500 } as AppResponse;
  }
}

//BULK DELETE BRANDS
static async performBulkBrandDeleteService(
  ids: string[], 
  userId: string, 
  businessId: string, 
  businessSlug: string
) {
  try {
    // 1. Database Transaction
    const brandsWithFiles = await prisma.$transaction(async (tx) => {
      const brandsToDelete = await tx.brand.findMany({
        where: { id: { in: ids }, businessId: businessId },
      });

      if (brandsToDelete.length === 0) throw new Error("No brands found.");

      // Record in Audit Log
      await tx.auditLog.createMany({
        data: brandsToDelete.map((brand) => ({
          action: "DELETE",
          entity: "BRAND",
          entityId: brand.id,
          oldValue: JSON.stringify(brand),
          userId: userId,
          businessId: businessId,
        })),
      });

      // Delete from Database
      await tx.brand.deleteMany({
        where: { id: { in: brandsToDelete.map((b) => b.id) }, businessId: businessId },
      });

      // Return file keys for cleanup (assuming field name is iconKey or fileKey)
      return brandsToDelete
        .map((b) => b.fileKey) // Ensure this matches your Prisma schema field name
        .filter((key): key is string => !!key);
    });

    // 2. Cleanup UploadThing icons
    if (brandsWithFiles.length > 0) {
      await Promise.all(brandsWithFiles.map((key) => deleteUTFile(key)));
    }

    return {
      success: true,
      message: `Deleted ${ids.length} brands and cleaned up storage.`,
      redirectTo: `/${businessSlug}/brands`
    } as AppResponse;

  } catch (error) {
    console.error("BULK_BRAND_DELETE_ERROR:", error);
    return { success: false, error: "An error occurred while deleting brands." } as AppResponse;
  }
}

/**
 * Toggles the isActive status for multiple brands and logs the change.
 */
//TOGGLE BULK BRAND STATUS
static async toggleBulkBrandStatusService(
  ids: string[], 
  userId: string, 
  businessId: string, 
  businessSlug: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch current status
      const brands = await tx.brand.findMany({
        where: { id: { in: ids }, businessId: businessId },
        select: { id: true, isActive: true, name: true }
      });

      if (brands.length === 0) throw new Error("No brands found.");

      // 2. Update status
      await Promise.all(
        brands.map((brand) =>
          tx.brand.update({
            where: { id: brand.id },
            data: { isActive: !brand.isActive },
          })
        )
      );

      // 3. Audit Log
      await tx.auditLog.createMany({
        data: brands.map((b) => ({
          action: "UPDATE",
          entity: "BRAND",
          entityId: b.id,
          oldValue: JSON.stringify({ isActive: b.isActive }),
          newValue: JSON.stringify({ isActive: !b.isActive }),
          userId: userId,
          businessId: businessId,
        })),
      });
    });

    return {
      success: true,
      message: `Successfully updated status for ${ids.length} brands.`,
      redirectTo: `/${businessSlug}/brands`
    } as AppResponse;
  } catch (error) {
    console.error("BULK_BRAND_STATUS_TOGGLE_ERROR:", error);
    return { success: false, error: "Failed to update brand statuses." } as AppResponse;
  }
}
}