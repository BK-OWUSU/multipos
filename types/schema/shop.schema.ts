import { z } from "zod";
import {Shop as PrismaShop} from "@/generated/prisma/client";

export const createShopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters long."),
  shopSlug: z.string().nullable().optional(),
  address: z.string().min(5, "Physical street address description required."),
  phone: z.string().min(9, "Provide a valid administrative telephone number."),
  city: z.string().min(2, "City designation required."),
  region: z.string().min(2, "Region designation required (e.g., Ashanti Region, Greater Accra)."),
  
  // Optional geo-tracking fields
  gpsAddress: z.string().nullable().optional(),
  latitude: z.union([z.number(), z.string()]).transform((val) => val ? val.toString() : null).nullable().optional(),
  longitude: z.union([z.number(), z.string()]).transform((val) => val ? val.toString() : null).nullable().optional(),
  
  // Time ranges can be collected cleanly via text input components
  openingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must match HH:MM validation rules.").optional(),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must match HH:MM validation rules.").optional(),
});

export type CreateShopInput = z.input<typeof createShopSchema>;

export const updateShopSchema = createShopSchema.extend({
  id: z.string().min(1, "Target shop verification identifier is required."),
});

export type UpdateShopInput = z.input<typeof updateShopSchema>;


export type Shop = PrismaShop & {
    _count: {
    currentEmployees: number;
    inventories: number;
    sales: number;
};
todaySalesTotal: number;
  salesGrowth: string;
  cashRegister: {
      status: "Open" | "Closed";
    since: string;
  };
};

export const setCurrentShop = z.object({
    shopId: z.string().min(1, "Target shop verification identifier is required."),
});
export type setCurrentShopInput = z.input<typeof setCurrentShop>;

