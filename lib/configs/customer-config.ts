import { z } from 'zod';
import {BulkImportConfig} from '@/types/schema/bulkImport';
import { createBulkCustomer } from '../actions/business/customer-actions';
import * as XLSX from 'xlsx';;

// 1. Schema for parsing the raw CSV string data
export const customerCSVSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim().optional().nullable().or(z.literal('')),
  phone: z
    .string()
  .transform(val => {
    if (!val) return null;
    // Handle scientific notation
    if (val.includes("E")) {
      val = Number(val).toString();
    }
    let digits = val.replace(/\D/g, "");
    // Fix missing leading zero (Ghana)
    if (digits.length === 9 && !digits.startsWith('0')) {
      digits = "0" + digits;
    }
    return digits;
  })
  .refine(val => !val || val.length >= 10, {
    message: "Phone number must be at least 10 digits",
  })
  .nullable()
  .optional()
  .or(z.literal("")),
  address: z.string().optional().nullable(),
  shop: z.string().optional().nullable(),
  firstVisit: z
      .union([z.date(), z.string(), z.number()])
      .optional()
      .nullable()
      .transform((val) => {
        if (!val || val === "") return null;
        
        // Case 1: Already safely extracted as an instance of JavaScript Date objects
        if (val instanceof Date) return val;
        
        // Case 2: Extracted as an Excel structural serial number integer (e.g. 46166)
        if (typeof val === 'number') {
          try {
            const parsed = XLSX.SSF.parse_date_code(val);
            return new Date(parsed.y, parsed.m - 1, parsed.d);
          } catch {
            return null;
          }
        }
        
        const parsedDate = new Date(val);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }),  
      lastVisit: z
      .union([z.date(), z.string(), z.number()])
      .optional()
      .nullable()
      .transform((val) => {
        if (!val || val === "") return null;
        
        // Case 1: Already safely extracted as an instance of JavaScript Date objects
        if (val instanceof Date) return val;
        
        // Case 2: Extracted as an Excel structural serial number integer (e.g. 46166)
        if (typeof val === 'number') {
          try {
            const parsed = XLSX.SSF.parse_date_code(val);
            return new Date(parsed.y, parsed.m - 1, parsed.d);
          } catch {
            return null;
          }
        }
        
        const parsedDate = new Date(val);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }),

  totalVisit: z
    .union([z.string(), z.number()])
    .transform((val) => (val === '' || val === null ? 0 : Number(val)))
    .default(0),
  isCreditCustomer: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      if (!val) return false;
      return val.toLowerCase() === 'true' || val === '1';
    })
    .default(false),
  creditLimit: z
    .union([z.string(), z.number()])
    .transform((val) => (val === '' || val === null ? 0 : Number(val)))
    .default(0),
});

export type CustomerCSVRow = z.infer<typeof customerCSVSchema>;
export const CustomerValidatedArray = z.array(customerCSVSchema)

// 2. Interface for the transformed payload sent to the server
export interface CustomerImportPayload {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  shop: string | null;
  firstVisit: Date | null;
  lastVisit: Date | null;
  totalVisit: number;
  isCreditCustomer: boolean;
  creditLimit: number;
}

// 3. The main configuration object
export const customerImportConfig: BulkImportConfig<typeof customerCSVSchema, CustomerImportPayload> = {
  entityName: 'Customer',
  entityNamePlural: 'Customers',
  schema: customerCSVSchema,
//   apiEndpoint: createBulkCustomers,
  apiEndpoint: createBulkCustomer,  
  customTemplatePath: 'customers',


  transformData: (row: CustomerCSVRow): CustomerImportPayload => ({
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email && row.email !== '' ? row.email : null,
    phone: row.phone || null,
    address: row.address || null,
    shop: row.shop && row.shop.toLowerCase() !== 'null' ? row.shop : null,
    firstVisit: row.firstVisit ? new Date(row.firstVisit) : null,
    lastVisit: row.lastVisit ? new Date(row.lastVisit) : null,
    totalVisit: row.totalVisit,
    isCreditCustomer: row.isCreditCustomer,
    creditLimit: row.creditLimit,
  }),

    validateRow: (row: CustomerCSVRow): { valid: boolean; error?: string } => {
    if (!row.email && !row.phone) {
      return {
        valid: false,
        error: 'Customer must have either email or phone number',
      };
    }
    return { valid: true };
  },
};

// 4. Schema for validated data (used after transformation)
export const CustomerValidatedSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  firstVisit: z.date().nullable(),
  lastVisit: z.date().nullable(),
  totalVisit: z.number().int().nonnegative(),
  isCreditCustomer: z.boolean(),
  creditLimit: z.number().nonnegative(),
});

// export const CustomerValidatedArray = z.array(CustomerValidatedSchema);