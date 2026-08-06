// lib/bulk-import/csv-parser.ts
import Papa from 'papaparse';
import { z, ZodError } from 'zod';
import { CSVParseResult, CSVParseError, BulkImportConfig } from '@/types/schema/bulkupload.schema';

interface PapaParseError {
  type: string;
  code: string;
  message: string;
  row?: number;
}

interface PapaParseResult<T> {
  data: T[];
  errors: PapaParseError[];
  meta: {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

export async function parseCSV<TSchema extends z.ZodType>(
  file: File,
  config: BulkImportConfig<TSchema>
): Promise<CSVParseResult<z.infer<TSchema>>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results: PapaParseResult<Record<string, string>>) => {
        const validRows: z.infer<TSchema>[] = [];
        const errors: CSVParseError[] = [];

        results.data.forEach((row: Record<string, string>, index: number) => {
          try {
            const validatedRow = config.schema.parse(row);
            
            if (config.validateRow) {
              const customValidation = config.validateRow(validatedRow, index);
              if (!customValidation.valid) {
                errors.push({
                  row: index + 2,
                  message: customValidation.error || 'Validation failed',
                  data: row,
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
                  field: err.path[0]?.toString(),
                  message: err.message,
                  data: row,
                });
              });
            } else if (error instanceof Error) {
              errors.push({
                row: index + 2,
                message: error.message || 'Invalid row format',
                data: row,
              });
            } else {
              errors.push({
                row: index + 2,
                message: 'Unknown validation error',
                data: row,
              });
            }
          }
        });

        resolve({
          success: errors.length === 0,
          data: validRows,
          errors,
        });
      },
      error: (error: Error) => {
        resolve({
          success: false,
          data: [],
          errors: [
            {
              row: 0,
              message: `CSV parsing error: ${error.message}`,
            },
          ],
        });
      },
    });
  });
}

export function generateCSVTemplate<TSchema extends z.ZodType>(
  config: BulkImportConfig<TSchema>
): string {
  if (config.generateTemplate) {
    return config.generateTemplate();
  }

  const headers = config.templateHeaders.join(',');
  const example = config.templateExample.join(',');
  return `${headers}\n${example}`;
}

export function downloadTemplate<TSchema extends z.ZodType>(
  config: BulkImportConfig<TSchema>
): void {
  const csv = generateCSVTemplate(config);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${config.entityName.toLowerCase()}_import_template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}