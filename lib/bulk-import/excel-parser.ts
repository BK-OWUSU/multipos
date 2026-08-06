// lib/bulk-import/excel-parser.ts
import * as XLSX from 'xlsx';
import { z, ZodError } from 'zod';
// import { CSVParseResult, CSVParseError, BulkImportConfig } from '@/types/schema/bulkupload.schema';
import { BulkImportConfig, CSVParseError, CSVParseResult } from '@/types/schema/bulkImport';

/**
 * Parses an Excel (.xlsx) file, skipping the "Instructions" tab 
 * and validating rows inside the data tab against your Zod schema.
 */
export async function parseExcel<TSchema extends z.ZodTypeAny>(
  file: File,
  config: BulkImportConfig<TSchema>
): Promise<CSVParseResult<z.infer<TSchema>>> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const dataSheetName = "Import Data";
    const dataSheet = workbook.Sheets[dataSheetName];

    if (!dataSheet) {
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: `Missing required sheet tab named: "${dataSheetName}"` }]
      };
    }

    // Convert data sheet rows strictly into a type-safe array of unknown mappings
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(dataSheet, { defval: "" });
    
    const validRows: z.infer<TSchema>[] = [];
    const errors: CSVParseError[] = [];

    rawRows.forEach((row, index) => {
      const cleanedRow: Record<string, unknown> = {};
      
      Object.keys(row).forEach((key) => {
        const value = row[key];
        cleanedRow[key.trim()] = typeof value === 'string' ? value.trim() : value;
      });

      // Avoid processing phantom rows (empty Excel entries with spaces/formatting)
      const hasContent = Object.values(cleanedRow).some(val => val !== "");
      if (!hasContent) return;

      try {
        const validatedRow = config.schema.parse(cleanedRow);
        
        if (config.validateRow) {
          const customValidation = config.validateRow(validatedRow, index);
          if (!customValidation.valid) {
            errors.push({
              row: index + 2, 
              message: customValidation.error || 'Validation failed',
              data: cleanedRow, // Perfect match! No type casting required
            });
            return;
          }
        }
        
        validRows.push(validatedRow);
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach((err) => {
            errors.push({
              row: index + 2,
              field: err.path.map(p => p.toString()).join('.'), // Safely flatten nested path segments into strings
              message: err.message,
              data: cleanedRow,
            });
          });
        } else if (error instanceof Error) {
          errors.push({
            row: index + 2,
            message: error.message || 'Invalid row format',
            data: cleanedRow,
          });

        } else {
          errors.push({
            row: index + 2,
            message: 'Unknown validation error',
            data: cleanedRow,
          });
        }
      }
    });

    // console.dir({ validRows, errors }, { depth: null });
    
    return {
      success: errors.length === 0,
      data: validRows,
      errors,
    };

  } catch (error: unknown) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: `Excel reading error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}

/**
 * Downloads a pre-designed template file (.xlsx) directly from the public folder.
 */
export function downloadTemplate<TSchema extends z.ZodType>(
  config: BulkImportConfig<TSchema>
): void {
  const filename = `${config.customTemplatePath?.toLowerCase()}_import_template.xlsx`;
  const fileUrl = `/import-templates/${filename}`;

  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
