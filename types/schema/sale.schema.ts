import { z } from "zod";

// 1. Core Cart Item Structure
export const cartItemSchema = z.object({
  productVariantId: z.string().cuid({ message: "Invalid product variant identifier." }),
  quantity: z.number().int().positive({ message: "Quantity must be at least 1." }),
  unitPrice: z.number().positive({ message: "Unit price must be greater than 0." }),
  costPrice: z.number().nonnegative({ message: "Cost price cannot be negative." }),
});

// 2. Main POS Checkout Schema
export const posCheckoutSchema = z
  .object({
    businessId: z.string().cuid({ message: "Invalid Business (Tenant) ID." }),
    shopId: z.string().cuid({ message: "Invalid Storefront Shop ID." }),
    employeeId: z.string().cuid({ message: "Invalid Employee ID." }),
    cashSessionId: z.string().cuid({ message: "Active Cash Session ID is required to open register lines." }),
    customerId: z.string().cuid().nullable().optional(),
    discountId: z.string().cuid().nullable().optional(),
    
    cartItems: z.array(cartItemSchema).min(1, { message: "Your cart must contain at least one product item." }),
    
    totalAmount: z.number().positive({ message: "Total amount must be a valid positive number." }),
    discountAmount: z.number().nonnegative({ message: "Discount amount cannot be negative." }).default(0),
    
    paymentMethod: z.enum(["CASH", "MOMO", "SPLIT"], {
      errorMap: () => ({ message: "Method must be either CASH, MOMO, or SPLIT transactions." }),
    }),
    
    // Fallback defaults handling split logic properties safely
    cashPaid: z.number().nonnegative({ message: "Physical cash submitted cannot be negative." }).default(0),
    momoPaid: z.number().nonnegative({ message: "MoMo requested charge cannot be negative." }).default(0),
    
    customerEmail: z.string().email({ message: "A valid email address is required for processing Paystack invoices." }).optional().or(z.literal("")),
  })
  // ── 🛡️ MULTI-FIELD SPLIT VALIDATION REFINEMENT ──
  .refine(
    (data) => {
      if (data.paymentMethod === "SPLIT") {
        const calculatedTotal = Number((data.cashPaid + data.momoPaid).toFixed(2));
        const absoluteTarget = Number(data.totalAmount.toFixed(2));
        return calculatedTotal === absoluteTarget;
      }
      return true;
    },
    {
      message: "For Split Payments, the sum of Cash Paid and MoMo Paid must exactly equal the Total Amount.",
      path: ["momoPaid"], // Highlights the MoMo collection input wrapper on mismatch
    }
  );

// 3. INFERRED TYPES FOR TYPESCRIPT ENGINE
export type POSCheckoutInput = z.infer<typeof posCheckoutSchema>;
export type POSCartItemInput = z.infer<typeof cartItemSchema>;



// ── CASH SESSION VALIDATION SCHEMAS ──────────────────
export const openSessionSchema = z.object({
  startFloat: z.number().nonnegative({ message: "Starting float amount cannot be negative." }),
  notes: z.string().optional(),
});

export const closeSessionSchema = z.object({
  cashSessionId: z.string().cuid({ message: "Active Cash Session ID is required to open register lines." }),
  actualCash: z.number().nonnegative({ message: "Physical counted cash cannot be negative." }),
  notes: z.string().optional(),
});

export type OpenSessionInput = z.infer<typeof openSessionSchema>;
export type CloseSessionInput = z.infer<typeof closeSessionSchema>;