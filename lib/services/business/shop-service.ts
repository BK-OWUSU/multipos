import { prisma } from "@/lib/dbHelper";
import { generateUniqueShopSlug } from "@/lib/slugGenerator";
import { Shop, UpdateShopInput, updateShopSchema } from "@/types/schema/shop.schema"; 
import { AppResponse } from "@/types/auth/auth";
import { CreateShopInput, createShopSchema } from "@/types/schema/shop.schema";
import { endOfDay, startOfDay, subDays } from "date-fns";

export class ShopService {

static async getShops(businessId: string): Promise<AppResponse> {
    try {
      const now = new Date();
      
      // 1. Setup clear date milestones
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const yesterdayStart = startOfDay(subDays(now, 1));
      const yesterdayEnd = endOfDay(subDays(now, 1));

      // 2. Fetch shops and run analytical group metrics in parallel
      const [shopsData, salesAggregation] = await Promise.all([
        prisma.shop.findMany({
          where: { 
            businessId: businessId,
            isDeleted: false 
          },
          include: {
            _count: {
              select: { currentEmployees: true, inventories: true, sales: true } 
            },
            cashSessions: {
              orderBy: { openedAt: "desc" },
              take: 1,
              select: { status: true, openedAt: true }
            }
          },
          orderBy: { name: 'asc' }
        }),

        // 3. Optimized: Fetch COMPLETED sales across the last 48 hours for batch grouping
        prisma.sale.groupBy({
          by: ['shopId', 'createdAt'],
          where: {
            businessId: businessId,
            status: 'COMPLETED',
            createdAt: { gte: yesterdayStart, lte: todayEnd }
          },
          _sum: {
            totalAmount: true
          }
        })
      ]);

      // 4. Separate metrics into dynamic memory maps for O(1) matching
      const todaySalesMap = new Map<string, number>();
      const yesterdaySalesMap = new Map<string, number>();

      salesAggregation.forEach((item) => {
        const saleDate = new Date(item.createdAt);
        const amount = Number(item._sum.totalAmount || 0);

        if (saleDate >= todayStart && saleDate <= todayEnd) {
          todaySalesMap.set(item.shopId, (todaySalesMap.get(item.shopId) || 0) + amount);
        } else if (saleDate >= yesterdayStart && saleDate <= yesterdayEnd) {
          yesterdaySalesMap.set(item.shopId, (yesterdaySalesMap.get(item.shopId) || 0) + amount);
        }
      });

      // 5. Transform individual items into fully computed UI data contracts
      const shopsWithMetrics: Shop[] = shopsData.map((shop) => {
        const latestSession = shop.cashSessions[0];
        const isOpen = latestSession && latestSession.status === "OPEN"; 
        
        // Calculate active register shifts with day prefix
        let sinceTime = "N/A";
        if (isOpen && latestSession?.openedAt) {
          const openDate = new Date(latestSession.openedAt);
          let dayPrefix = "";
          if (startOfDay(openDate).getTime() === todayStart.getTime()) {
            dayPrefix = "Today, ";
          } else if (startOfDay(openDate).getTime() === yesterdayStart.getTime()) {
            dayPrefix = "Yesterday, ";
          } else {
            dayPrefix = openDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", ";
          }
          const timeString = openDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
          sinceTime = `${dayPrefix}${timeString.toLowerCase()}`;
        }

        // 6. Compute sales variance percentage indicators
        const todayTotal = todaySalesMap.get(shop.id) || 0;
        const yesterdayTotal = yesterdaySalesMap.get(shop.id) || 0;
        
        let growthString = "0.0%";
        if (yesterdayTotal > 0) {
          const variance = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
          growthString = variance >= 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`;
        } else if (todayTotal > 0 && yesterdayTotal === 0) {
          growthString = "+100.0%"; // Indicate growth if sales exist today vs none yesterday
        }

        return {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          address: shop.address,
          phone: shop.phone,
          businessId: shop.businessId,
          city: shop.city,
          region: shop.region,
          gpsAddress: shop.gpsAddress,
          latitude: shop.latitude,
          longitude: shop.longitude,
          openingTime: shop.openingTime,
          closingTime: shop.closingTime,
          isActive: shop.isActive,
          createdAt: shop.createdAt,
          updatedAt: shop.updatedAt,
          isDeleted: shop.isDeleted,
          deletedAt: shop.deletedAt,
          _count: shop._count,
          todaySalesTotal: todayTotal,
          salesGrowth: growthString,
          cashRegister: {
            status: isOpen ? "Open" : "Closed",
            since: sinceTime,
          }
        };
      });

      const shops = shopsWithMetrics;
      return { success: true, data: shops } as AppResponse;
    } catch (error) {
      console.error("Fetching Shops Error :", error);
      return { error: "Failed to fetch stores", success: false } as AppResponse;
    }
  }

static async createShop(payload: CreateShopInput, businessId: string, userId: string) {
  try {
    const validateData = createShopSchema.parse(payload);
   
    if (!validateData.name) {
      return { error: "Shop name is required", success: false } as AppResponse;
    }

    const shopSlug = await generateUniqueShopSlug(validateData.name, businessId);

    const result = await prisma.$transaction(async(tx) => {
      // 1. Create the brand new shop branch location entry record
      const newShop = await tx.shop.create({
        data: {
          name: validateData.name,
          slug: shopSlug,
          address: validateData.address,
          phone: validateData.phone,
          city: validateData.city,
          region: validateData.region,
          gpsAddress: validateData.gpsAddress || null,
          latitude: validateData.latitude || null,
          longitude: validateData.longitude || null,
          openingTime: validateData.openingTime || null,
          closingTime: validateData.closingTime || null,
          businessId: businessId,
          isActive: true,
          isDeleted: false
        }
      });

      // 2. Fetch the creator's employee profile within this tenant context using their userId
      const creatorEmployee = await tx.employee.findFirst({
        where: {
          user: { id: userId },
          businessId: businessId,
          isDeleted: false
        }
      });


      // 👇 CHANGE THIS FROM AN IF-BLOCK TO A HARD VALIDATION GUARD
      if (!creatorEmployee) {
        throw new Error("Unauthorized: Creator must have an active employee profile linked to this business.");
      }
      

      // 3. Explicitly assign the creator to the new shop in the junction table
      await tx.employeeShop.create({
        data: {
          employeeId: creatorEmployee.id,
          shopId: newShop.id,
          businessId: businessId,
          assignedBy: creatorEmployee.id 
        }
      });

      // 4. Set this newly created shop as their active current workspace context instantly
      await tx.employee.update({
        where: { id: creatorEmployee.id },
        data: { currentShopId: newShop.id }
      });
      
      // 5. Create the structural audit trail logging marker
      await tx.auditLog.create({
        data: {
          action: `CREATE`,
          entity: "SHOP",
          entityId: newShop.id,
          userId: userId,
          businessId: businessId,
          oldValue: "None",
          details: `Created shop ${newShop.name} and mapped creator employee profile association metrics.`
        }
      });

      return newShop;
    });

    return { 
      success: true, 
      data: result, 
      message: `${result.name} branch created and assigned successfully`, 
      status: 200
    } as AppResponse;

  } catch (error) {
    console.error("Shop Addition Error:", error);
    return { error: "Failed to create shop", success: false, status: 500 } as AppResponse;
  }
}

// static async createShop(payload: CreateShopInput, businessId: string, userId: string) {
//   try {

//     const validateData = createShopSchema.parse(payload) 
   
//     if (!validateData.name) {
//       return { error: "Shop name is required", success: false } as AppResponse;
//     }

//     const shopSlug = await generateUniqueShopSlug(validateData.name, businessId);

   
//     const result = await prisma.$transaction(async(tx)=> {
//       const newShop = await tx.shop.create({
//       data: {
//         name: validateData.name,
//         slug: shopSlug,
//         address: validateData.address,
//         phone: validateData.phone,
//         city: validateData.city,
//         region: validateData.region,
//         gpsAddress: validateData.gpsAddress || null,
//         latitude: validateData.latitude || null,
//         longitude: validateData.longitude || null,
//         openingTime: validateData.openingTime || null,
//         closingTime: validateData.closingTime || null,
//         businessId: businessId,
//         isActive: true,
//         isDeleted: false
//       }
//     });

//       await tx.auditLog.create({
//         data: {
//           action: `CREATE`,
//           entity: "SHOP",
//           entityId: newShop.id,
//           userId: userId,
//           businessId: businessId,
//           oldValue: "None",
//           details: `The creation a new shop in the business`
//         }
//       });

//       return newShop;
//     })

//     return { success: true, data: result, message: `${result.name} branch created successfully`, status: 200} as AppResponse;
//   } catch (error) {
//     console.error("Shop Addition Error:", error);
//     return { error: "Failed to create shop", success: false, status: 500 } as AppResponse;
//   }
// }


static async updateShop(
  shopId: string, 
  payload: UpdateShopInput, 
  businessId: string, 
  userId: string
) {
  try {
    // 1. Structural Schema Validation
    const validateData = updateShopSchema.parse(payload);

    if (!validateData.name) {
      return { error: "Shop name is required", success: false } as AppResponse;
    }

    // 2. Transaction Scope for Database Operations
    const result = await prisma.$transaction(async (tx) => {
      
      // Fetch current database state to check authorization and populate the audit log
      const existingShop = await tx.shop.findUnique({
        where: { id: shopId, businessId: businessId } // Ensures tenant scoping isolation
      });

      if (!existingShop) {
        throw new Error("Target shop branch not found or unauthorized access.");
      }

      // Handle Slug Regeneration only if the name has changed
      let shopSlug = existingShop.slug;
      if (validateData.name.trim().toLowerCase() !== existingShop.name.trim().toLowerCase()) {
        shopSlug = await generateUniqueShopSlug(validateData.name, businessId);
      }

      // Execute Update Mutation
      const updatedShop = await tx.shop.update({
        where: { id: shopId },
        data: {
          name: validateData.name,
          slug: shopSlug,
          address: validateData.address,
          phone: validateData.phone,
          city: validateData.city,
          region: validateData.region,
          gpsAddress: validateData.gpsAddress || null,
          latitude: validateData.latitude || null,
          longitude: validateData.longitude || null,
          openingTime: validateData.openingTime || null,
          closingTime: validateData.closingTime || null,
        }
      });

      // Write Audit Trail Entry with historical values
      await tx.auditLog.create({
        data: {
          action: `UPDATE`,
          entity: "SHOP",
          entityId: updatedShop.id,
          userId: userId,
          businessId: businessId,
          oldValue: JSON.stringify({
            name: existingShop.name,
            address: existingShop.address,
            phone: existingShop.phone,
            city: existingShop.city,
            region: existingShop.region
          }),
          details: `Updated shop parameters for ${updatedShop.name} branch.`
        }
      });

      return updatedShop;
    });

    return { 
      success: true, 
      data: result.slug, 
      message: `${result.name} branch settings updated successfully`, 
      status: 200
    } as AppResponse;

  } catch (error: unknown) {
    console.error("Shop Update Error:", error);
    return { 
      error: (error as Error).message || "Failed to update shop parameters", 
      success: false, 
      status: 500 
    } as AppResponse;
  }
}



//End of class
}