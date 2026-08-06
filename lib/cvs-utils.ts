// lib/csv-utils.ts
import Papa from "papaparse";
import { z } from "zod";

export type TransformerConfig<T> = {
  file: File;
  schema: z.ZodSchema<T[]>; // Validates the entire array
  mapRow: (row: Record<string, string>) => T; // CSV rows are always string records initially
  onSuccess: (data: T[]) => Promise<void>;
  onError: (error: string) => void;
};

export const transformCSV = <T>({ 
  file, 
  schema, 
  mapRow, 
  onSuccess, 
  onError 
}: TransformerConfig<T>) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      // 1. Map the raw string data to our object structure
      const mappedData = (results.data as Record<string, string>[]).map(mapRow);
      
      // 2. Validate with Zod
      const validation = schema.safeParse(mappedData);
      
      if (!validation.success) {
        // Formats Zod errors into a readable string
        const errorMsg = validation.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        onError(`Validation Error: ${errorMsg}`);
        return;
      }

      // 3. Trigger the upload
      await onSuccess(validation.data);
    },
    error: (error) => onError(error.message),
  });
};