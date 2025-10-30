/**
 * Contact Form Schema & Types
 * Zod validation schema and TypeScript types for contact forms
 */

import * as z from "zod";

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(["Lead", "Prospect", "Customer", "Active", "Inactive"]),
  source: z.enum(["Website", "Referral", "Cold Email", "LinkedIn", "Trade Show", "Other"]),
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
 * Status options with their display properties
 */
export const statusOptions = [
  { value: "Lead", label: "Lead", color: "destructive" },
  { value: "Prospect", label: "Prospect", color: "secondary" },
  { value: "Customer", label: "Customer", color: "default" },
  { value: "Active", label: "Active", color: "default" },
  { value: "Inactive", label: "Inactive", color: "outline" }
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
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  position: "",
  department: "",
  status: "Lead",
  source: "Website",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  notes: "",
  tags: []
};
