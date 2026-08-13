  export type SaleReceipt = {
    customId: string;
    createdAt: Date | string;
    totalAmount: number | string;
    discountAmount: number | string;
    paymentType: string;
    business?: {
      name: string;
      logoUrl?: string | null ;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      currencySymbol?: string;
    };
    shop: {
      name: string;
      address?: string | null;
      phone?: string | null;
      city?: string | null;
    };
    employee: {
      firstName: string;
      lastName: string;
    };
    customer?: {
      firstName: string;
      lastName: string;
      phone?: string | null;
    } | null;
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number | string;
      subtotal: number | string;
      variant: {
        sku: string;
        product: {
          name: string;
        };
      };
    }>;
    payments?: Array<{
      method: string;
      amount: number | string;
      reference?: string | null;
    }>;
  }