# Modular Translation System

## Directory Structure

```
src/shared/i18n/
├── locales/                    # All translation files
│   ├── index.ts               # Main export combining all languages
│   ├── en/                    # English translations
│   │   ├── index.ts          # Combines all English modules
│   │   ├── common.ts         # Shared/common translations
│   │   ├── crm-contacts.ts   # CRM Contacts module
│   │   ├── crm-leads.ts      # CRM Leads module
│   │   ├── crm-deals.ts      # CRM Deals module
│   │   ├── crm-activities.ts # CRM Activities module
│   │   └── ...               # Other modules
│   │
│   └── ar/                    # Arabic translations
│       ├── index.ts          # Combines all Arabic modules
│       ├── common.ts         # Shared/common translations
│       ├── crm-contacts.ts   # CRM Contacts module
│       └── ...               # Other modules
│
├── i18n-context.tsx           # React Context for i18n
├── i18n-provider.tsx          # Provider component
└── translations.ts            # Re-exports from locales (for compatibility)
```

## How to Add a New Module

### 1. Create Translation Files

Create two files for each language:

**English (`locales/en/your-module.ts`):**
```typescript
/**
 * Your Module - English translations
 */
export const yourModuleEn = {
  title: 'Your Module',
  description: 'Module description',
  add: 'Add Item',
  edit: 'Edit Item',
  delete: 'Delete Item',
  // ... other keys
};
```

**Arabic (`locales/ar/your-module.ts`):**
```typescript
/**
 * Your Module - Arabic translations
 */
export const yourModuleAr = {
  title: 'الوحدة الخاصة بك',
  description: 'وصف الوحدة',
  add: 'إضافة عنصر',
  edit: 'تعديل عنصر',
  delete: 'حذف عنصر',
  // ... other keys
};
```

### 2. Update Language Index Files

**English (`locales/en/index.ts`):**
```typescript
import { commonEn } from './common';
import { yourModuleEn } from './your-module';

export const en = {
  common: commonEn,
  yourModule: yourModuleEn,
};
```

**Arabic (`locales/ar/index.ts`):**
```typescript
import { commonAr } from './common';
import { yourModuleAr } from './your-module';

export const ar = {
  common: commonAr,
  yourModule: yourModuleAr,
};
```

### 3. Use in Components

```typescript
import { useI18n } from '@/shared/i18n/i18n-context';

function YourComponent() {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t('yourModule.title')}</h1>
      <p>{t('yourModule.description')}</p>
      <button>{t('yourModule.add')}</button>
    </div>
  );
}
```

## Organizing CRM Sub-modules

For nested modules like CRM, combine them in the parent:

**English (`locales/en/index.ts`):**
```typescript
import { crmContactsEn } from './crm-contacts';
import { crmLeadsEn } from './crm-leads';
import { crmDealsEn } from './crm-deals';

export const en = {
  common: commonEn,
  crm: {
    ...crmContactsEn,
    ...crmLeadsEn,
    ...crmDealsEn,
  },
};
```

This allows usage like: `t('crm.contacts')`, `t('crm.leads')`, etc.

## Best Practices

### 1. Key Naming
- Use camelCase: `addContact`, `deleteItem`
- Be descriptive: `contactCreatedSuccessfully` not `success`
- Group related keys: `contact*`, `lead*`, `deal*`

### 2. File Organization
- Keep files under 500 lines
- Group related translations together
- Add section comments

Example:
```typescript
export const moduleEn = {
  // Main
  title: 'Title',
  description: 'Description',
  
  // Actions
  add: 'Add',
  edit: 'Edit',
  delete: 'Delete',
  
  // Messages
  successMessage: 'Success!',
  errorMessage: 'Error occurred',
  
  // Form fields
  name: 'Name',
  email: 'Email',
};
```

### 3. Consistency
- Maintain the same key structure across languages
- Use the same grouping and order
- Keep comments aligned

### 4. Avoid Duplication
- Use `common.ts` for shared translations
- Don't repeat the same translation in multiple modules
- Reference common keys when possible

## Migration from Old System

If you're migrating from the old `translations.ts` file:

1. Identify which module the translations belong to
2. Create or update the appropriate module file
3. Copy the keys to both EN and AR files
4. Update the index files
5. Test that `t()` function still works
6. Remove from old file once verified

## Examples

### Adding CRM Activities Module

**`locales/en/crm-activities.ts`:**
```typescript
export const crmActivitiesEn = {
  activities: 'Activities',
  addActivity: 'Add Activity',
  typeCall: 'Call',
  typeMeeting: 'Meeting',
  statusCompleted: 'Completed',
};
```

**`locales/ar/crm-activities.ts`:**
```typescript
export const crmActivitiesAr = {
  activities: 'الأنشطة',
  addActivity: 'إضافة نشاط',
  typeCall: 'مكالمة',
  typeMeeting: 'اجتماع',
  statusCompleted: 'مكتمل',
};
```

**Update `locales/en/index.ts`:**
```typescript
import { crmActivitiesEn } from './crm-activities';

export const en = {
  common: commonEn,
  crm: {
    ...crmContactsEn,
    ...crmLeadsEn,
    ...crmActivitiesEn, // Add this
  },
};
```

**Usage in component:**
```typescript
const { t } = useI18n();

<div>
  <h1>{t('crm.activities')}</h1>
  <button>{t('crm.addActivity')}</button>
  <Badge>{t('crm.statusCompleted')}</Badge>
</div>
```

## Notes

- The old `translations.ts` file will re-export from the new structure for backward compatibility
- No changes needed in components using `useI18n()` hook
- TypeScript will provide autocomplete for translation keys
- Each module can be maintained independently

## Support

For questions or issues with the translation system, check:
- [Translation Migration Guide](../../docs/TRANSLATION_MIGRATION.md)
- [Development Guide](../../DEVELOPMENT_GUIDE.md)
