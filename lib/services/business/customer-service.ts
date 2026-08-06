import { CustomerImportPayload, CustomerValidatedArray } from "@/lib/configs/customer-config";
import { prisma } from "@/lib/dbHelper";
import { CreateCustomerSchema, createCustomerSchema } from "@/types/schema/auth.schema";
import { AppResponse } from "@/types/auth/auth";
import { generateNextCustomId } from "@/lib/utils";



export class CustomerService {

   static async createCustomer(
    data: CreateCustomerSchema, 
    userId: string, 
    businessId: string, 
    businessSlug: string,
    ipAddress: string
  ) {
    try {
        const validatedData = createCustomerSchema.parse(data);

        // 1. Check for duplicates (Phone or Email) within this business
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                businessId: businessId,
                isDeleted: false,
                OR: [
                    validatedData.email ? { email: validatedData.email } : {},
                    validatedData.phone ? { phone: validatedData.phone } : {},
                ].filter(condition => Object.keys(condition).length > 0)
            }
        });

        if (existingCustomer) {
            return { 
                error: "A customer with this email or phone number already exists.", 
                success: false, 
                status: 400 
            } as AppResponse;
        }

        // 2. Fetch the business's default loyalty tier (if one exists)
        const defaultTier = await prisma.loyaltyTier.findFirst({
            where: {
                businessId: businessId,
                isDefault: true,
                isActive: true,
            },
            select: { id: true }
        });

        const result = await prisma.$transaction(async (tx) => {

            const customIdGen = await generateNextCustomId({ tx, businessId, sequenceType: "CUSTOMER", prefix: "CUS" });
            
            // 3. Create Customer record with auto-assigned Tier
            const customer = await tx.customer.create({
                data: {
                    customId: customIdGen,
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    email: validatedData.email || null,
                    phone: validatedData.phone || null,
                    address: validatedData.address || null,
                    isCreditCustomer: validatedData.isCreditCustomer || false,
                    creditLimit: validatedData.creditLimit || 0,
                    registeredAtShopId: validatedData.registeredAtShopId || null,
                    businessId: businessId,
                    loyaltyTierId: defaultTier?.id || null, // 👈 Hook up the default tier here
                }
            });

            // 4. Initialize Customer's Loyalty Wallet at 0 points
            await tx.loyaltyWallet.create({
                data: {
                    customerId: customer.id,
                    businessId: businessId,
                    availablePoints: 0,
                    lifetimeEarned: 0,
                    lifetimeRedeemed: 0,
                    lifetimeExpired: 0
                }
            });

            // 5. Audit Log tracking
            await tx.auditLog.create({
                data: {
                    action: "CREATE",
                    entity: "CUSTOMER",
                    entityId: customer.id,
                    userId: userId,
                    businessId: businessId,
                    ipAddress: ipAddress || null,
                    logType: "CUSTOMER_CREATION",
                    details: `Create a new customer for the business || Name: ${customer.firstName} ${customer.lastName}`,
                }
            });

            return customer;
        });

        return { 
            success: true, 
            message: `Customer ${result.firstName} registered successfully!`, 
            redirectTo: `/${businessSlug}/customer_base`,
            status: 200, 
        } as AppResponse;

    } catch (error: unknown) {
        console.error("Customer registration error:", error);
        return { error: "Internal Server Error", success: false, status: 500 } as AppResponse;
    }
}

// CREATE BULK CUSTOMERS 
static async createBulkCustomersService(
    payload: { data: CustomerImportPayload[]; [key: string]: unknown },
    userId: string,
    businessId: string,
    businessSlug: string,
    ipAddress: string
) {
    try {
        const validatedData = CustomerValidatedArray.parse(payload.data);

        if (validatedData.length === 0) {
            return { error: "No customer data provided.", success: false, status: 400 } as AppResponse;
        }

        // 1. Lookup unique shop names from the payload data
        const shopNamesToLookup = [...new Set(validatedData.map(e => e.shop).filter(Boolean))];
        const shopsInDb = await prisma.shop.findMany({
            where: { 
                businessId, 
                name: { in: shopNamesToLookup as string[] } 
            },
            select: { id: true, name: true },
        });
        const shopMap = new Map(shopsInDb.map((s) => [s.name.toLowerCase(), s.id]));

        // 2. Fetch existing identifiers to avoid unique constraint crashes
        const existingEntries = await prisma.customer.findMany({
            where: {
                businessId: businessId,
                isDeleted: false,
                OR: [
                    { email: { in: validatedData.map(c => c.email).filter(Boolean) as string[] } },
                    { phone: { in: validatedData.map(c => c.phone).filter(Boolean) as string[] } }
                ]
            },
            select: { email: true, phone: true }
        });

        const existingEmails = new Set(existingEntries.map(e => e.email?.toLowerCase()));
        const existingPhones = new Set(existingEntries.map(e => e.phone));

        // 👇 FETCH DEFAULT LOYALTY TIER (Optimized: Do this once outside the transaction loop)
        const defaultTier = await prisma.loyaltyTier.findFirst({
            where: {
                businessId: businessId,
                isDefault: true,
                isActive: true,
            },
            select: { id: true }
        });

        // 3. Filter and Transform payload entries
        const newCustomersData = validatedData
            .filter(cust => {
                const emailExists = cust.email && existingEmails.has(cust.email.toLowerCase());
                const phoneExists = cust.phone && existingPhones.has(cust.phone);
                return !emailExists && !phoneExists;
            })
            .map(cust => ({
                firstName: cust.firstName,
                lastName: cust.lastName,
                email: cust.email || null,
                phone: cust.phone || null,
                address: cust.address || null,
                firstVisit: cust.firstVisit,
                lastVisit: cust.lastVisit,
                totalVisit: cust.totalVisit || 0,
                isCreditCustomer: cust.isCreditCustomer || false,
                creditLimit: cust.creditLimit || 0,
                businessId: businessId,
                registeredAtShopId: cust.shop ? shopMap.get(cust.shop.toLowerCase()) : null,
            }));

        if (newCustomersData.length === 0) {
            return { 
                error: "All customers in the file already exist in the database.", 
                success: false, 
                status: 400 
            } as AppResponse;
        }

        // 4. Wrap database operations inside a single unified interactive transaction
        const totalImported = await prisma.$transaction(async (tx) => {
            let processedCount = 0;

            for (const customer of newCustomersData) {
                // Generate chronological sequentially safe serial codes inside the active tx pipeline
                const customIdGen = await generateNextCustomId({
                    tx,
                    businessId,
                    sequenceType: "CUSTOMER",
                    prefix: "CUS"
                });

                const createdCustomer = await tx.customer.create({
                    data: {
                        customId: customIdGen,
                        firstName: customer.firstName,
                        lastName: customer.lastName,
                        email: customer.email,
                        phone: customer.phone,
                        address: customer.address,
                        firstVisit: customer.firstVisit,
                        lastVisit: customer.lastVisit,
                        totalVisit: customer.totalVisit,
                        isCreditCustomer: customer.isCreditCustomer,
                        creditLimit: customer.creditLimit,
                        businessId: businessId,
                        registeredAtShopId: customer.registeredAtShopId,
                        loyaltyTierId: defaultTier?.id || null, // 👈 Assign tier field
                    },
                });

                // 👇 Initialize the Loyalty Wallet for this bulk-imported customer
                await tx.loyaltyWallet.create({
                    data: {
                        customerId: createdCustomer.id,
                        businessId: businessId,
                        availablePoints: 0,
                        lifetimeEarned: 0,
                        lifetimeRedeemed: 0,
                        lifetimeExpired: 0
                    }
                });

                await tx.auditLog.create({
                    data: {
                        action: "CREATE",
                        entity: "CUSTOMER",
                        entityId: createdCustomer.id,
                        userId: userId,
                        businessId: businessId,
                        logType: "CREATE_CUSTOMER_BULK",
                        ipAddress: ipAddress|| null,
                        newValue: `Bulk imported customer: ${createdCustomer.firstName} ${createdCustomer.lastName}`,
                    },
                });

                processedCount++;
            }

            return processedCount;
        });

        return {
            success: true,
            message: `Successfully imported ${totalImported} customers with active loyalty settings.`,
            status: 200,
            redirectTo: `/${businessSlug}/customer_base`,
        } as AppResponse;

    } catch (error: unknown) {
        console.error("BULK_CUSTOMER_IMPORT_ERROR:", error);
        return { 
            error: error instanceof Error ? error.message : "Failed to import customers.", 
            success: false, 
            status: 500 
        } as AppResponse;
    }
}


// FETCH ALL CUSTOMERS WITH NEW LOYALTY STRUCTURE
static async getCustomers(businessId: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        businessId: businessId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        registeredAtShop: {
          select: {
            id: true,
            name: true,
          }
        },
        loyaltyTier: {
          select: {
            id: true,
            name: true,
            color: true,
            earnMultiplier: true,
          }
        },
        loyaltyWallet: {
          select: {
            availablePoints: true,  // Match schema field
            lifetimeEarned: true,   // Match schema field
          }
        },
        _count: {
          select: { 
            sales: true 
          }
        }
      }
    });

    return { 
      success: true, 
      data: customers, 
      status: 200 
    } as AppResponse;
  } catch (error) {
    console.error("GET_CUSTOMERS_ERROR:", error);
    return { error: "Failed to fetch customers", success: false, status: 500 } as AppResponse;
  }
}

// FETCH SINGLE CUSTOMER BY ID
static async getCustomerById(customerId: string, businessId: string) {
  try {
    if (!customerId || !businessId) {
      return { 
        success: false, 
        error: "Customer ID and Business ID are required.", 
        status: 400 
      } as AppResponse;
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId, // Crucial for tenant boundary security
        isDeleted: false,
      },
      include: {
        registeredAtShop: {
          select: {
            id: true,
            name: true,
          }
        },
        // 👇 FETCH THE NEW TIER DETAILS
        loyaltyTier: true, // Bringing back the full tier object (color, multipliers, etc.) for profile badges
        
        // 👇 FETCH THE NEW WALLET BALANCE AND COUNTERS
        loyaltyWallet: true, // Bringing back all point fields (available, lifetimeEarned, lifetimeRedeemed)
        
        // 👇 FETCH RECENT LOYALTY HISTORY FOR A LEDGER/TIMELINE
        loyaltyHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Limit to last 10 activities to keep performance snappy
          include: {
            shop: { select: { name: true } }, // Shows where they got/spent points
            reward: { select: { title: true } }, // If they redeemed a reward, shows what it was
          }
        },
        _count: {
          select: { sales: true }
        }
      }
    });

    if (!customer) {
      return { 
        success: false, 
        error: "Customer not found.", 
        status: 404 
      } as AppResponse;
    }

    return { 
      success: true, 
      data: customer, 
      status: 200 
    } as AppResponse;

  } catch (error) {
    console.error(`GET_CUSTOMER_BY_ID_ERROR [ID: ${customerId}]:`, error);
    return { 
      success: false, 
      error: "Failed to fetch customer details", 
      status: 500 
    } as AppResponse;
  }
}

// UPDATE CUSTOMER
static async updateCustomer(
  data: Partial<Omit<CustomerImportPayload, 'shop'>> & { registeredAtShopId?: string | null },
  customerId: string, 
  businessId: string, 
  userId: string 
) {
  try {
    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { 
          id: customerId,
          businessId: businessId // Security: ensure customer belongs to business
        },
        data: {
          ...data, // Spreading safe, direct database properties
        }
      });

      await tx.auditLog.create({
        data: {
          action: "UPDATE_CUSTOMER",
          entity: "CUSTOMER",
          entityId: customer.id,
          userId: userId,
          businessId: businessId,
          newValue: `Updated details for ${customer.firstName} ${customer.lastName}`,
        }
      });

      return customer;
    });

    return { 
      success: true, 
      message: `Customer ${updatedCustomer.firstName} ${updatedCustomer.lastName} updated successfully`, 
      data: updatedCustomer, 
      status: 200 
    } as AppResponse;

  } catch (error) {
    console.error("UPDATE_CUSTOMER_ERROR:", error);
    return { error: "Failed to update customer", success: false, status: 500 } as AppResponse;
  }
}

// SOFT DELETE SINGLE CUSTOMER
static async softDeleteCustomer(
  customerId: string, 
  userId: string,
  businessId: string, 
  businessSlug: string,
  ipAddress: string
) {
  try {
    if (!customerId) {
      return { error: "Customer ID is required", success: false, status: 400 } as AppResponse;
    }

    // First check if the customer exists and belongs to this business
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId,
        isDeleted: false
      }
    });

    if (!existingCustomer) {
      return { error: "Customer not found or already deleted", success: false, status: 404 };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Perform Soft Delete
      await tx.customer.update({
        where: {
          id: customerId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // 2. Create Audit Log for the single entity action
      await tx.auditLog.create({
        data: {
          action: "DELETE",
          entity: "CUSTOMER",
          entityId: customerId,
          userId: userId,
          ipAddress: ipAddress || null,
          businessId: businessId,
          logType: "SOFT_DELETE_CUSTOMER",
          newValue: `Customer (${existingCustomer.firstName + " " + existingCustomer.lastName || customerId}) moved to trash/deleted.`
        }
      });
    });

    return { 
      success: true, 
      message: `Successfully deleted customer.`, 
      redirectTo: `/${businessSlug}/customer_base`,
      status: 200, 
    } as AppResponse;
  } catch (error) {
    console.error(`SOFT_DELETE_CUSTOMER_ERROR [ID: ${customerId}]:`, error);
    return { error: "Failed to delete customer", success: false, status: 500 } as AppResponse;
  }
}

//SOFT DELETE MULTIPLE CUSTOMERS
static async  softDeleteBulkCustomers(
  customerIds: string[], 
  businessId: string, 
  userId: string,
  businessSlug: string,
  ipAddress: string
) {
  try {
    if (!customerIds.length) {
      return { error: "No customers selected", success: false, status: 400 };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Perform Soft Delete
      const updateCount = await tx.customer.updateMany({
        where: {
          id: { in: customerIds },
          businessId: businessId
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // 2. Create Audit Logs for each deleted customer
      await tx.auditLog.createMany({
        data: customerIds.map(id => ({
          action: "DELETE",
          entity: "CUSTOMER",
          entityId: id,
          userId: userId,
          logType: "SOFT_DELETE_CUSTOMER",
          businessId: businessId,
          ipAddress: ipAddress || null,
          newValue: "Customer moved to trash/deleted via bulk delete action"
        }))
      });

      return updateCount;
    });

    return { 
      success: true, 
      message: `Successfully deleted ${result.count} customer(s).`, 
      redirectTo: `/${businessSlug}/customer_base`,
      status: 200, 
    };
  } catch (error) {
    console.error("SOFT_DELETE_CUSTOMERS_ERROR:", error);
    return { error: "Failed to delete customers", success: false, status: 500 };
  }
 }
}