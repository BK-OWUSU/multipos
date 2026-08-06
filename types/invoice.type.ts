export type SaleStatus = "COMPLETED" | "PENDING" | "CANCELLED" | "REFUNDED";
export type PaymentType = "CASH" | "MOMO" | "CARD" | "SPLIT";
export type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED";

export interface InvoiceItemOption {
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
}

export interface InvoiceItem {
  id: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  variant: {
    id: string;
    sku: string;
    name: string;        // Base product name (e.g., "Milo")
    displayName: string; // Fully built composite name (e.g., "Milo (Medium - 400g)")
    options: InvoiceItemOption[]; // The individual parsed attributes array
  };
}

export interface InvoicePaymentBreakdown {
  id: string;
  customId: string;
  amount: string | number;
  method: PaymentType;
  status: PaymentStatus;
  reference?: string | null;
  momoNetwork?: string | null;
}

export interface CompleteInvoicePayload {
  id: string;
  customId: string; 
  issuedAt: string | Date;
  dueDate: string | Date;
  
  // Nested fully-resolved sale structure
  sale: {
    id: string;
    customId: string; 
    totalAmount: string | number;
    discountAmount: string | number;
    paymentType: PaymentType;
    status: SaleStatus;
    createdAt: string | Date;
    
    // Core structural metadata relations
    shop: {
      id: string;
      name: string;
      address?: string | null;
      phone?: string | null;
    };
    employee: {
      id: string;
      customId: string;
      name: string;
    };
    customer?: {
      id: string;
      customId: string
      name: string;
      phone?: string | null;
      email?: string | null;
    } | null;
    
    // Arrays
    items: InvoiceItem[];
    payments: InvoicePaymentBreakdown[];
  };
}