/**
 * Contact Form Schema & Types
 * Zod validation schema and TypeScript types for contact forms
 */

import * as z from "zod";

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
  fullNameEn: z.string().min(2, "Full name (English) must be at least 2 characters"),
  fullNameAr: z.string().min(2, "Full name (Arabic) must be at least 2 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  phone: z.string().min(10, "Phone number is required"),
  company: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  type: z.enum(["LEAD", "CUSTOMER", "PARTNER", "SUPPLIER"]),
  source: z.enum(["Website", "Referral", "Cold Email", "LinkedIn", "Trade Show", "Other"]),
  preferredContactMethod: z.enum(["Email", "Phone", "SMS", "WhatsApp"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Contact form data type (inferred from schema)
 */
export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Contact type options with their display properties
 */
export const typeOptions = [
  { value: "LEAD", label: "Lead", color: "destructive" },
  { value: "CUSTOMER", label: "Customer", color: "default" },
  { value: "PARTNER", label: "Partner", color: "secondary" },
  { value: "SUPPLIER", label: "Supplier", color: "outline" }
] as const;

/**
 * Preferred contact method options
 */
export const preferredContactMethodOptions = [
  "Email",
  "Phone",
  "SMS",
  "WhatsApp"
] as const;

/**
 * Lead source options
 */
export const sourceOptions = [
  "Website", 
  "Referral", 
  "Cold Email", 
  "LinkedIn", 
  "Trade Show", 
  "Other"
] as const;

/**
 * Default form values
 */
export const defaultContactFormValues: Partial<ContactFormData> = {
  fullNameEn: "",
  fullNameAr: "",
  email: "",
  phone: "",
  company: "",
  position: "",
  department: "",
  type: "LEAD",
  source: "Website",
  preferredContactMethod: "Phone",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  notes: "",
  tags: []
};
