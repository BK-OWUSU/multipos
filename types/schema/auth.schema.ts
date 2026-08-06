import {z} from "zod"

export const signupSchema = z.object({
    // Step 1: Business Info
    businessName: z.string().min(2,"Business name is required"),
    countryCode: z.string().min(2, "Please select a country"),

    // Step 2: Create Shop (Aligned exactly with your real DB schema)
    shopName: z.string().min(2, "Shop name must be at least 2 characters."),
    shopAddress: z.string().min(5, "Shop address is required.").or(z.literal("")), // optional but validated if entered, or force string depending on choice
    shopPhone: z.string().min(7, "A valid contact number is required.").or(z.literal("")),

    // Step 3: Owner Profile & Security
    firstName: z.string().min(2,"First name must be at least 2 characters"),
    lastName: z.string().min(2,"Last name cannot be empty"),
    email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
    password: z.string().min(8,"Password must be at least 8 characters"),
    confirmPassword: z.string(),
    
    // Step 4: Agreement
    termsAgreement: z.boolean().refine((val)=> val === true, {
        message: "You must agree to the terms and conditions"
    })
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]});

export type SignUpFormSchema = z.infer<typeof signupSchema>;




export const loginSchema = z.object({
  // email is a method of string, not a top-level function
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
    
  // Use .min(1) to prevent empty strings
  password: z
    .string()
    .min(1, "Password field cannot be empty")
});
export type LoginSchema = z.infer<typeof loginSchema>;

//OTP SCHEMA
export const otpSchema = z.object({
  pin: z.string().length(6, "Verification code must be 6 digits"),
});
export type OTPFormSchema = z.infer<typeof otpSchema>;

//EMPLOYEE SCHEMA
export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  phone: z.string().optional().nullable(),
  imageUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  fileKey: z.string().optional().nullable().or(z.literal("")),
  roleId: z.string().min(1, "Role is required"),
  currentShopId: z.string().optional().nullable(),
  // New fields from your full model
  designation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  hasSystemAccess: z.boolean(),
});
export type CreateEmployeeSchema = z.input<typeof createEmployeeSchema>;

export const updateEmployeeShopsInputSchema = z.object({
  employeeId: z.string(),
  shopIds: z.array(z.string()),
});
export type UpdateEmployeeShopsInput = z.input<typeof updateEmployeeShopsInputSchema>;

//PASSWORD CHANGE
export const passwordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type PasswordSchema = z.infer<typeof passwordSchema>;

// ─── CREATE CUSTOMER SCHEMA ────────────────────────────────────────────
export const createCustomerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address").toLowerCase().trim().optional().nullable().or(z.literal("")),
  phone: z
.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z.string().max(500, "Address must be at most 500 characters").optional().nullable().or(z.literal("")),
  isCreditCustomer: z.boolean().default(false), 
  creditLimit: z.coerce.number().min(0, "Credit limit must be non-negative").default(0),
  registeredAtShopId: z.string().optional().nullable().or(z.literal("")),
});
export type CreateCustomerSchema = z.input<typeof createCustomerSchema>;

// ─── QUICK CUSTOMER SCHEMA (For POS) ──────────────────────────────────
// Simplified schema for quick customer creation during sales
export const quickCustomerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z
    .string()
    .min(10, "Phone number required")
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number"),
});
export type QuickCustomerSchema = z.infer<typeof quickCustomerSchema>;

// ─── CUSTOMER SEARCH SCHEMA ────────────────────────────────────────────
export const customerSearchSchema = z.object({
  query: z.string().min(1, "Search query required"),
  isCreditCustomer: z.boolean().optional(),
  shopId: z.string().optional(),
});
export type CustomerSearchSchema = z.infer<typeof customerSearchSchema>;

//ROLE SHCEMA
export const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters").max(100, "Role name too long").trim(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
  access: z.array(z.string()).min(1, "Select at least one access route"),
  description: z.string().optional().nullable(),
  expiresAt: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      return typeof val === "string" ? new Date(val) : val;
    }),
});
export type CreateRoleFormValues = z.input<typeof createRoleSchema>;
export const updateRoleSchema = createRoleSchema.partial();