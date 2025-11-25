/**
 * Translation System
 * Re-exports from modular translation files
 * 
 * The old monolithic structure (3436 lines) has been split into modular files.
 * All translations are now managed in the ./locales directory:
 * 
 * Structure:
 * - locales/en/ - English translations by module
 * - locales/ar/ - Arabic translations by module
 * 
 * Available Modules:
 * - common.ts - Common UI translations (save, cancel, delete, etc.)
 * - crm-contacts.ts - CRM Contacts module
 * - crm-leads.ts - CRM Leads module
 * - crm-deals.ts - CRM Deals module
 * - crm-activities.ts - CRM Activities module
 * - crm-campaigns.ts - CRM Campaigns module
 * 
 * To add new translations:
 * 1. Edit the appropriate module file in locales/en/ or locales/ar/
 * 2. Update the index.ts in that language folder if adding new module
 * 3. TypeScript will automatically pick up the changes
 * 
 * The translations object is re-exported from ./locales/index.ts
 * This ensures backward compatibility with existing code.
 */

export { translations } from './locales';
