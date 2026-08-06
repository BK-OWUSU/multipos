// ── EXTRACTED PRISMA-SHAPED INTERFACES ──

import { DiscountType } from "@/generated/prisma/browser";

export type SaleItem = {
  id: string;
  saleId: string;
  productVariantId: string;
  businessId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  variant?: {
    name: string;
    sku?: string;
  };
}

export type PaymentRecord = {
  id: string;
  customId: string;
  saleId: string;
  amount: number;
  method: "CASH" | "MOMO" | "SPLIT";
  status: "COMPLETED" | "PENDING" | "FAILED";
  reference?: string | null;
  createdAt: string;
}

export type Sale = {
  id: string;
  customId: string;
  totalAmount: number;
  discountAmount: number;
  discountId: string;
  paymentType: "CASH" | "MOMO" | "SPLIT" | "CARD";
  status: "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED";
  businessId: string;
  shopId: string;
  employeeId: string;
  cashSessionId?: string | null;
  createdAt: string;
  // Relations
  items?: SaleItem[];
  payments?: PaymentRecord[];
  customerId?: string | null;
  customer?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
  } | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  invoice?: {
    customId: string;
  } | null;
  shop? : {
    id: string,
    name: string,
    address: string,
  }| null;
  discount?: {
    id: string,
    name: string,
    type: DiscountType
  } | null 
}

export type ActiveCashSession =  {
  id: string;
  customId : string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string | null;
  startFloat: number;
  endFloat?: number | null;
  expectedCash?: number | null;
  actualCash?: number | null;
  openedById: string;
  notes?: string | null;
}

// Define a type representing the structured data fields inside our CashSession row
export type CashSession = {
  id: string;
  customId : string;
  businessId: string;
  shopId: string;
  openedById: string;
  closedById: string | null;
  status: "OPEN" | "CLOSED";
  openedAt: Date;
  closedAt: Date | null;
  startFloat: number;
  endFloat: number | null;
  expectedCash: number | null;
  actualCash: number | null;
  notes: string | null;
  openedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }; 
  closedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type CashSessionSummary = {
    id: string;
    customId: string;
    openedBy: string;
    closedBy: string | null;
    openedAt: string;
    closedAt: string | null;
    startFloat: number;
    status: "OPEN" | "CLOSED";
}
