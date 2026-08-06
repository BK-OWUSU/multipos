// lib/bulk-import/types.ts
import { z } from 'zod';

export type ImportHandler<T = unknown> = 
  | string // API endpoint
  | ((payload: { data: T[]; [key: string]: unknown }) => Promise<BulkImportResult>); // Server action

export interface BulkImportConfig<TSchema extends z.ZodType, TOutput = z.infer<TSchema>> {
  entityName: string;
  entityNamePlural: string;
  schema: TSchema;
  apiEndpoint: ImportHandler<TOutput>;
  
  transformData?: (data: z.infer<TSchema>) => TOutput | Record<string, unknown>;
  // transformData?: (data: z.infer<TSchema>) => TOutput;
  validateRow?: (row: z.infer<TSchema>, index: number) => { valid: boolean; error?: string };
  customTemplatePath?: string;
}

export interface CSVParseError {
  row: number;
  field?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface CSVParseResult<T> {
  success: boolean;
  data: T[];
  errors: CSVParseError[];
}

export interface BulkImportSuccessItem {
  identifier: string;
  id: string;
}

export interface BulkImportFailedItem {
  identifier: string;
  reason: string;
}

export interface BulkImportResult {
  success: boolean;
  total: number;
  success_count: number;
  failed_count: number;
  successful?: BulkImportSuccessItem[];
  failed?: BulkImportFailedItem[];
  message?: string;
  error?: string;
}