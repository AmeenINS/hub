# Hub - Technical Documentation

Welcome to the Ameen INS Hub technical documentation.

## 📚 Documentation Index

### Core Systems
- [Soft Delete System](./soft-delete/README.md) - Logical deletion with recovery capabilities
  - [Implementation Checklist](./soft-delete/CHECKLIST.md)

### Development Guidelines
- [Language Policy](./LANGUAGE_POLICY.md) - **English-only code enforcement**
- [Copilot Instructions](../.github/copilot-instructions.md) - AI-assisted development rules
- [Development Guide](../DEVELOPMENT_GUIDE.md) - Complete development guidelines

### Architecture
- API Client patterns
- Database schema
- Permission system
- i18n/Translation system

---

## 🔤 Language Policy

### Code & Comments: English ONLY

**CRITICAL**: All code, comments, variable names, and function names MUST be in English.

```typescript
// ✅ Correct
/**
 * Delete a contact using soft delete
 * @param contactId - Contact identifier
 * @param userId - User performing the action
 */
async function softDeleteContact(contactId: string, userId: string) {
  // Mark contact as deleted instead of physical removal
  return await updateContact(contactId, {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: userId
  });
}

// ❌ Wrong - Non-English in code
async function حذف_مخاطب(شناسه: string) {
  // این تابع مخاطب را حذف می‌کند
  return await حذف(شناسه);
}
```

### Documentation: English Preferred

- **Code documentation**: English ONLY
- **Internal docs** (`/docs` folder): English preferred
- **User-facing UI**: Bilingual (EN/AR) via translation system
- **Translation files**: Bilingual (EN/AR) for UI text only

### If You Receive Persian/Farsi Prompts

1. ✅ Understand the request in Persian/Farsi
2. ✅ Translate requirements to English
3. ✅ Implement everything in English
4. ✅ Use translation system for user-facing text

---

## 🏗️ Tech Stack

- **Framework**: Next.js 16.0 (App Router)
- **Language**: TypeScript 5.0 (Strict mode)
- **Database**: LMDB (Key-value embedded database)
- **Authentication**: JWT + Argon2
- **UI Framework**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **i18n**: Custom bilingual system (EN/AR)
- **Icons**: Lucide React

---

## 🌐 Key Systems

### 1. API Client
Centralized HTTP client for all API requests.

```typescript
import { apiClient, getErrorMessage } from '@/core/api/client';

// Always use apiClient, never fetch directly
const response = await apiClient.get('/api/users');
const response = await apiClient.post('/api/users', data);
```

### 2. Permission System
Role-based access control on all features.

```typescript
import { useModulePermissions } from '@/shared/hooks/use-permissions';

const { permissions, isLoading } = useModulePermissions('crm_contacts');

if (!permissions.canView) return null;
```

### 3. Translation System
Bilingual support (English/Arabic) for all UI text.

```typescript
import { useI18n } from '@/shared/i18n/i18n-context';

const { t } = useI18n();

<button>{t('common.save')}</button>
```

### 4. Soft Delete System
Logical deletion with full recovery capabilities.

```typescript
import { ContactService } from '@/core/data/crm-service';

// Soft delete (recommended)
await contactService.softDeleteContact(id, userId);

// Restore
await contactService.restoreContact(id, userId);
```

---

## 📁 Project Structure

```
hub/
├── .github/
│   └── copilot-instructions.md    # AI development rules
├── docs/                           # Documentation (this folder)
│   ├── README.md                   # This file
│   └── soft-delete/                # Soft delete system docs
│       ├── README.md
│       └── CHECKLIST.md
├── src/
│   ├── app/                        # Next.js app router
│   │   ├── api/                    # API routes
│   │   └── dashboard/              # Dashboard pages
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   └── dashboard/              # Dashboard-specific
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries
│   │   ├── api-client.ts           # HTTP client
│   │   ├── auth/                   # Authentication
│   │   ├── db/                     # Database services
│   │   ├── i18n/                   # Internationalization
│   │   └── soft-delete.ts          # Soft delete utilities
│   ├── store/                      # Zustand stores
│   └── types/                      # TypeScript types
├── data/                           # LMDB database files
└── scripts/                        # Utility scripts
```

---

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
http://localhost:3000
```

### Code Standards
1. ✅ Use `apiClient` for all API requests
2. ✅ Add translations for all UI text
3. ✅ Check permissions before rendering
4. ✅ Use TypeScript strict mode
5. ✅ All code/comments in English
6. ✅ Use soft delete (never physical delete)

---

## 🔒 Security

### Input Validation
- Use Zod schemas for validation
- Validate on both client and server
- Never trust client-side data

### Authentication
- JWT tokens with secure cookies
- Argon2 for password hashing
- Permission checks on all routes

### Soft Delete
- No physical data deletion
- Full audit trail
- Recovery capabilities

---

## 📖 Further Reading

- [Soft Delete System Documentation](./soft-delete/README.md)
- [Development Guidelines](../DEVELOPMENT_GUIDE.md)
- [Copilot Instructions](../.github/copilot-instructions.md)

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Maintained by**: Ameen INS Development Team
