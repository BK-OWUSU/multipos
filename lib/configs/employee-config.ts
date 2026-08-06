// lib/bulk-import/configs/employee-config.ts
import { z } from 'zod';
import {BulkImportConfig} from '@/types/schema/bulkImport';
import { createBulkEmployees } from '@/lib/actions/business/employeesActions';
import * as XLSX from 'xlsx';

export const employeeCSVSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),

  dateOfBirth: z
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
      // Case 3: Read as a plain string text format block (e.g. "1995-12-25")
      const parsedDate = new Date(val);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }),
  role: z.string().min(1, "Role is required"),
  currentShopId: z.string().optional().nullable(),
  hasSystemAccess: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val.toLowerCase() === 'true' || val === '1';
    }),
});
export type EmployeeCSVRow = z.infer<typeof employeeCSVSchema>;


export interface EmployeeImportPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  designation: string | null;
  address: string | null;
  dateOfBirth: Date | null;
  role: string;
  currentShopId: string | null;
  hasSystemAccess: boolean;
}

export const employeeImportConfig: BulkImportConfig<typeof employeeCSVSchema, EmployeeImportPayload> = {
  entityName: 'Employee',
  entityNamePlural: 'Employees',
  schema: employeeCSVSchema,
  apiEndpoint: createBulkEmployees,
  // apiEndpoint: '/api/employees/bulk-import',
  customTemplatePath: 'employees',
  
  transformData: (row: EmployeeCSVRow): EmployeeImportPayload => ({
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone || null,
    designation: row.designation || null,
    address: row.address || null,
    dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
    role: row.role,
    currentShopId: row.currentShopId && row.currentShopId !== '' ? row.currentShopId : null,
    hasSystemAccess: row.hasSystemAccess,
  }),
};


export const EmployeeValidatedSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  
  // FIX: Change string() to date() since the payload contains Date objects
  dateOfBirth: z.date().optional().nullable(), 
  
  role: z.string().min(1), 
  currentShopId: z.string().optional().nullable(),
  hasSystemAccess: z.boolean(),
});

export const EmployeeValidatedArray = z.array(EmployeeValidatedSchema);