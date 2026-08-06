// types/schema/business-profile.schema.ts
import { z } from "zod";

export const businessProfileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  businessSlug: z.string().min(2, "Slug is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(9, "Valid contact number is required"),
  address: z.string().min(5, "Full physical address is required"),
  country: z.string().min(2, "Country selection is required"),
  countryCode: z.string().min(2, "Country code is required"),
  currencyCode: z.string().min(3, "Currency code is required"),
  currencySymbol: z.string().min(1, "Currency symbol is required"),
  locale: z.string().min(2, "Locale is required"),
  dateFormat: z.string(),
  timeFormat: z.string(),
  numberFormat: z.string(),
  timezone: z.string(),
  workStartTime: z.string(),
  workCloseTime: z.string(),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
export const UpdateBusinessProfileSchema = businessProfileSchema.partial();