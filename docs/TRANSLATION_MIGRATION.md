# Translation System Migration Guide

## Overview
The translation system has been refactored from a single large file (`translations.ts`) into a modular structure with separate files for each module.

## New Structure

```
src/shared/i18n/
├── locales/
│   ├── en/
│   │   ├── index.ts           # English translations entry point
│   │   ├── common.ts           # Common/shared translations
│   │   ├── crm-contacts.ts     # CRM Contacts module
│   │   ├── crm-leads.ts        # CRM Leads module (to be created)
│   │   ├── crm-deals.ts        # CRM Deals module (to be created)
│   │   ├── crm-activities.ts   # CRM Activities module (to be created)
│   │   ├── insurance.ts        # Insurance module (to be created)
│   │   └── ...                 # Other modules
│   │
│   ├── ar/
│   │   ├── index.ts           # Arabic translations entry point
│   │   ├── common.ts           # Common/shared translations
│   │   ├── crm-contacts.ts     # CRM Contacts module (to be created)
│   │   └── ...                 # Other modules
│   │
│   └── index.ts               # Main locales export
│
├── i18n-context.tsx           # React context (unchanged)
├── i18n-provider.tsx          # Provider component (unchanged)
└── translations.ts            # LEGACY - imports from new structure

## Migration Steps

### Step 1: Create Module Files
For each new module, create two files:
- `locales/en/{module-name}.ts`
- `locales/ar/{module-name}.ts`

Example for CRM Leads:

**`locales/en/crm-leads.ts`:**
```typescript
export const crmLeadsEn = {
  leads: 'Leads',
  addLead: 'Add Lead',
  // ... other translations
};
```

**`locales/ar/crm-leads.ts`:**
```typescript
export const crmLeadsAr = {
  leads: 'العملاء المحتملون',
  addLead: 'إضافة عميل محتمل',
  // ... other translations
};
```

### Step 2: Update Index Files

**`locales/en/index.ts`:**
```typescript
import { commonEn } from './common';
import { crmContactsEn } from './crm-contacts';
import { crmLeadsEn } from './crm-leads';

export const en = {
  common: commonEn,
  crm: {
    ...crmContactsEn,
    ...crmLeadsEn,
    // Spread other CRM modules
  },
};
```

**`locales/ar/index.ts`:**
```typescript
import { commonAr } from './common';
import { crmContactsAr } from './crm-contacts';
import { crmLeadsAr } from './crm-leads';

export const ar = {
  common: commonAr,
  crm: {
    ...crmContactsAr,
    ...crmLeadsAr,
    // Spread other CRM modules
  },
};
```

### Step 3: Main Locales Export

**`locales/index.ts`:**
```typescript
import { en } from './en';
import { ar } from './ar';

export const translations = {
  en,
  ar,
};
```

### Step 4: Update translations.ts (Temporary Compatibility)

The main `translations.ts` file will temporarily re-export from the new structure for backward compatibility:

```typescript
export { translations } from './locales';
```

## Benefits

1. **Maintainability**: Each module has its own file, making it easier to find and update translations
2. **Scalability**: New modules can be added without modifying a large monolithic file
3. **Team Collaboration**: Multiple developers can work on different translation files without conflicts
4. **Performance**: Potential for code-splitting and lazy-loading translations per module
5. **Organization**: Clear separation of concerns and logical grouping

## Module Guidelines

### File Naming Convention
- Use kebab-case: `crm-contacts.ts`, `insurance-products.ts`
- Prefix with parent module if nested: `crm-leads.ts`, `crm-deals.ts`

### Export Naming Convention
- Use camelCase with module suffix: `crmContactsEn`, `crmContactsAr`
- Be descriptive and consistent

### Key Organization
Group related keys together with comments:
```typescript
export const moduleEn = {
  // Main section
  title: 'Module Title',
  description: 'Module description',
  
  // Actions
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  
  // Messages
  successMessage: 'Success',
  errorMessage: 'Error',
};
```

## TODO List

- [x] Create modular structure
- [x] Create common translations (EN/AR)
- [x] Create CRM contacts translations (EN)
- [ ] Create CRM contacts translations (AR)
- [ ] Create CRM leads translations (EN/AR)
- [ ] Create CRM deals translations (EN/AR)
- [ ] Create CRM activities translations (EN/AR)
- [ ] Create CRM campaigns translations (EN/AR)
- [ ] Create insurance products translations (EN/AR)
- [ ] Create insurance companies translations (EN/AR)
- [ ] Create dashboard translations (EN/AR)
- [ ] Create tasks translations (EN/AR)
- [ ] Create notes translations (EN/AR)
- [ ] Create users/roles/permissions translations (EN/AR)
- [ ] Migrate all existing translations
- [ ] Remove old translations.ts file
- [ ] Update documentation

## Current Status

✅ **Completed:**
- Modular structure created
- Common translations (EN/AR)
- CRM Contacts (EN)
- Index files setup

🚧 **In Progress:**
- Migrating remaining modules

⏳ **Pending:**
- Arabic translations for CRM modules
- Insurance module translations
- System/admin translations
