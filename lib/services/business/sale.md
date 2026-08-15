import { Paystack } from "paystack-sdk";
import { prisma } from "@/lib/dbHelper";
import { generateNextCustomId, paystackReferenceGenerator } from "@/lib/utils";
import { CloseSessionInput, closeSessionSchema, OpenSessionInput, openSessionSchema, POSCheckoutInput, posCheckoutSchema } from "@/types/schema/sale.schema";
import { AppResponse } from "@/types/auth/auth";
import { NotificationCategory, NotificationChannel, NotificationPriority, Prisma } from "@/generated/prisma/client";
import { LoyaltyService } from "./LoyaltyService";
import { NotificationService } from "./notification-service";


const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY ?? "");

export class SaleService {

  // /**
  //  * Processes an order checkout, balances ledger cash drawers, 
  //  * accounts for inventory deductions, and initializes gateway triggers.
  //  */

  /* Processes an order checkout, balances ledger cash drawers, 
 * accounts for inventory deductions, and initializes gateway triggers.
 */
static async processCheckout(
  data: POSCheckoutInput,
  shopId: string,
  employeeId: string,
  userId: string,
  businessId: string,
  cashSessionId: string,
  ipAddress: string,
) {
  try {
    // 1. Validate Input Shape using the Zod Schema
    const validatedData = posCheckoutSchema.parse(data);
    console.log("PAYMENT METHOD: ", validatedData.paymentMethod)

    // 2. Generate a secure audit reference if an online payment path is required
    const paystackReference = paystackReferenceGenerator(validatedData.paymentMethod)

    // Pure cash payments complete instantly; MoMo & Split start out as PENDING
    const finalSaleStatus = validatedData.paymentMethod === "CASH" ? "COMPLETED" : "PENDING";

    // 3. START TRANSACTION BLOCK
    const result = await prisma.$transaction(async (tx) => {

      const saleCustomIdGen = await generateNextCustomId({tx, businessId, sequenceType: "SALE", prefix: "SAL"});
      const invoiceCustomIdGen = await generateNextCustomId({tx, businessId, sequenceType: "INVOICE", prefix: "INV"});
      
      // ── STEP A: Create the Parent Sale Record ─────────────────
      const sale = await tx.sale.create({
        data: {
          customId: saleCustomIdGen,
          totalAmount: validatedData.totalAmount,
          discountAmount: validatedData.discountAmount,
          paymentType: validatedData.paymentMethod,
          status: finalSaleStatus,
          businessId: businessId,
          shopId: shopId,
          employeeId: employeeId,
          customerId: validatedData.customerId || null,
          discountId: validatedData.discountId || null,
          cashSessionId: cashSessionId,
        }
      });

      // ── STEP B: Loop Through Cart Items & Manage Stocks ─────────────────
      for (const item of validatedData.cartItems) {
        const lineSubtotal = Number(item.quantity) * Number(item.unitPrice);

        // Instantiate invoice item rows
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productVariantId: item.productVariantId,
            businessId: businessId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            subtotal: lineSubtotal
          }
        });

        // Deduct stock instantly for CASH *AND* SPLIT payment strategies!
        if (validatedData.paymentMethod === "CASH" || validatedData.paymentMethod === "SPLIT") {
          const updatedInventory = await tx.shopInventory.update({
            where: { 
              shopId_productVariantId: { 
                shopId: shopId, 
                productVariantId: item.productVariantId 
              } 
            },
            data: { stock: { decrement: item.quantity } }
          });

          // Generate a FRESH, unique sequence customId for EVERY item line log inside the loop
          const currentStockLogId = await generateNextCustomId({
            tx,
            businessId, 
            sequenceType: "STOCK_LOG",
            prefix: "STLG"
          });

          // Write structural branch stock history logs
          await tx.stockLog.create({
            data: {
              customId: currentStockLogId,
              productVariantId: item.productVariantId,
              action: "UPDATE",
              logType: "Check Out",
              shopInventoryId: updatedInventory.id,
              employeeId: employeeId,
              businessId: businessId,
              shopId: shopId,
              change: -item.quantity,
              reason: `POS Checkout Stock Outflow (${validatedData.paymentMethod}) - Sale ID: ${sale.id}`
            }
          });
        }
      }

      // ── STEP C: Split Payments Ledger Distribution ─────────────────
      if (validatedData.paymentMethod === "CASH" || validatedData.paymentMethod === "SPLIT") {
        const cashPaymentId = await generateNextCustomId({
          tx,
          businessId,
          sequenceType: "PAYMENT",
          prefix: "PAY"
        });

        await tx.payment.create({
          data: {
            customId: cashPaymentId,
            saleId: sale.id,
            businessId: businessId,
            shopId: shopId,
            amount: validatedData.paymentMethod === "CASH" ? validatedData.totalAmount : validatedData.cashPaid,
            method: "CASH",
            status: "COMPLETED" 
          }
        });
      }

      if (validatedData.paymentMethod === "MOMO" || validatedData.paymentMethod === "SPLIT") {
        const momoPaymentId = await generateNextCustomId({
          tx,
          businessId,
          sequenceType: "PAYMENT",
          prefix: "PAY"
        });

        await tx.payment.create({
          data: {
            customId: momoPaymentId,
            saleId: sale.id,
            businessId: businessId,
            shopId: shopId,
            amount: validatedData.paymentMethod === "MOMO" ? validatedData.totalAmount : validatedData.momoPaid,
            method: "MOMO",
            status: "PENDING",
            reference: paystackReference
          }
        });
      }

      // STEP D: GENERATE SYSTEM AUDIT INVOICE DOCUMENT ─────────────────
      const today = new Date();
      await tx.invoice.create({
        data: {
          customId: invoiceCustomIdGen,
          businessId,
          shopId,
          dueDate: today, 
          saleId: sale.id,
        }
      });

      // ── STEP E: Loyalty Accrual Pipeline Processing ─────────────────
      let loyaltyMetrics = "No customer linked";
      
      if (validatedData.customerId) {
        // If your schema marks items with discountId as promotional, check here
        const matchesPromotionalRules = !!validatedData.discountId; 

        const loyaltyResult = await LoyaltyService.calculateAndProcessSalePointsWithTx({
          tx,
          businessId,
          shopId,
          saleId: sale.id,
          customerId: validatedData.customerId,
          orderTotal: validatedData.totalAmount,
          performedById: employeeId,
          isPromotionalSale: matchesPromotionalRules
        });

        loyaltyMetrics = loyaltyResult.processed 
          ? `Accrued Points: ${loyaltyResult.pointsEarned}` 
          : `Skipped Accrual Reason: ${loyaltyResult.reason}`;
      }

      // ── STEP F: Auditing Trail ─────────────────
      await tx.auditLog.create({
        data: {
          action: `CREATE`,
          entity: "SALE",
          entityId: sale.id,
          userId: userId, 
          businessId: businessId,
          oldValue: "None",
          ipAddress: ipAddress || null,
          logType: `CREATE_SALE_${validatedData.paymentMethod}`,
          details: `New sale ${validatedData.paymentMethod} created. Loyalty Status: [${loyaltyMetrics}]`
        }
      });
      // ── DISPATCH SALE NOTIFICATION TO MANAGEMENT ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          employeeId
        );

        if (recipientIds.length > 0) {
          const isCash = validatedData.paymentMethod === "CASH";
          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId,
            title: "New Sale Processed",
            message: `A new sale (${saleCustomIdGen}) amounting to GHS ${Number(validatedData.totalAmount).toFixed(2)} was completed via ${validatedData.paymentMethod}.`,
            category: NotificationCategory.SALE_COMPLETED,
            priority: isCash ? NotificationPriority.NORMAL : NotificationPriority.URGENT,
            channel: NotificationChannel.IN_APP,
          });
        }

      return { saleId: sale.id, reference: paystackReference };
    });

    // 4. STEP G: Post-Transaction Paystack Processing
    if (validatedData.paymentMethod !== "CASH" && result.reference) {
      const activeMomoCharge = validatedData.paymentMethod === "MOMO" ? validatedData.totalAmount : validatedData.momoPaid;
      const amountInPesewas = Math.round(Number(activeMomoCharge) * 100);
      
      const paystackResponse = await paystack.transaction.initialize({
        email: validatedData.customerEmail || "bismarko416@gmal.com",
        amount: amountInPesewas.toString(),
        reference: result.reference,
        channels: ["mobile_money"],
        metadata: {
          saleId: result.saleId,
          businessId,
          shopId,
          employeeId
        }
      });

      if (!paystackResponse.status) {
        throw new Error(`Paystack Gateway Error: ${paystackResponse.message}`);
      }

      if (!paystackResponse.data) {
        throw new Error("Paystack gateway returned a success status but missing checkout initialization tokens.");
      }

      const dataResult = {
        paymentMethod: validatedData.paymentMethod,
        saleId: result.saleId,
        reference: result.reference,
        authorizationUrl: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
      }

      return {
        success: true,
        message: "Paystack mobile money gateway checkout initialized successfully.",
        data: dataResult,
        status: 200,
      } as AppResponse;
    }

    //For cash payment
    // Fetch the complete sale relation structure to feed directly into the print component
    const completeSaleData = await SaleService.getSaleById(result.saleId, businessId);

    const dataResult = {
      paymentMethod: "CASH",
      saleId: result.saleId,
      sale: completeSaleData.success ? completeSaleData.sale : null,
    }

    return {
      success: true,
      data: dataResult,
      message: "Sale processed and cash register drawer logged successfully.",
      status: 201,
    };

  } catch (error: unknown) {
    console.error("Critical transactional checkout loop error:", error);
    return {
      error: (error as Error).message || "An unexpected system error occurred while generating your order.",
      success: false,
      status: 500
    };
  }
}


static async rollbackCheckout(
  saleId: string, 
  shopId: string, 
  employeeId: string, 
  businessId: string, 
  userId: string
) {
  try {
    if (!saleId) {
      throw new Error("Cannot execute transaction rollback without a valid Sale ID.");
    }

    // 1. Fetch the sale along with its items to inspect payment type and quantities
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true }
    });

    if (!sale) {
      throw new Error("Sale records not found or already deleted.");
    }

    // Guard: Only allow rolling back items that aren't finalized yet
    if (sale.status !== "PENDING") {
      throw new Error(`Security Exception: Cannot roll back a sale with status '${sale.status}'`);
    }

    // 2. START THE SYSTEM TRANSACTION BLOCK
    await prisma.$transaction(async (tx) => {
      
      // Check if this sale ran inventory code down inside processCheckout (like SPLIT)
      if (sale.paymentType === "SPLIT" || sale.paymentType === "CASH") {
        for (const item of sale.items) {
          
          // Reverse Stock: Increment back the item quantities
          const updatedInventory = await tx.shopInventory.update({
            where: {
              shopId_productVariantId: {
                shopId: shopId,
                productVariantId: item.productVariantId,
              }
            },
            data: { stock: { increment: item.quantity } }
          });

          // Generate a fresh structural logging hash
          const currentStockLogId = await generateNextCustomId({
            tx,
            businessId,
            sequenceType: "STOCK_LOG",
            prefix: "STLG"
          });

          // Write counter-balancing inventory rollback logs
          await tx.stockLog.create({
            data: {
              customId: currentStockLogId,
              productVariantId: item.productVariantId,
              action: "UPDATE",
              logType: "VOIDED_SALE",
              shopInventoryId: updatedInventory.id,
              employeeId: employeeId,
              businessId: businessId,
              shopId: shopId,
              change: item.quantity,
              reason: `POS Cancelled/Gateway Timeout Rollback - Reverted from Sale ID: ${sale.id}`
            }
          });
        }
      }

      // ── STEP C: LOYALTY REVERSAL IN Ledger AND WALLET ─────────────────
      let loyaltyRollbackMetrics = "No loyalty changes processed";

      if (sale.customerId) {
        // Find if any points ledger entry was cut for this specific sale
        const loyaltyEarnedRecord = await tx.loyaltyHistory.findFirst({
          where: { saleId: sale.id, customerId: sale.customerId, type: "EARNED" }
        });

        if (loyaltyEarnedRecord) {
          const pointsToDeduct = loyaltyEarnedRecord.points;

          // 1. Revert wallet totals directly
          const updatedWallet = await tx.loyaltyWallet.update({
            where: { customerId: sale.customerId },
            data: {
              availablePoints: { decrement: pointsToDeduct },
              lifetimeEarned: { decrement: pointsToDeduct }
            }
          });

          // 2. Erase the history row so it doesn't taint historical accounting tallies
          await tx.loyaltyHistory.delete({
            where: { id: loyaltyEarnedRecord.id }
          });

          // 3. Demote Tier Level if the unearned points falsely caused an ascension
          const availableTiers = await tx.loyaltyTier.findMany({
            where: { businessId, isActive: true },
            orderBy: { priority: "desc" }
          });

          // Recalculate where they actually belong with corrected lifetime points
          const correctTier = availableTiers.find(
            (tier) => updatedWallet.lifetimeEarned >= tier.minimumLifetimePoints
          );

          if (correctTier) {
            await tx.customer.update({
              where: { id: sale.customerId },
              data: { loyaltyTierId: correctTier.id }
            });
          }

          loyaltyRollbackMetrics = `Deducted ${pointsToDeduct} points and verified tier adjustments.`;
        }
      }

      // 4. WIPE INFRASTRUCTURE CHILD ENTRIES SECURELY (Cascade handling)
      // Clear Invoices
      await tx.invoice.deleteMany({ where: { saleId: sale.id } });
      
      // Clear Payments
      await tx.payment.deleteMany({ where: { saleId: sale.id } });
      
      // Clear Order Items
      await tx.saleItem.deleteMany({ where: { saleId: sale.id } });

      // Clear Parent Sale
      await tx.sale.delete({ where: { id: sale.id } });

      // 5. WRITE THE SYSTEM AUDIT LOG
      await tx.auditLog.create({
        data: {
          action: `ROLLBACK_SALE_${sale.paymentType}`,
          entity: "SALE",
          entityId: sale.id,
          userId: userId,
          businessId: businessId,
          oldValue: JSON.stringify({ totalAmount: sale.totalAmount }),
          details: `Sale tracking ref ${sale.customId} cancelled or network failure. Inventory, core documents, and loyalty footprints wiped. Status: [${loyaltyRollbackMetrics}]`
        }
      });
        // ── DISPATCH ROLLBACK NOTIFICATION TO MANAGEMENT ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          employeeId
        );

        if (recipientIds.length > 0) {
          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId,
            title: "Checkout Rolled Back / Voided",
            message: `Pending sale (${sale.customId}) amounting to GHS ${Number(sale.totalAmount).toFixed(2)} was rolled back due to cancellation or timeout.`,
            category: NotificationCategory.CASH_SESSION,
            priority: NotificationPriority.URGENT,
            channel: NotificationChannel.IN_APP,
          });
        }
      });

    return {
      success: true,
      message: "Pending transactional entities purged, stock levels balanced, and loyalty items safely reversed.",
      status: 200
    };

  } catch (error: unknown) {
    console.error("Critical transactional rollback loop error:", error);
    return {
      error: (error as Error).message || "An unexpected error occurred during database rollback procedures.",
      success: false,
      status: 500,
    };
  }
}

static async verifySalesStatusOnline(reference: string, userId: string) {
  try {
    if (!reference) {
      return { success: false, error: "Missing tracking reference.", status: 400 };
    }

    // 1. Look up localized records first
    const localizedPayment = await prisma.payment.findUnique({
      where: { reference },
      select: { status: true, saleId: true, shopId: true, businessId: true }
    });

    if (!localizedPayment) {
      return { success: false, error: "Transaction record not found locally.", status: 404 };
    }

    if (localizedPayment.status === "COMPLETED") {
      return { success: true, status: 200, paymentStatus: "COMPLETED", saleId: localizedPayment.saleId };
    }

    // 2. Fallback checking verification payload ping
    const paystackResponse = await paystack.transaction.verify(reference);

    if (!paystackResponse.status || !paystackResponse.data) {
      return { success: false, error: "Failed to communicate with Paystack lines.", status: 400 };
    }

    const gatewayStatus = paystackResponse.data.status; // "success", "abandoned", "failed", "ongoing", "pending"
    const metadata = paystackResponse.data.metadata;

    // Extract fallbacks safely from local or gateway sources
    const targetSaleId = (metadata?.saleId || localizedPayment.saleId) as string;
    const targetShopId = (metadata?.shopId || localizedPayment.shopId) as string;
    const targetBusinessId = (metadata?.businessId || localizedPayment.businessId) as string;
    const targetEmployeeId = (metadata?.employeeId || "SYSTEM") as string;

    // ── CASE A: PAYMENT IS EXPLICITLY SUCCESSFUL ──
    if (gatewayStatus === "success") {
      if (!targetSaleId) {
        return { success: false, error: "Paystack payload missing metadata relation scopes.", status: 422 };
      }

      const networkCarrier = paystackResponse.data.authorization?.brand || "MOMO";

      await prisma.$transaction(async (tx) => {
        const currentPayment = await tx.payment.findUnique({ where: { reference } });
        if (currentPayment?.status === "COMPLETED") return;

        await tx.payment.update({
          where: { reference },
          data: { status: "COMPLETED", momoNetwork: networkCarrier }
        });

        const parentSale = await tx.sale.update({
          where: { id: targetSaleId },
          data: { status: "COMPLETED" }
        });

        // Only deduct stock on pure MOMO fulfillment loops; SPLIT is deducted instantly at checkout
        if (parentSale.paymentType === "MOMO") {
          const itemsToDeduct = await tx.saleItem.findMany({ where: { saleId: targetSaleId } });
          
          for (const item of itemsToDeduct) {
            const updatedInventory = await tx.shopInventory.update({
              where: { 
                shopId_productVariantId: { 
                  shopId: targetShopId, 
                  productVariantId: item.productVariantId 
                } 
              },
              data: { stock: { decrement: item.quantity } }
            });

            const currentStockLogId = await generateNextCustomId({
              tx,
              businessId: targetBusinessId,
              sequenceType: "STOCK_LOG",
              prefix: "STLG"
            });

            await tx.stockLog.create({
              data: {
                customId: currentStockLogId,
                productVariantId: item.productVariantId,
                action: "UPDATE",
                logType: "Check Out",
                shopInventoryId: updatedInventory.id,
                employeeId: targetEmployeeId,
                businessId: targetBusinessId,
                shopId: targetShopId,
                change: -item.quantity,
                reason: `Online Verification Webhook Fulfill - Sale ID: ${targetSaleId}`
              }
            });
          }
        }
      });

      // 🟢 FETCH THE FULL SALE RECORD HERE SO THE FRONTEND CAN PRINT IT
      const completeSaleData = await SaleService.getSaleById(targetSaleId, targetBusinessId);

      return { 
        success: true, 
        status: 200, 
        saleId: targetSaleId, 
        paymentStatus: "COMPLETED",
        sale: completeSaleData.success ? completeSaleData.sale : null,
        message: "Transaction completed." };
    }

    // ── CASE B: PAYMENT HAS BEEN ABANDONED OR EXPLICITLY FAILED ──
    if (gatewayStatus === "abandoned" || gatewayStatus === "failed") {
      console.log(`Executing automatic system cleanup for payment status: ${gatewayStatus}`);
      
      // Call your precise static service logic directly to sweep away the ghost database entities
      const rollbackResult = await SaleService.rollbackCheckout(
        targetSaleId,
        targetShopId,
        targetEmployeeId,
        targetBusinessId,
        userId // userId placeholder for history trail logging
      );

      return {
        success: true,
        paymentStatus: "FAILED",
        status: 200,
        message: `Transaction was ${gatewayStatus}. Local system entities rolled back successfully: ${rollbackResult.success}`
      };
    }

    // ── CASE C: STRATEGIES ARE STILL ONGOING OR PENDING IN THE CLOUD ──
    return { 
      success: true, 
      paymentStatus: "PENDING",
      status: 200,
      message: "Payment is still pending"
    };

  } catch (error) {
    console.error("STATUS_VERIFICATION_ROUTE_ERROR:", error);
    return { success: false, error: "Internal operational error verifying status.", status: 500 };
  }
}


// ── METHOD GET SALES HISTORY WITH FILTERS & PAGINATION ──────────────────
static async getSalesHistory(params: {
  businessId: string;
  shopId?: string;
  employeeId?: string;
  status?: "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED";
  paymentType?: "CASH" | "MOMO" | "SPLIT";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { 
      businessId, 
      shopId, 
      employeeId, 
      status, 
      paymentType, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = params;

    // Handle conditional pagination parameter evaluation assignments safely
    const skip = params.limit ? (page - 1) * limit : undefined;
    const take = params.limit ? limit : undefined;

    // Construct highly optimized dynamic where clauses
    const whereClause: Prisma.SaleWhereInput = { businessId };
    if (shopId) whereClause.shopId = shopId;
    if (employeeId) whereClause.employeeId = employeeId;
    if (status) whereClause.status = status;
    if (paymentType) whereClause.paymentType = paymentType;

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
      whereClause.createdAt = dateFilter;
    }

    // Parallel atomic transaction sequence for maximum throughput metrics
    const [sales, totalCount] = await prisma.$transaction([
      prisma.sale.findMany({
        where: whereClause,
        include: {
          customer: { 
            select: { 
              firstName: true, 
              lastName: true, 
              phone: true 
            } 
          },
          discount: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          shop: {
            select: {
              id: true,
              name: true,
              address: true,
            }
          },
          employee: { 
            select: { 
              id: true, 
              firstName: true,
              lastName: true   
            } 
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              reference: true
            }
          },
          items: {
            select: {
                id: true,
                saleId: true,
                productVariantId: true,
                businessId: true,
                quantity: true,
                unitPrice: true,
                costPrice: true,
                subtotal: true,
                variant: {
                  select: {
                    sku: true,
                    product: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
            }
          },
          invoice: {
            select: {
              customId: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.sale.count({ where: whereClause }),
    ]);
    //TRANSFORMING DATA
    const transformedSales = sales.map((sale) => ({
      ...sale,
      items: sale.items.map((item) => ({
        ...item,
        variant: {
          sku: item.variant.sku,
          name: item.variant.product.name,
        },
      })),
    }));

    return {
      success: true,
      sales: transformedSales,
      pagination: {
        total: totalCount,
        pages: limit ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
        limit: limit || totalCount,
      },
      status: 200
    };
  } catch (error) {
    console.error("Critical error retrieving historical sales dataset:", error);
    return { 
      success: false, 
      error: "An unexpected database runtime variation broken the history stream calculation." 
    };
  }
}


// ── METHOD GET SINGLE SALE BY ID (FOR INVOICES/RECEIPTS) ────────────────
static async getSaleById(saleId: string, businessId: string) {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, businessId },
      include: {
        items: {
          include: {
            variant: { select: { id: true, product: {select: {name:true} }, sku: true } }
          }
        },
        payments: true,
        customer: true,
        employee: { select: { firstName:true, lastName:true, email: true } },
        shop: { select: { name: true, address: true, phone: true } },
        invoice: true,
        business: {select: {
            name: true,
            logoUrl: true,
            phone: true,
            email: true,
            address: true,
            currencySymbol:true
        }}
      }
    });

    if (!sale) return { success: false, error: "Requested transaction context not found." };
    return { success: true,data: sale };
  } catch (error) {
    console.error("Error pulling distinct sale file record:", error);
    return { success: false, error: "Failed to load individual sale details." };
  }
}

// ── METHOD 3: VERIFY PAYSTACK PAYMENT & DEDUCT INVENTORY ────────────────────
// static async verifyAndCompleteOnlinePayment(params: {reference: string, businessId: string}) {
//   try {
//     // 1. Fetch the corresponding payment record from the database
//     const {reference, businessId} = params;
//     const dbPayment = await prisma.payment.findFirst({
//       where: { reference, businessId },
//       include: { sale: { include: { items: true } } }
//     });

//     if (!dbPayment || dbPayment.status !== "PENDING") {
//       return { success: false, error: "No pending transaction matching this reference signature exists." };
//     }

//     // 2. Query Paystack directly to check its absolute remote resolution status
//     const paystackResponse = await paystack.transaction.verify(reference );
    
//     if (!paystackResponse.status || paystackResponse.data?.status !== "success") {
//       return { success: false, error: `Gateway transaction verification unresolved: ${paystackResponse.message}` };
//     }

//     // 3. EXECUTE THE TRANSACTION WRAPPER TO FINALIZE STOCK DEDUCTION
//     await prisma.$transaction(async (tx) => {
//       // Step A: Upgrade payment row state
//       await tx.payment.update({
//         where: { id: dbPayment.id },
//         data: { status: "COMPLETED", momoNetwork: paystackResponse.data?.authorization?.authorization_code }
//       });

//       // Step B: Upgrade the parent Sale record status
//       await tx.sale.update({
//         where: { id: dbPayment.saleId },
//         data: { status: "COMPLETED" }
//       });

//       // Step C: Retrospectively deduct warehouse inventory stocks now that money is verified!
//       for (const item of dbPayment.sale.items) {
//         const updatedInventory = await tx.shopInventory.update({
//           where: {
//             shopId_productVariantId: {
//               shopId: dbPayment.shopId,
//               productVariantId: item.productVariantId
//             }
//           },
//           data: { stock: { decrement: item.quantity } }
//         });

//         const stockLogCustomIdGen = await generateNextCustomId({tx,businessId, sequenceType: "STOCK_LOG",prefix: "STLG"});

//         // Write audit stock timeline trace log rows
//         await tx.stockLog.create({
//           data: {
//             customId: stockLogCustomIdGen,
//             productVariantId: item.productVariantId,
//             shopInventoryId: updatedInventory.id,
//             businessId,
//             shopId: dbPayment.shopId,
//             employeeId: dbPayment.sale.employeeId,
//             change: -item.quantity,
//             reason: `MOMO Payment Verified - Stock Deducted - Sale ID: ${dbPayment.saleId}`
//           }
//         });
//       }
//     });

//     return { success: true, message: "Payment successfully validated and product inventories cleared.", status: 200 };
//   } catch (error) {
//     console.error("Payment verification reconciliation lifecycle crashed:", error);
//     return { success: false, error: "Critical internal synchronization loop failure.", status: 500 };
//   }
// }

 //UTILITY: CHECK FOR CURRENT ACTIVE SHOP SESSION STATE
  // static async getCurrentActiveSession(shopId: string, businessId: string): Promise<AppResponse> {
  //   try {
  //     const activeSession = await prisma.cashSession.findFirst({
  //       where: {
  //         shopId,
  //         businessId,
  //         status: "OPEN",
  //       },
  //       include: {
  //         openedBy: {
  //           select: { name: true, email: true },
  //         },
  //       },
  //     });

  //     if (!activeSession) {
  //       return {
  //         success: false,
  //         error: "No active register session is currently open for this shop location.",
  //         status: 404,
  //       };
  //     }

  //     return {
  //       success: true,
  //       data: activeSession,
  //       status: 200,
  //     };
  //   } catch (error: unknown) {

  //      console.error("CRITICAL_GET_ACTIVE_SESSION_ERROR: ",error) 
  //     return {
  //       success: false,
  //       error: "Failed fetching active registers status mapping details.",
  //       status: 500,
  //     };
  //   }
  // }

  // ── METHOD 4: CHOOSE ACTIVE DRAWER SESSION FOR CASHIER ─────────────────────

  static async getActiveOpenCashSession(shopId: string, employeeId: string, businessId: string) {
  try {
    const session = await prisma.cashSession.findFirst({
      where: {
        shopId,
        openedById: employeeId,
        businessId,
        status: "OPEN"
      }
    });
    return { success: true, data: session };
  } catch (error: unknown) {
    console.error("ERROR_GETTING ACTIVE SESSION: ", error)
    return { success: false, error: "Error polling open shift records.", status: 500};
  }
}


/**
 * 🟢 OPENS OR RESUMES A CASH REGISTER SESSION
 * Safely fetches an existing unclosed session for the employee or builds a new one.
 */
static async openSession(
  data: OpenSessionInput,
  businessId: string,
  shopId: string,
  userId: string,
  employeeId: string,
) {
  try {
    // 1. Validate incoming form shape data
    const validatedData = openSessionSchema.parse(data);

    // 2. Look for ANY running open session in this branch
    const activeSession = await prisma.cashSession.findFirst({
      where: {
        shopId,
        businessId,
        status: "OPEN",
      },
    });

    if (activeSession) {
      // 🟢 THE WORKFLOW MASTER FIX:
      // If the open session belongs to the SAME cashier who logged out, auto-resume it!
      if (activeSession.openedById === employeeId) {
        return {
          success: true,
          data: activeSession,
          message: "Active unclosed session found for this employee. Resuming shift...",
          status: 200, // 200 OK instead of 201 Created
        };
      }

      // If it belongs to someone else, enforce security rules
      return {
        success: false,
        error: "There is already an active cash register session open for this branch by another employee.",
        status: 400,
      };
    }

    // 3. ATOMIC TRANSACTION: If no session exists anywhere, instantiate a fresh one
    const session = await prisma.$transaction(async (tx) => {
      const stockLogCustomIdGen = await generateNextCustomId({
        tx,
        businessId,
        sequenceType: "CASH_REGISTER",
        prefix: "REG"
      });

      // Create the cash session row
      const newSession = await tx.cashSession.create({
        data: {
          businessId,
          customId: stockLogCustomIdGen,
          shopId,
          openedById: employeeId,
          status: "OPEN",
          startFloat: validatedData.startFloat,
          notes: validatedData.notes || null,
        },
      });

      // Write to the Audit Trail Log
      await tx.auditLog.create({
        data: {
          action: "OPEN_CASH_SESSION",
          entity: "CASH_SESSION",
          entityId: newSession.id,
          userId: userId,
          businessId,
        },
      });

      // ── DISPATCH CASH SESSION OPENED NOTIFICATION ──
      const recipientIds = await NotificationService.getRecipientIdsByRoles(
        businessId,
        ["OWNER", "ADMIN", "MANAGER"],
        employeeId
      );

      if (recipientIds.length > 0) {
        await NotificationService.createManyInTx(tx, recipientIds, {
          businessId,
          title: "Cash Register Opened",
          message: `Cash register shift (${newSession.customId}) was opened with a start float of GHS ${Number(newSession.startFloat).toFixed(2)}.`,
          category: NotificationCategory.CASH_SESSION,
          priority: NotificationPriority.NORMAL,
          channel: NotificationChannel.IN_APP,
        });
      }

      return newSession;
    });

    return {
      success: true,
      data: session,
      message: "Cash register drawer session initialized successfully.",
      status: 201,
    };

  } catch (error: unknown) {
    console.error("CRITICAL_OPEN_SESSION_ERROR:", error);
    return {
      success: false,
      error: (error as Error).message || "An unexpected system error occurred opening register drawer.",
      status: 500,
    };
  }
}

  /**
   * 🔴 CLOSES AND BALANCES AN ACTIVE CASH SESSION SHIFT
   * Automatically aggregates startFloat and related cash collections to compute expectations.
   */
  static async closeSession(
    sessionId: string,
    data: CloseSessionInput,
    businessId: string,
    shopId: string,
    userId: string,
    employeeId: string
  ) {
    try {
      // 1. Validate closing count data
      const validatedData = closeSessionSchema.parse(data);

      // 2. Target the existing active session
      const targetSession = await prisma.cashSession.findUnique({
        where: { id: sessionId },
      });

      if (!targetSession || targetSession.status === "CLOSED" || targetSession.shopId !== shopId) {
        return {
          success: false,
          error: "Target open register session record could not be found or is already closed.",
          status: 404,
        };
      }

      // 3. START TRANSACTION BLOCK: Calculate expected cash and commit variables atomically
      const updatedSession = await prisma.$transaction(async (tx) => {
        
        // Step A: Aggregate all successful CASH balances processed during this shift line
        const cashPaymentsAggregate = await tx.payment.aggregate({
          where: {
            sale: { cashSessionId: sessionId },
            method: "CASH",
            status: "COMPLETED",
          },
          _sum: {
            amount: true,
          },
        });

        const totalCashCollected = Number(cashPaymentsAggregate._sum.amount || 0);
        const floatStartingWeight = Number(targetSession.startFloat);
        
        // Formula: Calculated Expected Cash = startFloat + totalCashCollected
        const expectedCashAmount = floatStartingWeight + totalCashCollected;

        // Step B: Update the primary CashSession row ledger with final values
        const sessionClosed = await tx.cashSession.update({
          where: { id: sessionId },
          data: {
            status: "CLOSED",
            closedById: employeeId,
            closedAt: new Date(),
            endFloat: validatedData.actualCash, // Ending physical balance counted
            expectedCash: expectedCashAmount,
            actualCash: validatedData.actualCash,
            notes: validatedData.notes 
              ? `${targetSession.notes || ""}\n[Closure Notes]: ${validatedData.notes}`
              : targetSession.notes,
          },
        });

        // Step C: Audit log recording who completed the balance check
        await tx.auditLog.create({
          data: {
            action: "CLOSE_CASH_SESSION",
            entity: "CASH_SESSION",
            entityId: sessionId,
            userId: userId,
            businessId,
          },
        });

        // ── DISPATCH CASH SESSION CLOSED NOTIFICATION ──
        const recipientIds = await NotificationService.getRecipientIdsByRoles(
          businessId,
          ["OWNER", "ADMIN", "MANAGER"],
          employeeId
        );

        if (recipientIds.length > 0) {
          const variance = Number(sessionClosed.actualCash) - Number(sessionClosed.expectedCash);
          const hasDiscrepancy = variance !== 0;

          await NotificationService.createManyInTx(tx, recipientIds, {
            businessId,
            title: hasDiscrepancy ? "Cash Register Closed with Variance" : "Cash Register Closed Balanced",
            message: hasDiscrepancy
              ? `Register shift closed with a ${variance < 0 ? "SHORTAGE" : "OVERAGE"} of GHS ${Math.abs(variance).toFixed(2)}.`
              : `Register shift closed and balanced cleanly with GHS ${Number(sessionClosed.actualCash).toFixed(2)}.`,
            category: NotificationCategory.CASH_SESSION,
            priority: hasDiscrepancy ? NotificationPriority.URGENT : NotificationPriority.NORMAL,
            channel: NotificationChannel.IN_APP,
          });
        }

        return sessionClosed;
      });

      // 4. Calculate final variance overview metrics for user warning alerts
      const variance = Number(updatedSession.actualCash) - Number(updatedSession.expectedCash);
      let statusMessage = "Register shift balanced out cleanly.";
      
      if (variance < 0) {
        statusMessage = `Register closed with a SHORTAGE of GHS ${Math.abs(variance).toFixed(2)}.`;
      } else if (variance > 0) {
        statusMessage = `Register closed with an OVERAGE of GHS ${variance.toFixed(2)}.`;
      }

      return {
        success: true,
        data: {
          id: updatedSession.id,
          expectedCash: updatedSession.expectedCash,
          actualCash: updatedSession.actualCash,
          variance: Number(variance.toFixed(2)),
        },
        message: statusMessage,
        status: 200,
      };
    } catch (error: unknown) {
      console.error("CRITICAL_CLOSE_SESSION_ERROR:", error);
      return {
        success: false,
        error: (error as Error).message || "An unexpected system error occurred while sealing the drawer lines.",
        status: 500,
      };
    }
  }


  // ── METHOD 7: GET ALL CASH SESSIONS WITH FILTERS & RECONCILIATION DATA ─────
  static async getAllCashSessions(params: {
    businessId: string;
    shopId?: string;
    openedById?: string;
    status?: "OPEN" | "CLOSED";
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { 
        businessId, 
        shopId, 
        openedById, 
        status, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10 
      } = params;
      
      const skip = (page - 1) * limit;

      // 1. 🟢 STRICTLY TYPED WHERE CLAUSE USING PRISMA SCHEMA GENERATIONS
      const whereClause: Prisma.CashSessionWhereInput = {
        businessId,
      };
      
      if (shopId) whereClause.shopId = shopId;
      if (openedById) whereClause.openedById = openedById;
      if (status) whereClause.status = status;
      
    if (startDate || endDate) {
      // ── 🟢 INITIATE A STRONGLY TYPED FILTER COMPONENT
      const dateFilter: Prisma.DateTimeFilter = {};
      
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      whereClause.openedAt = dateFilter;
    }

      // 2. Parallel query transaction for performance metrics optimization
      const [sessions, totalCount] = await prisma.$transaction([
        prisma.cashSession.findMany({
          where: whereClause, // TypeScript natively validates this match now!
          include: {
            openedBy: { 
              select: { 
              id: true, 
              firstName: true,  
              lastName: true,   
              email: true, 
              }
            },
            closedBy: { 
             select: { 
              id: true, 
              firstName: true,  
              lastName: true, 
              email: true 
            }
            },
            shop: { select: { id: true, name: true } },
            _count: {
              select: { sales: true }
            }
          },
          orderBy: { openedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.cashSession.count({ where: whereClause }),
      ]);

      return {
        success: true,
        sessions,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      console.error("Critical failure fetching cash drawer registry entries:", error);
      return { 
        success: false, 
        error: "An unexpected system error occurred while generating shift lists." 
      };
    }
  }


}