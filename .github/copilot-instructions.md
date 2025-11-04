# Copilot Instructions - API & File Upload

> **🤖 Instructions for GitHub Copilot**  
> This file specifies the coding rules and standards for this project.

## 🔤 CRITICAL: Language Rules

### ⚠️ MANDATORY - English Only in Code

**ALL code, comments, variable names, function names, and documentation MUST be in English.**

```typescript
// ✅ Correct - English comments and names
/**
 * Soft delete a contact by marking it as deleted
 * @param contactId - The ID of the contact to delete
 * @param userId - The ID of the user performing the deletion
 */
async function softDeleteContact(contactId: string, userId: string) {
  // Mark contact as deleted instead of removing from database
  return await updateContact(contactId, {
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: userId
  });
}

// ❌ Wrong - Persian/Arabic in code
async function حذف_مخاطب(شناسه: string) {
  // این تابع مخاطب را حذف می‌کند
  return await حذف(شناسه);
}

// ❌ Wrong - Mixed languages
async function deleteContact(contactId: string) {
  // حذف منطقی
  return await softDelete(contactId);
}
```

### Documentation Language Policy

- **Code files (.ts, .tsx, .js, .jsx)**: English ONLY
- **Comments in code**: English ONLY  
- **Variable/Function names**: English ONLY
- **Git commit messages**: English preferred
- **Documentation files in `/docs`**: English preferred (bilingual acceptable)
- **Translation files (`translations.ts`)**: Bilingual (EN/AR) for UI text only
- **User-facing UI**: Bilingual (EN/AR) via translation system

### Important Notes

1. **If you receive a prompt in Persian/Farsi**: Understand the request, then implement in English
2. **User-facing text**: Use the translation system (`useI18n` hook) - never hardcode text in any language
3. **Internal docs**: Create in `/docs` folder in English
4. **Code reviews**: Reject any code with non-English comments or names

---

## 🌐 API Requests

### ⚠️ Core Rule
**ALWAYS** use `apiClient`. **NEVER** use `fetch` directly.

```typescript
import { apiClient, getErrorMessage } from '@/lib/api-client';

// ✅ Correct
const response = await apiClient.get('/api/users');
const response = await apiClient.post('/api/users', data);
const response = await apiClient.put(`/api/users/${id}`, data);
const response = await apiClient.patch(`/api/users/${id}`, { field: value });
const response = await apiClient.delete(`/api/users/${id}`);

// ❌ Wrong - Never use fetch directly
const response = await fetch('/api/users');
```

### Error Handling

```typescript
try {
  const response = await apiClient.post('/api/users', data);
  if (response.success) {
    toast.success(response.message || 'Success');
  }
} catch (error) {
  toast.error(getErrorMessage(error, 'Operation failed'));
}
```

---

## 🌍 Internationalization (i18n)

### ⚠️ Core Rules

**EVERY UI element MUST support both Arabic and English.**  
**ALL text MUST be added to translation files: `src/lib/i18n/translations.ts`**

```typescript
// ✅ Correct - Add to translations.ts first
export const translations = {
  en: {
    myFeature: {
      title: 'Feature Title',
      button: 'Click Me'
    }
  },
  ar: {
    myFeature: {
      title: 'عنوان الميزة',
      button: 'اضغط هنا'
    }
  }
};

// Then use in component
import { useTranslation } from '@/hooks/use-translation';

function MyComponent() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <button>{t('myFeature.button')}</button>
    </div>
  );
}

// ❌ Wrong - Never hardcode text
function MyComponent() {
  return <button>Click Me</button>;
}
```

### i18n Checklist

- [ ] All text added to `translations.ts` (EN + AR)
- [ ] Using `t()` function for all displayed text
- [ ] No hardcoded strings in components
- [ ] Tested in both languages

---

## 🔐 Permission & Role System

### ⚠️ Core Rules

**EVERY feature MUST be integrated with the permission system.**  
**EVERY UI element (pages, buttons, sections) MUST have permission checks.**  
**Check permissions BEFORE rendering for optimal UX.**

### Adding New Feature Permissions

#### Step 1: Create Permission Script

```typescript
// scripts/add-my-feature-permissions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPermissions() {
  const permissions = [
    {
      module: 'myFeature',
      action: 'view',
      descriptionEn: 'View My Feature',
      descriptionAr: 'عرض الميزة'
    },
    {
      module: 'myFeature',
      action: 'create',
      descriptionEn: 'Create Items',
      descriptionAr: 'إنشاء عناصر'
    },
    {
      module: 'myFeature',
      action: 'edit',
      descriptionEn: 'Edit Items',
      descriptionAr: 'تعديل عناصر'
    },
    {
      module: 'myFeature',
      action: 'delete',
      descriptionEn: 'Delete Items',
      descriptionAr: 'حذف عناصر'
    }
  ];

  for (const perm of permissions) {
    await prisma.permission.create({ data: perm });
  }
}

addPermissions();
```

#### Step 2: Protect API Routes

```typescript
// app/api/myFeature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { checkUserPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }

  // ✅ Check permission
  const hasPermission = await checkUserPermission(decoded.userId, 'myFeature', 'view');
  if (!hasPermission) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  // Process request...
  return NextResponse.json({ success: true, data });
}
```

#### Step 3: Protect Components

```typescript
// components/my-feature-page.tsx
'use client';

import { useModulePermissions } from '@/hooks/use-permissions';

export function MyFeaturePage() {
  const { permissions, isLoading } = useModulePermissions('myFeature');

  if (isLoading) return <div>Loading...</div>;
  if (!permissions.canView) return null;

  return (
    <div>
      <h1>My Feature</h1>
      
      {/* Only show if user has create permission */}
      {permissions.canCreate && (
        <button>Create New</button>
      )}

      {/* Actions based on permissions */}
      <ItemList
        canEdit={permissions.canEdit}
        canDelete={permissions.canDelete}
      />
    </div>
  );
}
```

### Permission Checklist

- [ ] Permissions created in database (module + actions)
- [ ] API routes check permissions
- [ ] Components check permissions on mount
- [ ] Buttons/actions check permissions
- [ ] Loading state while checking permissions
- [ ] Redirect to `/dashboard/access-denied` if no access
- [ ] Tested with different user roles

---

## 📤 File Upload

### Components

```typescript
// User avatar upload
import { UserAvatarUpload } from '@/components/dashboard/user-avatar-upload';

// Contact avatar upload
import { ContactAvatarUpload } from '@/components/crm/contact-avatar-upload';

// Generic image upload
import { ImageUpload } from '@/components/ui/image-upload';

// Generic file upload
import { FileUpload } from '@/components/ui/file-upload';
```

### Usage

```typescript
import { ContactAvatarUpload } from '@/components/crm/contact-avatar-upload';

<ContactAvatarUpload
  contactId={contactId}
  currentAvatarUrl={avatarUrl}
  contactName={contactName}
  onAvatarChange={setAvatarUrl}
  variant="card"
/>
```

---

## 🎨 UI/UX Standards

### ⚠️ Core Rules

**ALWAYS follow shadcn/ui component patterns.**  
**ALWAYS use Tailwind CSS for styling.**  
**NEVER use inline styles or custom CSS files.**

### Design System

```typescript
// ✅ Correct - Use shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

<Button variant="default">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>

// ❌ Wrong - Don't create custom button components
<button className="custom-btn">Save</button>
```

### Responsive Design

```typescript
// ✅ Correct - Mobile-first responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>

// ❌ Wrong - Fixed width without responsive
<div className="grid grid-cols-3 gap-4">
```

### Loading States

```typescript
// ✅ Correct - Always show loading state
if (isLoading) {
  return <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>;
}

// ❌ Wrong - No loading feedback
if (isLoading) return null;
```

---

## 🔒 Security Standards

### ⚠️ Core Rules

**ALWAYS validate input on both client and server.**  
**ALWAYS sanitize user input.**  
**NEVER trust client-side validation alone.**

### Input Validation

```typescript
// ✅ Correct - Zod schema validation
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+968\s?\d{8}$/),
  name: z.string().min(2).max(100)
});

// Client validation
const form = useForm({
  resolver: zodResolver(schema)
});

// Server validation
const body = await request.json();
const validated = schema.parse(body); // Throws if invalid

// ❌ Wrong - No validation
const body = await request.json();
await prisma.user.create({ data: body });
```

### SQL Injection Prevention

```typescript
// ✅ Correct - Use Prisma (parameterized queries)
const user = await prisma.user.findFirst({
  where: { email: userEmail }
});

// ❌ Wrong - Raw SQL with string interpolation
const user = await prisma.$queryRaw`SELECT * FROM users WHERE email = '${userEmail}'`;
```

### XSS Prevention

```typescript
// ✅ Correct - React automatically escapes
<div>{userInput}</div>

// ❌ Wrong - dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ If HTML needed, sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 📊 Data Management

### ⚠️ Core Rules

**ALWAYS use TypeScript interfaces for data.**  
**ALWAYS define types in `src/types/database.ts`.**  
**NEVER use `any` type.**

### Type Definitions

```typescript
// ✅ Correct - Define proper types
interface Contact {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  type: 'LEAD' | 'CUSTOMER' | 'SUPPLIER' | 'PARTNER';
  createdAt: Date;
  updatedAt: Date;
}

// ❌ Wrong - Using any
const contact: any = await fetchContact();
```

### Prisma Best Practices

```typescript
// ✅ Correct - Use Prisma Client
import { prisma } from '@/lib/db/prisma';

const contacts = await prisma.contact.findMany({
  where: { type: 'CUSTOMER' },
  include: { 
    company: true,
    createdBy: {
      select: { id: true, fullName: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});

// ❌ Wrong - Fetching unnecessary data
const contacts = await prisma.contact.findMany({
  include: { 
    company: true,
    createdBy: true, // Returns all user fields
    deals: true,     // Unnecessary relation
    tasks: true      // Unnecessary relation
  }
});
```

---

## 🧪 Testing Standards

### ⚠️ Core Rules

**ALWAYS write tests for critical features.**  
**ALWAYS test permission checks.**  
**ALWAYS test API endpoints.**

### API Testing

```typescript
// tests/api/contacts.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/contacts', () => {
  it('should create contact with valid permissions', async () => {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullNameEn: 'John Doe',
        email: 'john@example.com',
        phone: '+96812345678',
        type: 'LEAD'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should reject without permissions', async () => {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${noPermToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(403);
  });
});
```

---

## 📝 Code Quality

### ⚠️ Core Rules

**ALWAYS use meaningful variable names.**  
**ALWAYS add comments for complex logic.**  
**ALWAYS follow ESLint rules.**

### Naming Conventions

```typescript
// ✅ Correct - Clear, descriptive names
const userPermissions = await getUserPermissions(userId);
const hasEditAccess = checkPermission('contacts', 'edit');
const filteredContacts = contacts.filter(c => c.type === 'CUSTOMER');

// ❌ Wrong - Unclear abbreviations
const up = await getPerms(uid);
const hea = checkPerm('c', 'e');
const fc = contacts.filter(c => c.t === 'C');
```

### Function Organization

```typescript
// ✅ Correct - Single responsibility
async function createContact(data: ContactData) {
  const validated = validateContactData(data);
  const contact = await saveContact(validated);
  await sendWelcomeEmail(contact);
  return contact;
}

// ❌ Wrong - Too many responsibilities
async function createContact(data: ContactData) {
  // 200 lines of mixed logic
}
```

### Comments

```typescript
// ✅ Correct - Explain WHY, not WHAT
// Check permissions before rendering to avoid showing UI then hiding it
// This provides better UX than loading and then redirecting
const hasAccess = await checkPermission(userId, module, action);

// ❌ Wrong - Obvious comments
// Create a variable
const x = 10;
```

---

## 🚀 Performance

### ⚠️ Core Rules

**ALWAYS use React.memo for expensive components.**  
**ALWAYS use useMemo/useCallback when needed.**  
**NEVER fetch data in loops.**

### Optimization

```typescript
// ✅ Correct - Batch requests
const [contacts, companies, users] = await Promise.all([
  apiClient.get('/api/contacts'),
  apiClient.get('/api/companies'),
  apiClient.get('/api/users')
]);

// ❌ Wrong - Sequential requests
const contacts = await apiClient.get('/api/contacts');
const companies = await apiClient.get('/api/companies');
const users = await apiClient.get('/api/users');
```

```typescript
// ✅ Correct - Memoize expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);

// ❌ Wrong - Recalculate on every render
const sortedData = data.sort((a, b) => a.name.localeCompare(b.name));
```

---

## 📱 Accessibility

### ⚠️ Core Rules

**ALWAYS add ARIA labels.**  
**ALWAYS support keyboard navigation.**  
**ALWAYS provide alt text for images.**

### Implementation

```typescript
// ✅ Correct - Accessible button
<Button
  onClick={handleDelete}
  aria-label={t('contacts.delete')}
  disabled={!permissions.canDelete}
>
  <Trash2 className="h-4 w-4" />
</Button>

// ❌ Wrong - No accessibility
<button onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</button>
```

---

## 🔄 State Management

### ⚠️ Core Rules

**ALWAYS use Zustand for global state.**  
**ALWAYS use React state for local state.**  
**NEVER prop drill more than 2 levels.**

### Global State

```typescript
// ✅ Correct - Zustand store
import { useAuthStore } from '@/store/auth-store';

const { user, setUser, logout } = useAuthStore();

// ❌ Wrong - Props through many levels
<Parent>
  <Child user={user}>
    <GrandChild user={user}>
      <GreatGrandChild user={user} />
    </GrandChild>
  </Child>
</Parent>
```

---

## ✅ Checklist

### Before Creating Any Feature:

#### API & Data
- [ ] Using `apiClient` for all API requests?
- [ ] Errors handled with `try/catch`?
- [ ] Using `getErrorMessage` for error messages?
- [ ] Type Safety implemented (`apiClient.get<Type>(...)`)?
- [ ] Input validation with Zod on both client and server?
- [ ] Prisma queries optimized (select only needed fields)?

#### i18n & Permissions
- [ ] **All text in translation files (EN + AR)?**
- [ ] **Using `t()` function for all text?**
- [ ] **Permissions created in database?**
- [ ] **API routes protected with permission checks?**
- [ ] **Components check permissions before rendering?**
- [ ] **Buttons/actions check permissions?**
- [ ] **Tested in both English and Arabic?**
- [ ] **Tested with different user roles?**

#### UI/UX
- [ ] Using shadcn/ui components (not custom)?
- [ ] Responsive design (mobile, tablet, desktop)?
- [ ] Loading states implemented?
- [ ] Error states implemented?
- [ ] Empty states implemented?
- [ ] Success feedback (toasts/messages)?

#### Security
- [ ] Input sanitized and validated?
- [ ] No SQL injection vulnerabilities?
- [ ] No XSS vulnerabilities?
- [ ] Authentication checked on all protected routes?
- [ ] Authorization (permissions) checked?

#### Code Quality
- [ ] No TypeScript errors?
- [ ] No ESLint warnings?
- [ ] Meaningful variable/function names?
- [ ] Complex logic commented?
- [ ] No `any` types used?
- [ ] Functions follow single responsibility?

#### Performance
- [ ] No unnecessary re-renders?
- [ ] Expensive operations memoized?
- [ ] API calls batched when possible?
- [ ] Images optimized?

#### Accessibility
- [ ] ARIA labels added?
- [ ] Keyboard navigation works?
- [ ] Alt text for images?
- [ ] Color contrast sufficient?

---

## 📚 Complete Documentation

For more details, refer to `DEVELOPMENT_GUIDE.md`.
