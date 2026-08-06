import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/dbHelper";

export class InvoiceService {
  static async getInvoiceHistory(params: {
    businessId: string;
    shopId?: string;
    status?: "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED";
    paymentType?: "CASH" | "MOMO" | "CARD" | "SPLIT";
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        businessId,
        shopId,
        status,
        paymentType,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = params;

      if (!businessId) {
        return { success: false, error: "Multi-tenant context breach: missing business identifier.", status: 400 };
      }

      const skip = limit ? (page - 1) * limit : undefined;
      const take = limit ? limit : undefined;

      const whereClause: Prisma.InvoiceWhereInput = { businessId };
      if (shopId) whereClause.shopId = shopId;

      if (status || paymentType) {
        whereClause.sale = {};
        if (status) whereClause.sale.status = status;
        if (paymentType) whereClause.sale.paymentType = paymentType;
      }

      if (startDate || endDate) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
        whereClause.issuedAt = dateFilter;
      }

      const [invoices, totalCount] = await prisma.$transaction([
        prisma.invoice.findMany({
          where: whereClause,
          include: {
            sale: {
              include: {
                customer: {
                  select: {
                    id: true,
                    customId: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true
                  },
                },
                employee: {
                  select: {
                    id: true,
                    customId: true,
                    firstName: true,
                    lastName: true
                  },
                },
                payments: {
                  select: {
                    id: true,
                    customId: true,
                    amount: true,
                    method: true,
                    status: true,
                    reference: true,
                    momoNetwork: true,
                  },
                },
                items: {
                  include: {
                    variant: {
                      select: {
                        id: true, // 🟢 FIXED: Added id explicitly to database retrieval
                        sku: true,
                        product: { select: { name: true } },
                        variantOptions: {
                          select: {
                            attributeValue: {
                              select: {
                                id: true,
                                value: true,
                                attribute: { select: { id: true, name: true } },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { issuedAt: "desc" },
          skip,
          take,
        }),
        prisma.invoice.count({ where: whereClause }),
      ]);

      const transformedInvoices = invoices.map((inv) => {
        const saleData = inv.sale;

        // 🟢 FIXED: Safely return null or evaluate name strings for anonymous/walk-in users
        const customerData = saleData.customer 
          ? {
              id: saleData.customer.id,
              customId: saleData.customer.customId,
              name: `${saleData.customer.firstName} ${saleData.customer.lastName}`.trim(),
              phone: saleData.customer.phone,
              email: saleData.customer.email
            }
          : null;

        const employeeData = {
          id: saleData.employee.id,
          customId: saleData.employee.customId,
          name: `${saleData.employee.firstName} ${saleData.employee.lastName}`.trim(),
        };

        return {
          id: inv.id,
          customId: inv.customId,
          issuedAt: inv.issuedAt,
          dueDate: inv.dueDate,
          shopId: inv.shopId,
          businessId: inv.businessId,
          sale: {
            id: saleData.id,
            customId: saleData.customId,
            totalAmount: saleData.totalAmount,
            discountAmount: saleData.discountAmount,
            paymentType: saleData.paymentType,
            status: saleData.status,
            createdAt: saleData.createdAt,
            customer: customerData,
            employee: employeeData,
            payments: saleData.payments,
            items: saleData.items.map((item) => {
              const options = item.variant.variantOptions?.map((vo) => ({
                attributeId: vo.attributeValue.attribute.id,
                attributeName: vo.attributeValue.attribute.name,
                valueId: vo.attributeValue.id,
                value: vo.attributeValue.value,
              })) || [];

              const optionString = options.map((o) => o.value).join(" - ");
              const displayName = optionString 
                ? `${item.variant.product.name} (${optionString})` 
                : item.variant.product.name;

              return {
                id: item.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                variant: {
                  id: item.variant.id, // 🟢 No longer evaluates to undefined!
                  sku: item.variant.sku,
                  name: item.variant.product.name,
                  displayName: displayName,
                  options: options
                }
              };
            }),
          },
        };
      });

      return {
        success: true,
        invoices: transformedInvoices,
        pagination: {
          total: totalCount,
          pages: limit ? Math.ceil(totalCount / limit) : 1,
          currentPage: page,
          limit: limit || totalCount,
        },
        status: 200,
      };
    } catch (error) {
      console.error("Critical error parsing filtered historical invoice indexes:", error);
      return {
        success: false,
        error: "An internal operational database fault disrupted your invoice data stream processing.",
        status: 500,
      };
    }
  }
}