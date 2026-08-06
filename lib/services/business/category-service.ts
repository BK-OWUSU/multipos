import { prisma } from "@/lib/dbHelper";
import { AppResponse } from "@/types/auth/auth";
import { deleteUTFile } from "@/lib/actions/uploadthing";
import { CategoryFormValues, categorySchema } from "@/types/schema/inventory.schema";


/**
 * Creates a new category and records the action in the audit log.
 */
//POST
export class CategoryService {
//CREATE CATEGORY
static async createCategoryService(
  data: CategoryFormValues, 
  userId: string,
  businessId: string,
  businessSlug: string
) {

  try {

    const validatedData =  categorySchema.parse(data);
    // Check if category name is unique within business
    const existingCategory = await prisma.category.findFirst({
        where: {
            name: validatedData.name,
            businessId: businessId
        }
        });
        if (existingCategory) {
            return {
                error: "A category with this name already exists in your business.", 
                success: false,
                status: 400 
            } as AppResponse;
        }

    const newCategory = await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          ...validatedData,
          businessId: businessId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entity: "CATEGORY",
          entityId: category.id,
          newValue: JSON.stringify(category),
          userId: userId,
          businessId: businessId,
        },
      });

      return category;
    });

    return {
      success: true,
      message: `Category ${newCategory.name} created successfully`,
      redirectTo: `/${businessSlug}/categories`,
      data: newCategory
    } as AppResponse;
  } catch (error) {
    console.error("CREATE_CATEGORY_ERROR:", error);
    return { success: false, error: "Failed to create category." } as AppResponse;
  }
}

/**
 * Updates an existing category, logs changes, and handles old file cleanup if the icon changed.
 */
//GET ALL CATEGORIES FOR A BUSINESS
static async getAllCategoriesService(businessId: string):Promise<AppResponse> {
    try {
        const categories = await prisma.category.findMany({
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
                // Automatically count products per category for the "Products" column in your UI
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { 
            success: true, 
            data: categories 
        } as AppResponse;

    } catch (error) {
        console.error("GET_CATEGORIES_ERROR:", error);
        return { success: false, error: "Failed to fetch categories.", status: 500 } as AppResponse;
    }
}

//GET CATEGORY BY ID
static async getCategoryByIdService(categoryId: string, businessId: string) {
    try {
         const category = await prisma.category.findFirst({
            where: { id: categoryId, businessId: businessId },
            select: {
                id: true,
                name: true,
                createdAt: true,
            }
        });

        if (!category) {
            return { error: "Category not found", success: false, status: 404 };
         }

        return { 
            success: true, 
            data: category 
        } as AppResponse;

    } catch (error) {
        console.error("GET_CATEGORY_ERROR:", error);
        return { success: false, error: "Failed to fetch category.", status: 500 } as AppResponse;
    }
}

//UPDATE CATEGORY
static async updateCategoryService(
  id: string,
  data: CategoryFormValues,
  userId: string,
  businessId: string,
  businessSlug: string
) {

   const validatedData =  categorySchema.parse(data);
     // Check if category name is unique within business (excluding current category)
           const existingCategory = await prisma.category.findFirst({
               where: {
                   name: validatedData.name,
                   businessId: businessId,
                   NOT: { id }
               }
           });
           if (existingCategory) {
               return {
                   error: "A category with this name already exists in your business.",
                   success: false
               } as AppResponse;
           } 
      try {
        const result = await prisma.$transaction(async (tx) => {
        const oldCategory = await tx.category.findUnique({
            where: { id, businessId },
        });

        if (!oldCategory) throw new Error("Category not found.");

        const updatedCategory = await tx.category.update({
            where: { id },
            data: validatedData,
        });

        await tx.auditLog.create({
            data: {
            action: "UPDATE",
            entity: "CATEGORY",
            entityId: id,
            oldValue: JSON.stringify(oldCategory),
            newValue: JSON.stringify(updatedCategory),
            userId: userId,
            businessId: businessId,
            },
        });

        // If a new file was uploaded, return the old key for cleanup
        if (data.fileKey && oldCategory.fileKey && data.fileKey !== oldCategory.fileKey) {
            return oldCategory.fileKey;
        }
        return null;
        });

    // Cleanup old file from UploadThing if replaced
    if (result) {
      await deleteUTFile(result);
    }

    return {
      success: true,
      message: "Category updated successfully.",
      redirectTo: `/${businessSlug}/categories`
    } as AppResponse;
  } catch (error) {
    console.error("UPDATE_CATEGORY_ERROR:", error);
    return { success: false, error: "Failed to update category." } as AppResponse;
  }
}

/**
 * Deletes a single category and its associated icon.
 */
//DELETE CATEGORY
static async deleteCategoryService(
  id: string,
  userId: string,
  businessId: string,
  businessSlug: string
) {
  try {
    const fileToDelete = await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id, businessId },
      });

      if (!category) throw new Error("Category not found.");

      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "CATEGORY",
          entityId: id,
          oldValue: JSON.stringify(category),
          userId: userId,
          businessId: businessId,
        },
      });

      await tx.category.delete({
        where: { id },
      });

      return category;
    });

    if (fileToDelete.fileKey) {
      await deleteUTFile(fileToDelete.fileKey);
    }

    return {
      success: true,
      message: `${fileToDelete.name} category deleted successfully.`,
      redirectTo: `/${businessSlug}/categories`
    } as AppResponse;
  } catch (error) {
    console.error("DELETE_CATEGORY_ERROR:", error);
    return { success: false, error: "Failed to delete category." } as AppResponse;
  }
}

//BULK DELETE CATEGORIES
static async performBulkCategoryDeleteService(
  ids: string[], 
  userId: string, 
  businessId: string, 
  businessSlug: string
) {
  try {
    // 1. Database Transaction
    const categoriesWithFiles = await prisma.$transaction(async (tx) => {
      const categoriesToDelete = await tx.category.findMany({
        where: { id: { in: ids }, businessId: businessId },
      });

      if (categoriesToDelete.length === 0) throw new Error("No categories found.");

      // Record in Audit Log
      await tx.auditLog.createMany({
        data: categoriesToDelete.map((category) => ({
          action: "DELETE",
          entity: "CATEGORY",
          entityId: category.id,
          oldValue: JSON.stringify(category),
          userId: userId,
          businessId: businessId,
        })),
      });

      // Delete from Database
      await tx.category.deleteMany({
        where: { id: { in: categoriesToDelete.map((c) => c.id) }, businessId: businessId },
      });

      // Return file keys for cleanup (assuming field name is iconKey or fileKey)
      return categoriesToDelete
        .map((c) => c.fileKey) // Ensure this matches your Prisma schema field name
        .filter((key): key is string => !!key);
    });

    // 2. Cleanup UploadThing icons
    if (categoriesWithFiles.length > 0) {
      await Promise.all(categoriesWithFiles.map((key) => deleteUTFile(key)));
    }

    return {
      success: true,
      message: `Deleted ${ids.length} categories and cleaned up storage.`,
      redirectTo: `/${businessSlug}/categories`
    } as AppResponse;

  } catch (error) {
    console.error("BULK_CATEGORY_DELETE_ERROR:", error);
    return { success: false, error: "An error occurred while deleting categories." } as AppResponse;
  }
}

/**
 * Toggles the isActive status for multiple categories and logs the change.
 */
//TOGGLE BULK CATEGORY STATUS
static async toggleBulkCategoryStatusService(
  ids: string[], 
  userId: string, 
  businessId: string, 
  businessSlug: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch current status
      const categories = await tx.category.findMany({
        where: { id: { in: ids }, businessId: businessId },
        select: { id: true, isActive: true, name: true }
      });

      if (categories.length === 0) throw new Error("No categories found.");

      // 2. Update status
      await Promise.all(
        categories.map((category) =>
          tx.category.update({
            where: { id: category.id },
            data: { isActive: !category.isActive },
          })
        )
      );

      // 3. Audit Log
      await tx.auditLog.createMany({
        data: categories.map((c) => ({
          action: "UPDATE",
          entity: "CATEGORY",
          entityId: c.id,
          oldValue: JSON.stringify({ isActive: c.isActive }),
          newValue: JSON.stringify({ isActive: !c.isActive }),
          userId: userId,
          businessId: businessId,
        })),
      });
    });

    return {
      success: true,
      message: `Successfully updated status for ${ids.length} categories.`,
      redirectTo: `/${businessSlug}/categories`
    } as AppResponse;
  } catch (error) {
    console.error("BULK_CATEGORY_STATUS_TOGGLE_ERROR:", error);
    return { success: false, error: "Failed to update category statuses." } as AppResponse;
  }
}
}