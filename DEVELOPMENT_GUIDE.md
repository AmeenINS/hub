# Development Guide - API & File Upload Usage

> **Development Guide for GitHub Copilot**  
> This file contains the standards and recommended practices for working with API and file uploads in this project.

## 📋 Table of Contents

1. [Using API Client](#using-api-client)
2. [File and Image Upload](#file-and-image-upload)
3. [Internationalization (i18n)](#internationalization-i18n)
4. [Permission & Role System](#permission--role-system)
5. [Common Patterns](#common-patterns)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## 🌐 Using API Client

### 📍 File Location
```
src/lib/api-client.ts
```

### ⚠️ Important Rules

**ALWAYS** use `apiClient` for all API requests.  
**NEVER** use `fetch` directly except in special cases.

### 🔐 Automatic Authentication

`apiClient` automatically:
- ✅ Retrieves token from cookie (`auth-token`)
- ✅ Adds `Authorization` header
- ✅ Handles errors
- ✅ Provides TypeScript type safety

### 📝 Usage Examples

#### 1️⃣ GET Request

```typescript
import { apiClient } from '@/lib/api-client';
import { Contact } from '@/types/database';

// Simple
const response = await apiClient.get('/api/crm/contacts');
if (response.success) {
  const contacts = response.data;
}

// With Type Safety
const response = await apiClient.get<Contact[]>('/api/crm/contacts');
if (response.success && response.data) {
  const contacts: Contact[] = response.data;
}

// With Query Parameters
const response = await apiClient.get('/api/crm/contacts', {
  params: {
    search: 'john',
    type: 'CUSTOMER',
    page: 1
  }
});
```

#### 2️⃣ POST Request (Create)

```typescript
import { apiClient } from '@/lib/api-client';
import { Contact } from '@/types/database';

const newContact = {
  fullNameEn: 'John Doe',
  email: 'john@example.com',
  phone: '+968 9123 4567',
  type: 'LEAD'
};

const response = await apiClient.post<Contact>('/api/crm/contacts', newContact);
if (response.success && response.data) {
  console.log('Contact created:', response.data);
  toast.success(response.message || 'Contact created successfully');
}
```

#### 3️⃣ PUT Request (Full Update)

```typescript
import { apiClient } from '@/lib/api-client';

const updatedData = {
  fullNameEn: 'John Doe Updated',
  email: 'john.new@example.com',
  phone: '+968 9123 4567',
  type: 'CUSTOMER'
};

const response = await apiClient.put(`/api/crm/contacts/${contactId}`, updatedData);
if (response.success) {
  toast.success('Contact updated successfully');
}
```

#### 4️⃣ PATCH Request (Partial Update)

```typescript
import { apiClient } from '@/lib/api-client';

// Update only one field
const response = await apiClient.patch(`/api/crm/contacts/${contactId}`, {
  avatarUrl: '/uploads/avatar.jpg'
});

if (response.success) {
  toast.success('Avatar updated successfully');
}
```

#### 5️⃣ DELETE Request

```typescript
import { apiClient } from '@/lib/api-client';

const response = await apiClient.delete(`/api/crm/contacts/${contactId}`);
if (response.success) {
  toast.success('Contact deleted successfully');
  router.push('/dashboard/crm/contacts');
}
```

#### 6️⃣ File Upload

```typescript
import { apiClient } from '@/lib/api-client';

const formData = new FormData();
formData.append('file', file);
formData.append('category', 'documents');

const response = await apiClient.upload('/api/upload', formData);
if (response.success && response.data) {
  const fileUrl = response.data.url;
  toast.success('File uploaded successfully');
}
```

### � Helper Functions

#### Check Login Status

```typescript
import { isAuthenticated } from '@/lib/api-client';

if (isAuthenticated()) {
  console.log('User is logged in');
} else {
  router.push('/login');
}
```

#### Get Token

```typescript
import { getAuthToken } from '@/lib/api-client';

const token = getAuthToken();
if (token) {
  console.log('Token:', token);
}
```

---

## ❌ Error Handling

### Standard Error Handling

```typescript
import { apiClient, ApiClientError, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';

try {
  const response = await apiClient.post('/api/crm/contacts', contactData);
  
  if (response.success) {
    toast.success(response.message || 'Operation successful');
    return response.data;
  }
} catch (error) {
  // Recommended approach: using getErrorMessage
  const message = getErrorMessage(error, 'Failed to create contact');
  toast.error(message);
  
  // Or manual approach
  if (error instanceof ApiClientError) {
    console.error('API Error:', error.statusCode, error.message);
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

### 🎯 Custom Hook Pattern (Recommended)

```typescript
import { useState } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';
import { Contact } from '@/types/database';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Contact[]>('/api/crm/contacts');
      if (response.success && response.data) {
        setContacts(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load contacts'));
    } finally {
      setIsLoading(false);
    }
  };

  const createContact = async (data: Partial<Contact>) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<Contact>('/api/crm/contacts', data);
      if (response.success && response.data) {
        setContacts(prev => [...prev, response.data!]);
        toast.success('Contact created successfully');
        return response.data;
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create contact'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { contacts, isLoading, fetchContacts, createContact };
}
```

---

## 📤 File and Image Upload

### 📍 Available Components

#### 1️⃣ ImageUpload - For Image Uploads

```typescript
import { ImageUpload } from '@/components/ui/image-upload';
import { UploadedFile } from '@/components/ui/file-upload';

function MyComponent() {
  const handleUploadComplete = async (file: UploadedFile) => {
    console.log('File uploaded:', file.fileUrl);
    // Use apiClient to update record
    await apiClient.patch(`/api/users/${userId}`, {
      avatarUrl: file.fileUrl
    });
  };

  return (
    <ImageUpload
      entityType="user"        // Entity type: user, contact, company
      entityId={userId}        // Entity ID
      onUploadComplete={handleUploadComplete}
      onUploadError={(error) => toast.error(error)}
      variant="card"           // card | avatar
      currentImageUrl={currentAvatar}
      size="sm"                // sm | md | lg
    />
  );
}
```

#### 2️⃣ FileUpload - For General File Uploads

```typescript
import { FileUpload } from '@/components/ui/file-upload';
import { UploadedFile } from '@/components/ui/file-upload';

function MyComponent() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
    toast.success(`File ${file.originalName} uploaded successfully`);
  };

  return (
    <FileUpload
      entityType="document"
      entityId={documentId}
      accept={{
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc', '.docx'],
        'application/vnd.ms-excel': ['.xls', '.xlsx']
      }}
      maxSize={10 * 1024 * 1024}  // 10MB
      maxFiles={5}
      onUploadComplete={handleUploadComplete}
      onUploadError={(error) => toast.error(error)}
      showPreview={true}
    />
  );
}
```

#### 3️⃣ UserAvatarUpload - User Avatar Upload

```typescript
import { UserAvatarUpload } from '@/components/dashboard/user-avatar-upload';

function ProfileSettings({ user }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  return (
    <UserAvatarUpload
      userId={user.id}
      currentAvatarUrl={avatarUrl}
      userFullName={user.fullName}
      onAvatarUpdated={(newUrl) => setAvatarUrl(newUrl)}
      variant="card"  // card | avatar
      showPreview={true}
    />
  );
}
```

#### 4️⃣ ContactAvatarUpload - Contact Avatar Upload

```typescript
import { ContactAvatarUpload } from '@/components/crm/contact-avatar-upload';

function ContactForm({ contactId, contactData }) {
  const [avatarUrl, setAvatarUrl] = useState(contactData?.avatarUrl);

  return (
    <ContactAvatarUpload
      contactId={contactId}
      currentAvatarUrl={avatarUrl}
      contactName={contactData?.fullNameEn}
      onAvatarChange={setAvatarUrl}
      variant="card"  // card | inline
    />
  );
}
```

### 🔧 Manual Upload with apiClient

If you need manual upload:

```typescript
import { apiClient } from '@/lib/api-client';

async function uploadFile(file: File, entityType: string, entityId: string) {
  try {
    // 1. Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    // 2. Upload with apiClient
    const response = await apiClient.upload('/api/upload', formData);

    if (response.success && response.data) {
      console.log('File uploaded:', response.data.fileUrl);
      return response.data;
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Usage
const file = event.target.files[0];
const result = await uploadFile(file, 'user', userId);
```

### 📁 Upload Response Structure

```typescript
interface UploadedFile {
  id: string;
  fileUrl: string;         // URL of uploaded file
  originalName: string;    // Original filename
  size: number;            // Size in bytes
  mimeType: string;        // MIME type
  entityType: string;      // Entity type
  entityId: string;        // Entity ID
  uploadedAt: string;      // Upload timestamp
}
```

---

## � Internationalization (i18n)

### ⚠️ Critical Rules

**EVERY UI element MUST support both Arabic and English.**  
**ALL text MUST be added to translation files.**

### 📍 Translation File Location
```
src/lib/i18n/translations.ts
```

### 🔐 Translation Structure

```typescript
export const translations = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      // ... more translations
    },
    dashboard: {
      welcome: 'Welcome',
      // ... more translations
    }
  },
  ar: {
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      // ... more translations
    },
    dashboard: {
      welcome: 'مرحباً',
      // ... more translations
    }
  }
};
```

### 📝 Adding New Translations

#### Step 1: Add to Translation File

```typescript
// src/lib/i18n/translations.ts

export const translations = {
  en: {
    // ... existing translations
    myModule: {
      title: 'My Module Title',
      description: 'This is a description',
      button: {
        create: 'Create New',
        edit: 'Edit',
        delete: 'Delete'
      },
      message: {
        success: 'Operation completed successfully',
        error: 'An error occurred'
      }
    }
  },
  ar: {
    // ... existing translations
    myModule: {
      title: 'عنوان الوحدة',
      description: 'هذا وصف',
      button: {
        create: 'إنشاء جديد',
        edit: 'تعديل',
        delete: 'حذف'
      },
      message: {
        success: 'تمت العملية بنجاح',
        error: 'حدث خطأ'
      }
    }
  }
};
```

#### Step 2: Use in Components

```typescript
'use client';

import { useTranslation } from '@/hooks/use-translation';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myModule.title')}</h1>
      <p>{t('myModule.description')}</p>
      
      <button>{t('myModule.button.create')}</button>
      <button>{t('myModule.button.edit')}</button>
      <button>{t('myModule.button.delete')}</button>
    </div>
  );
}
```

### 🎯 Translation Best Practices

#### ✅ Do

1. **Always add both languages simultaneously**
   ```typescript
   // ✅ Correct - both languages
   en: { save: 'Save' }
   ar: { save: 'حفظ' }
   
   // ❌ Wrong - only one language
   en: { save: 'Save' }
   ar: { } // Missing translation
   ```

2. **Use descriptive keys**
   ```typescript
   // ✅ Correct - clear and organized
   contact: {
     form: {
       title: 'Contact Information',
       fields: {
         name: 'Full Name',
         email: 'Email Address'
       }
     }
   }
   
   // ❌ Wrong - unclear keys
   contact: {
     t1: 'Contact Information',
     f1: 'Full Name'
   }
   ```

3. **Group related translations**
   ```typescript
   // ✅ Correct - well organized
   user: {
     profile: { /* ... */ },
     settings: { /* ... */ },
     permissions: { /* ... */ }
   }
   
   // ❌ Wrong - flat structure
   userProfile: 'Profile',
   userSettings: 'Settings',
   userPermissions: 'Permissions'
   ```

#### ❌ Don't

1. **Never hardcode text in components**
   ```typescript
   // ❌ Wrong - hardcoded text
   <button>Save</button>
   
   // ✅ Correct - use translation
   <button>{t('common.save')}</button>
   ```

2. **Never skip Arabic translation**
   ```typescript
   // ❌ Wrong - English only
   en: { newFeature: 'New Feature' }
   
   // ✅ Correct - both languages
   en: { newFeature: 'New Feature' }
   ar: { newFeature: 'ميزة جديدة' }
   ```

3. **Never use translation keys directly in strings**
   ```typescript
   // ❌ Wrong
   const message = 'common.save';
   
   // ✅ Correct
   const message = t('common.save');
   ```

### 🔄 RTL (Right-to-Left) Support

The system automatically handles RTL for Arabic:

```typescript
// Language toggle component handles RTL
import { LanguageToggle } from '@/components/language-toggle';

<LanguageToggle />
```

### 📋 Translation Checklist

Before creating any new feature:

- [ ] All button labels added to translations (EN + AR)
- [ ] All form labels added to translations (EN + AR)
- [ ] All error messages added to translations (EN + AR)
- [ ] All success messages added to translations (EN + AR)
- [ ] All tooltips added to translations (EN + AR)
- [ ] All page titles added to translations (EN + AR)
- [ ] All table headers added to translations (EN + AR)
- [ ] Tested in both English and Arabic
- [ ] RTL layout verified for Arabic

---

## 🔐 Permission & Role System

### ⚠️ Critical Rules

**EVERY feature MUST be integrated with the permission system.**  
**EVERY UI element (buttons, pages, sections) MUST have permission checks.**  
**Permissions MUST be checked BEFORE page loads for optimal UX.**

### 📍 Permission Files Location
```
src/lib/auth/permissions.ts        - Permission checking logic
src/lib/db/user-service.ts         - Role & Permission service
src/app/api/permissions/           - Permission API endpoints
```

### 🎯 Permission System Architecture

The system uses a **Module-Action-Based Permission Model**:

```typescript
interface Permission {
  id: string;
  module: string;      // e.g., 'users', 'contacts', 'reports'
  action: string;      // e.g., 'view', 'create', 'edit', 'delete'
  description: string;
}

// Example permissions:
// { module: 'contacts', action: 'view' }     → Can view contacts
// { module: 'contacts', action: 'create' }   → Can create contacts
// { module: 'contacts', action: 'edit' }     → Can edit contacts
// { module: 'contacts', action: 'delete' }   → Can delete contacts
// { module: 'system', action: 'admin' }      → Full system access
```

### 📝 Adding Permissions to New Features

#### Step 1: Define Permissions in Database

```typescript
// scripts/add-new-feature-permissions.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMyFeaturePermissions() {
  const permissions = [
    {
      module: 'myFeature',
      action: 'view',
      descriptionEn: 'View My Feature',
      descriptionAr: 'عرض الميزة الخاصة بي'
    },
    {
      module: 'myFeature',
      action: 'create',
      descriptionEn: 'Create My Feature Items',
      descriptionAr: 'إنشاء عناصر الميزة'
    },
    {
      module: 'myFeature',
      action: 'edit',
      descriptionEn: 'Edit My Feature Items',
      descriptionAr: 'تعديل عناصر الميزة'
    },
    {
      module: 'myFeature',
      action: 'delete',
      descriptionEn: 'Delete My Feature Items',
      descriptionAr: 'حذف عناصر الميزة'
    }
  ];

  for (const perm of permissions) {
    await prisma.permission.create({
      data: perm
    });
  }

  console.log('✅ Permissions created successfully');
}

addMyFeaturePermissions();
```

#### Step 2: Protect API Routes

```typescript
// app/api/myFeature/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { checkUserPermission } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // 2. Check permission
    const hasPermission = await checkUserPermission(
      decoded.userId,
      'myFeature',  // module
      'view'        // action
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // 3. Process request
    const data = await fetchMyFeatureData();

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Step 3: Protect Client Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkUserPermission } from '@/lib/auth/permissions';
import { useAuthStore } from '@/store/auth-store';

export function MyFeaturePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        router.push('/login');
        return;
      }

      // Check permission BEFORE rendering
      const canView = await checkUserPermission(
        user.id,
        'myFeature',
        'view'
      );

      if (!canView) {
        router.push('/dashboard/access-denied');
        return;
      }

      setHasAccess(true);
      setIsLoading(false);
    }

    checkAccess();
  }, [user, router]);

  // Show loading state while checking permissions
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Only render if user has access
  if (!hasAccess) {
    return null;
  }

  return (
    <div>
      {/* Your feature content */}
    </div>
  );
}
```

#### Step 4: Protect Individual UI Elements

```typescript
'use client';

import { useEffect, useState } from 'react';
import { checkUserPermission } from '@/lib/auth/permissions';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

export function MyFeatureActions({ itemId }: { itemId: string }) {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false
  });

  useEffect(() => {
    async function loadPermissions() {
      if (!user) return;

      const [canEdit, canDelete] = await Promise.all([
        checkUserPermission(user.id, 'myFeature', 'edit'),
        checkUserPermission(user.id, 'myFeature', 'delete')
      ]);

      setPermissions({ canEdit, canDelete });
    }

    loadPermissions();
  }, [user]);

  return (
    <div className="flex gap-2">
      {/* View is always allowed if user reached this page */}
      <Button variant="outline">View</Button>

      {/* Edit button - only show if user has permission */}
      {permissions.canEdit && (
        <Button onClick={() => handleEdit(itemId)}>
          Edit
        </Button>
      )}

      {/* Delete button - only show if user has permission */}
      {permissions.canDelete && (
        <Button variant="destructive" onClick={() => handleDelete(itemId)}>
          Delete
        </Button>
      )}
    </div>
  );
}
```

### 🎨 Permission Hook Pattern

Create a reusable hook for permission checks:

```typescript
// hooks/use-permissions.ts

import { useEffect, useState } from 'react';
import { checkUserPermission, getUserModulePermissions } from '@/lib/auth/permissions';
import { useAuthStore } from '@/store/auth-store';

export function usePermission(module: string, action: string) {
  const { user } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      const result = await checkUserPermission(user.id, module, action);
      setHasPermission(result);
      setIsLoading(false);
    }

    check();
  }, [user, module, action]);

  return { hasPermission, isLoading };
}

export function useModulePermissions(module: string) {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const [canView, canCreate, canEdit, canDelete] = await Promise.all([
        checkUserPermission(user.id, module, 'view'),
        checkUserPermission(user.id, module, 'create'),
        checkUserPermission(user.id, module, 'edit'),
        checkUserPermission(user.id, module, 'delete')
      ]);

      setPermissions({ canView, canCreate, canEdit, canDelete });
      setIsLoading(false);
    }

    check();
  }, [user, module]);

  return { permissions, isLoading };
}
```

### 🚀 Using Permission Hooks

```typescript
'use client';

import { usePermission, useModulePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';

export function ContactsPage() {
  // Check single permission
  const { hasPermission: canCreate, isLoading } = usePermission('contacts', 'create');

  // Or check all module permissions at once
  const { permissions, isLoading: permLoading } = useModulePermissions('contacts');

  if (isLoading || permLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Contacts</h1>
        
        {/* Only show create button if user has permission */}
        {canCreate && (
          <Button onClick={handleCreate}>
            Create Contact
          </Button>
        )}
      </div>

      {/* Contact list with action buttons based on permissions */}
      <ContactList
        canEdit={permissions.canEdit}
        canDelete={permissions.canDelete}
      />
    </div>
  );
}
```

### 🔒 Advanced Permission Patterns

#### 1. Field-Level Permissions

```typescript
export function ContactForm({ contact }: { contact?: Contact }) {
  const { permissions } = useModulePermissions('contacts');
  const { hasPermission: canEditSensitive } = usePermission('contacts', 'edit-sensitive');

  return (
    <form>
      {/* Basic fields - all users can see */}
      <Input name="name" label="Name" />
      <Input name="email" label="Email" />

      {/* Sensitive field - only users with special permission */}
      {canEditSensitive && (
        <Input name="salary" label="Salary" type="number" />
      )}

      {/* Save button - only if can edit */}
      {permissions.canEdit && (
        <Button type="submit">Save</Button>
      )}
    </form>
  );
}
```

#### 2. Server-Side Permission Check (Middleware)

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { checkUserPermission } from '@/lib/auth/permissions';

export async function middleware(request: NextRequest) {
  // Get token
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check permission based on route
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/dashboard/contacts')) {
    const hasAccess = await checkUserPermission(
      decoded.userId,
      'contacts',
      'view'
    );

    if (!hasAccess) {
      return NextResponse.redirect(
        new URL('/dashboard/access-denied', request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*'
};
```

### 📋 Permission System Checklist

Before deploying any new feature:

- [ ] Permissions created in database (module + actions)
- [ ] API routes protected with permission checks
- [ ] Page components check permissions on mount
- [ ] Individual buttons/actions check permissions
- [ ] Permission checks happen BEFORE rendering (good UX)
- [ ] Loading states shown while checking permissions
- [ ] Unauthorized access redirects to access-denied page
- [ ] Admin role has full access to all features
- [ ] Permissions work correctly with roles
- [ ] Permission descriptions available in EN + AR
- [ ] Script to add permissions to roles created
- [ ] Tested with different user roles

### 🎯 Permission Naming Convention

Follow this naming pattern:

```typescript
// Module: Feature or resource name (lowercase, plural)
// Action: Operation type (lowercase)

// Standard actions:
'view'    → Can view/list items
'create'  → Can create new items
'edit'    → Can modify existing items
'delete'  → Can remove items

// Special actions:
'export'  → Can export data
'import'  → Can import data
'approve' → Can approve items
'publish' → Can publish items

// Examples:
{ module: 'contacts', action: 'view' }
{ module: 'contacts', action: 'create' }
{ module: 'reports', action: 'export' }
{ module: 'tasks', action: 'approve' }
{ module: 'system', action: 'admin' }  // Super admin
```

---

## �🎨 Common Patterns

### 1️⃣ Form Submission with apiClient

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';

export function useContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();
  
  const form = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { /* ... */ }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      const contactData = {
        ...data,
        avatarUrl: avatarUrl
      };

      const response = await apiClient.post('/api/crm/contacts', contactData);
      
      if (response.success) {
        toast.success('Contact created successfully');
        router.push('/dashboard/crm/contacts');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create contact'));
    } finally {
      setIsLoading(false);
    }
  };

  return { form, isLoading, avatarUrl, setAvatarUrl, onSubmit };
}
```

### 2️⃣ Data Fetching in Server Component

```typescript
// app/dashboard/crm/contacts/page.tsx
import { cookies } from 'next/headers';

async function getContacts() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/contacts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch contacts');
  }

  return response.json();
}

export default async function ContactsPage() {
  const { data: contacts } = await getContacts();

  return <ContactsClientComponent contacts={contacts} />;
}
```

### 3️⃣ Real-time Updates

```typescript
import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export function useContactList() {
  const [contacts, setContacts] = useState([]);

  const fetchContacts = async () => {
    const response = await apiClient.get('/api/crm/contacts');
    if (response.success && response.data) {
      setContacts(response.data);
    }
  };

  useEffect(() => {
    fetchContacts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshContacts = () => {
    fetchContacts();
  };

  return { contacts, refreshContacts };
}
```

---

## ❌ Error Handling

### Standard Error Handling

```typescript
import { apiClient, ApiClientError, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';

// ✅ Recommended approach
try {
  const response = await apiClient.post('/api/crm/contacts', data);
  if (response.success) {
    toast.success('Success!');
  }
} catch (error) {
  const message = getErrorMessage(error, 'Operation failed');
  toast.error(message);
  console.error('Error details:', error);
}

// ✅ With more details
try {
  const response = await apiClient.post('/api/crm/contacts', data);
  if (response.success) {
    toast.success(response.message || 'Success!');
    return response.data;
  }
} catch (error) {
  if (error instanceof ApiClientError) {
    // API Error
    switch (error.statusCode) {
      case 401:
        toast.error('Please login again');
        router.push('/login');
        break;
      case 403:
        toast.error('You do not have permission');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      default:
        toast.error(error.message);
    }
  } else {
    // Network error or other errors
    toast.error('Network error. Please check your connection.');
  }
  throw error; // if you need to propagate
}
```

### Common Errors and Solutions

| Error | Reason | Solution |
|-------|--------|----------|
| `401 Unauthorized` | Invalid or expired token | Redirect user to login page |
| `403 Forbidden` | Insufficient permissions | Check user permissions |
| `404 Not Found` | Resource not found | Verify URL and ID |
| `500 Internal Server Error` | Server error | Log and show generic message |

---

## ✨ Best Practices

### ✅ Do

1. **Always use `apiClient`**
   ```typescript
   // ✅ Correct
   const response = await apiClient.get('/api/users');
   
   // ❌ Wrong
   const response = await fetch('/api/users');
   ```

2. **Use Type Safety**
   ```typescript
   // ✅ Correct
   const response = await apiClient.get<User[]>('/api/users');
   const users: User[] = response.data!;
   
   // ❌ Wrong
   const response = await apiClient.get('/api/users');
   const users = response.data; // type: any
   ```

3. **Handle Errors**
   ```typescript
   // ✅ Correct
   try {
     const response = await apiClient.post('/api/users', data);
     toast.success('User created');
   } catch (error) {
     toast.error(getErrorMessage(error));
   }
   
   // ❌ Wrong
   const response = await apiClient.post('/api/users', data);
   // No error handling
   ```

4. **Use Upload Components**
   ```typescript
   // ✅ Correct - using component
   <ImageUpload
     entityType="user"
     entityId={userId}
     onUploadComplete={handleUpload}
   />
   
   // ❌ Wrong - manual implementation without reason
   <input type="file" onChange={manualUpload} />
   ```

### ❌ Don't

1. **Don't use `fetch` directly**
2. **Don't manually retrieve token** (apiClient does this)
3. **Don't ignore errors**
4. **Don't use `any` type**

### 🔄 Migration from fetch to apiClient

```typescript
// Before (❌ Old)
const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
const response = await fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// After (✅ New)
const response = await apiClient.get('/api/users');
const data = response.data;
```

---

## 📚 Complete Examples

### Example 1: Complete CRUD for Contact

<details>
<summary>Click to view complete code</summary>

```typescript
import { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { Contact } from '@/types/database';
import { toast } from 'sonner';

export function useContactCRUD() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // READ - Get all contacts
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Contact[]>('/api/crm/contacts');
      if (response.success && response.data) {
        setContacts(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load contacts'));
    } finally {
      setIsLoading(false);
    }
  };

  // CREATE - Create new contact
  const createContact = async (data: Partial<Contact>) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<Contact>('/api/crm/contacts', data);
      if (response.success && response.data) {
        setContacts(prev => [...prev, response.data!]);
        toast.success('Contact created successfully');
        return response.data;
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create contact'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE - Update existing contact
  const updateContact = async (id: string, data: Partial<Contact>) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put<Contact>(
        `/api/crm/contacts/${id}`,
        data
      );
      if (response.success && response.data) {
        setContacts(prev =>
          prev.map(c => c.id === id ? response.data! : c)
        );
        toast.success('Contact updated successfully');
        return response.data;
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update contact'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // PATCH - Partial update (e.g., avatar only)
  const updateContactAvatar = async (id: string, avatarUrl: string) => {
    try {
      const response = await apiClient.patch<Contact>(
        `/api/crm/contacts/${id}`,
        { avatarUrl }
      );
      if (response.success && response.data) {
        setContacts(prev =>
          prev.map(c => c.id === id ? { ...c, avatarUrl } : c)
        );
        toast.success('Avatar updated successfully');
        return response.data;
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update avatar'));
      throw error;
    }
  };

  // DELETE - Delete contact
  const deleteContact = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.delete(`/api/crm/contacts/${id}`);
      if (response.success) {
        setContacts(prev => prev.filter(c => c.id !== id));
        toast.success('Contact deleted successfully');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete contact'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    isLoading,
    fetchContacts,
    createContact,
    updateContact,
    updateContactAvatar,
    deleteContact
  };
}
```

</details>

### Example 2: Form with Image Upload

<details>
<summary>Click to view complete code</summary>

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { ContactAvatarUpload } from '@/components/crm/contact-avatar-upload';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { contactFormSchema, ContactFormData } from './contact-schema';

export function NewContactForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullNameEn: '',
      email: '',
      phone: '',
      type: 'LEAD'
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      const contactData = {
        ...data,
        avatarUrl: avatarUrl
      };

      const response = await apiClient.post('/api/crm/contacts', contactData);
      
      if (response.success) {
        toast.success('Contact created successfully');
        router.push('/dashboard/crm/contacts');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create contact'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ContactAvatarUpload
          currentAvatarUrl={avatarUrl}
          contactName={form.watch('fullNameEn')}
          onAvatarChange={setAvatarUrl}
          variant="card"
        />
        
        {/* Other form fields */}
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Contact'}
        </Button>
      </form>
    </Form>
  );
}
```

</details>

---

## � UI/UX Best Practices

### Component Structure

```typescript
// ✅ Correct - Well organized component
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { useModulePermissions } from '@/hooks/use-permissions';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface MyComponentProps {
  id: string;
}

export function MyComponent({ id }: MyComponentProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { permissions, isLoading } = useModulePermissions('myModule');
  
  // State
  const [data, setData] = useState(null);
  
  // Effects
  useEffect(() => {
    // Load data
  }, []);
  
  // Handlers
  const handleAction = async () => {
    // Handle action
  };
  
  // Render
  if (isLoading) return <div>{t('common.loading')}</div>;
  if (!permissions.canView) return null;
  
  return (
    <Card>
      {/* Component content */}
    </Card>
  );
}
```

### Responsive Design Patterns

```typescript
// Mobile-first approach
<div className="
  grid 
  grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2     // Small: 2 columns
  md:grid-cols-3     // Medium: 3 columns
  lg:grid-cols-4     // Large: 4 columns
  gap-4              // Consistent spacing
">
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</div>
```

### Loading & Error States

```typescript
export function DataList() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <p className="mt-2 text-destructive">{error}</p>
        <Button onClick={retry} className="mt-4">Retry</Button>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">No items found</p>
        <Button onClick={handleCreate} className="mt-4">Create First Item</Button>
      </div>
    );
  }

  // Data state
  return (
    <div className="grid gap-4">
      {data.map(item => <ItemCard key={item.id} {...item} />)}
    </div>
  );
}
```

---

## 🔐 Advanced Security Patterns

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        
        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Usage in API route
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    await limiter.check(10, getIP(request)); // 10 requests per minute
  } catch {
    return NextResponse.json(
      { success: false, message: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  // Process request...
}
```

### CSRF Protection

```typescript
// All POST/PUT/DELETE requests automatically protected by Next.js
// Additional protection with custom token

import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export async function generateCSRFToken() {
  const token = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return token;
}

export async function verifyCSRFToken(token: string) {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('csrf-token')?.value;
  return token === storedToken;
}
```

### Content Security Policy

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 📊 Database Best Practices

### Efficient Queries

```typescript
// ✅ Correct - Selective loading
const contacts = await prisma.contact.findMany({
  select: {
    id: true,
    fullNameEn: true,
    email: true,
    avatarUrl: true,
    company: {
      select: {
        id: true,
        name: true
      }
    }
  },
  where: { type: 'CUSTOMER' },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: (page - 1) * 20
});

// ❌ Wrong - Loading everything
const contacts = await prisma.contact.findMany({
  include: {
    company: true,
    deals: true,
    tasks: true,
    notes: true,
    attachments: true
  }
});
```

### Transaction Handling

```typescript
// ✅ Correct - Use transactions for related operations
import { prisma } from '@/lib/db/prisma';

async function createContactWithCompany(contactData, companyData) {
  return await prisma.$transaction(async (tx) => {
    // Create company first
    const company = await tx.company.create({
      data: companyData
    });

    // Then create contact with company reference
    const contact = await tx.contact.create({
      data: {
        ...contactData,
        companyId: company.id
      }
    });

    return { company, contact };
  });
}
```

### Pagination Pattern

```typescript
// Cursor-based pagination for better performance
async function getPaginatedContacts(cursor?: string, limit = 20) {
  const contacts = await prisma.contact.findMany({
    take: limit + 1, // Take one extra to check if there's more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
    orderBy: { createdAt: 'desc' }
  });

  let nextCursor: string | undefined = undefined;
  if (contacts.length > limit) {
    const nextItem = contacts.pop();
    nextCursor = nextItem!.id;
  }

  return {
    data: contacts,
    nextCursor,
    hasMore: !!nextCursor
  };
}
```

---

## 🧪 Testing Guidelines

### Unit Testing

```typescript
// tests/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatPhone, validateEmail } from '@/lib/utils';

describe('Utils', () => {
  describe('formatPhone', () => {
    it('should format Omani phone number correctly', () => {
      expect(formatPhone('96812345678')).toBe('+968 1234 5678');
      expect(formatPhone('+96812345678')).toBe('+968 1234 5678');
    });

    it('should handle invalid input', () => {
      expect(formatPhone('')).toBe('');
      expect(formatPhone('invalid')).toBe('invalid');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });
});
```

### Integration Testing

```typescript
// tests/api/contacts.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, createTestToken, cleanupTestData } from './helpers';

describe('Contacts API', () => {
  let testToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const user = await createTestUser({ role: 'admin' });
    testUserId = user.id;
    testToken = createTestToken(user);
  });

  afterAll(async () => {
    await cleanupTestData(testUserId);
  });

  it('should create contact with valid data', async () => {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullNameEn: 'Test Contact',
        email: 'test@example.com',
        phone: '+96812345678',
        type: 'LEAD'
      })
    });

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.fullNameEn).toBe('Test Contact');
  });

  it('should reject invalid phone number', async () => {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullNameEn: 'Test Contact',
        email: 'test@example.com',
        phone: 'invalid',
        type: 'LEAD'
      })
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
```

---

## 🚀 Performance Optimization

### Image Optimization

```typescript
// ✅ Correct - Use Next.js Image component
import Image from 'next/image';

<Image
  src={contact.avatarUrl}
  alt={contact.fullNameEn}
  width={48}
  height={48}
  className="rounded-full"
  loading="lazy"
/>

// ❌ Wrong - Regular img tag
<img src={contact.avatarUrl} alt={contact.fullNameEn} />
```

### Code Splitting

```typescript
// ✅ Correct - Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false // Don't render on server if not needed
});

export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart data={chartData} />
    </div>
  );
}
```

### Debouncing & Throttling

```typescript
// Debounce for search inputs
import { useDebouncedCallback } from 'use-debounce';

export function SearchInput() {
  const [search, setSearch] = useState('');
  
  const debouncedSearch = useDebouncedCallback(
    async (value: string) => {
      const response = await apiClient.get('/api/search', {
        params: { q: value }
      });
      setResults(response.data);
    },
    300 // Wait 300ms after user stops typing
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  return <Input value={search} onChange={handleChange} />;
}
```

---

## 📱 Mobile-First Development

### Touch-Friendly UI

```typescript
// Minimum touch target size: 44x44px
<Button className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>

// Proper spacing for mobile
<div className="space-y-4 md:space-y-6">
  {items.map(item => <Item key={item.id} {...item} />)}
</div>
```

### Mobile Navigation

```typescript
// Mobile drawer navigation
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <nav className="flex flex-col gap-4">
          {/* Navigation items */}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

---

## 🎯 Summary for Copilot

When creating or editing code:

### Must Always Do:
1. ✅ Use `apiClient` for all API requests
2. ✅ Add all text to translation files (EN + AR)
3. ✅ Implement permission checks everywhere
4. ✅ Use TypeScript types (no `any`)
5. ✅ Handle errors with try/catch
6. ✅ Validate input on client AND server
7. ✅ Use shadcn/ui components
8. ✅ Make responsive (mobile-first)
9. ✅ Add loading/error/empty states
10. ✅ Test with different roles

### Must Never Do:
1. ❌ Use `fetch` directly
2. ❌ Hardcode text in components
3. ❌ Skip permission checks
4. ❌ Use `any` type
5. ❌ Trust client-side validation only
6. ❌ Create custom styled components
7. ❌ Make desktop-only layouts
8. ❌ Skip error handling
9. ❌ Render without permission check
10. ❌ Deploy without testing

---

## 📖 Additional Resources

- **API Client Documentation**: `/src/lib/api-client.ts`
- **Permission System**: `/src/lib/auth/permissions.ts`
- **Translation System**: `/src/lib/i18n/translations.ts`
- **Upload Components**: `/src/components/ui/` and `/src/components/crm/`
- **Type Definitions**: `/src/types/database.ts`
- **Permission Hooks**: `/src/hooks/use-permissions.ts`
- **Example Usage**: `/src/app/dashboard/crm/contacts/`
- **Complete Example**: `/docs/EXAMPLE_NEW_FEATURE.md`

---

## 🤝 Contributing

When adding new features:

1. Read this guide thoroughly
2. Check the complete example in `/docs/EXAMPLE_NEW_FEATURE.md`
3. Follow the patterns established in existing code
4. Use `apiClient` for all API calls
5. Add translations (EN + AR)
6. Create and assign permissions
7. Add proper TypeScript types
8. Include error handling
9. Write tests if applicable
10. Update documentation

---

**Last Updated**: November 2024  
**Maintained By**: Development Team  
**Version**: 1.0.0

