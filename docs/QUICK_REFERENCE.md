# Quick Reference Guide

> **Quick reference for common development tasks**

## 🚀 Quick Start Checklist

### Creating Any New Feature

```bash
# 1. Plan the feature
- [ ] Define module name (e.g., 'projects', 'tasks', 'reports')
- [ ] List required actions (view, create, edit, delete, etc.)
- [ ] Identify all text that needs translation

# 2. Add translations (EN + AR)
- [ ] Open: src/shared/i18n/translations.ts
- [ ] Add English translations
- [ ] Add Arabic translations
- [ ] Test both languages

# 3. Create permissions
- [ ] Create script: scripts/add-[feature]-permissions.ts
- [ ] Run: npx tsx scripts/add-[feature]-permissions.ts
- [ ] Verify in database

# 4. Create API routes
- [ ] app/api/[feature]/route.ts (GET, POST)
- [ ] app/api/[feature]/[id]/route.ts (GET, PUT, DELETE)
- [ ] Add permission checks to all routes
- [ ] Add input validation

# 5. Create UI components
- [ ] Check permissions on mount
- [ ] Use useModulePermissions hook
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty states
- [ ] Use translation hook

# 6. Test
- [ ] Test with admin role
- [ ] Test with limited role
- [ ] Test in English
- [ ] Test in Arabic
- [ ] Test on mobile
- [ ] Test API endpoints
```

---

## 📝 Code Snippets

### 1. Basic API Route with Permissions

```typescript
// app/api/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/core/auth/jwt';
import { checkUserPermission } from '@/core/auth/permissions';
import { prisma } from '@/core/data/prisma';
import { z } from 'zod';

const schema = z.object({
  // Define your schema
});

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const hasPermission = await checkUserPermission(decoded.userId, 'MODULE_NAME', 'view');
    if (!hasPermission) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const data = await prisma.yourModel.findMany();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const hasPermission = await checkUserPermission(decoded.userId, 'MODULE_NAME', 'create');
    if (!hasPermission) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validated = schema.parse(body);

    const item = await prisma.yourModel.create({ data: validated });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
```

### 2. Component with Permissions

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/shared/hooks/use-translation';
import { useModulePermissions } from '@/shared/hooks/use-permissions';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

export default function MyFeaturePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { permissions, isLoading: permLoading } = useModulePermissions('MODULE_NAME');
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!permLoading && !permissions.canView) {
      toast.error(t('MODULE_NAME.messages.noPermission'));
      router.push('/dashboard/access-denied');
    }
  }, [permissions, permLoading, router, t]);

  useEffect(() => {
    async function fetchData() {
      if (!permissions.canView) return;

      try {
        const response = await apiClient.get('/api/MODULE_NAME');
        if (response.success && response.data) {
          setItems(response.data);
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }

    if (!permLoading && permissions.canView) {
      fetchData();
    }
  }, [permissions, permLoading]);

  if (permLoading || isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  if (!permissions.canView) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>{t('MODULE_NAME.title')}</h1>
        {permissions.canCreate && (
          <Button onClick={() => router.push('/dashboard/MODULE_NAME/new')}>
            {t('MODULE_NAME.create')}
          </Button>
        )}
      </div>

      {/* Your content */}
    </div>
  );
}
```

### 3. Permission Script Template

```typescript
// scripts/add-[feature]-permissions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPermissions() {
  console.log('🔐 Adding permissions...');

  const permissions = [
    {
      module: 'MODULE_NAME',
      action: 'view',
      descriptionEn: 'View Module',
      descriptionAr: 'عرض الوحدة'
    },
    {
      module: 'MODULE_NAME',
      action: 'create',
      descriptionEn: 'Create Items',
      descriptionAr: 'إنشاء عناصر'
    },
    {
      module: 'MODULE_NAME',
      action: 'edit',
      descriptionEn: 'Edit Items',
      descriptionAr: 'تعديل عناصر'
    },
    {
      module: 'MODULE_NAME',
      action: 'delete',
      descriptionEn: 'Delete Items',
      descriptionAr: 'حذف عناصر'
    }
  ];

  for (const perm of permissions) {
    try {
      const existing = await prisma.permission.findFirst({
        where: { module: perm.module, action: perm.action }
      });

      if (!existing) {
        await prisma.permission.create({ data: perm });
        console.log(`✅ Created: ${perm.module}.${perm.action}`);
      } else {
        console.log(`⏭️  Exists: ${perm.module}.${perm.action}`);
      }
    } catch (error) {
      console.error(`❌ Failed: ${perm.module}.${perm.action}`, error);
    }
  }

  console.log('✅ Done!');
  await prisma.$disconnect();
}

addPermissions();
```

### 4. Translation Template

```typescript
// Add to src/shared/i18n/translations.ts

export const translations = {
  en: {
    // ... existing
    MODULE_NAME: {
      title: 'Module Title',
      list: 'Items List',
      create: 'Create New',
      edit: 'Edit Item',
      delete: 'Delete Item',
      view: 'View Details',
      description: 'Module description',
      
      form: {
        name: 'Name',
        namePlaceholder: 'Enter name',
        description: 'Description',
        descriptionPlaceholder: 'Enter description'
      },
      
      messages: {
        createSuccess: 'Created successfully',
        updateSuccess: 'Updated successfully',
        deleteSuccess: 'Deleted successfully',
        deleteConfirm: 'Are you sure?',
        noPermission: 'No permission to access',
        loadError: 'Failed to load'
      }
    }
  },
  ar: {
    // ... existing
    MODULE_NAME: {
      title: 'عنوان الوحدة',
      list: 'قائمة العناصر',
      create: 'إنشاء جديد',
      edit: 'تعديل عنصر',
      delete: 'حذف عنصر',
      view: 'عرض التفاصيل',
      description: 'وصف الوحدة',
      
      form: {
        name: 'الاسم',
        namePlaceholder: 'أدخل الاسم',
        description: 'الوصف',
        descriptionPlaceholder: 'أدخل الوصف'
      },
      
      messages: {
        createSuccess: 'تم الإنشاء بنجاح',
        updateSuccess: 'تم التحديث بنجاح',
        deleteSuccess: 'تم الحذف بنجاح',
        deleteConfirm: 'هل أنت متأكد؟',
        noPermission: 'لا يوجد صلاحية للوصول',
        loadError: 'فشل التحميل'
      }
    }
  }
};
```

---

## 🔍 Common Commands

```bash
# Development
npm run dev                    # Start dev server

# Database
npx prisma studio             # Open Prisma Studio
npx prisma generate           # Generate Prisma Client
npx prisma db push            # Push schema changes

# Run scripts
npx tsx scripts/SCRIPT_NAME.ts

# Testing
npm run test                  # Run all tests
npm run test:watch           # Run tests in watch mode

# Build
npm run build                # Build for production
npm run start                # Start production server

# Linting
npm run lint                 # Run ESLint
npm run lint:fix            # Fix ESLint errors
```

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" Error
```typescript
// Solution: Check if token exists and is valid
const token = request.cookies.get('auth-token')?.value;
console.log('Token:', token); // Debug

// Make sure cookie is set correctly
document.cookie = `auth-token=${token}; path=/; SameSite=Strict`;
```

### Issue: "Access Denied" Error
```typescript
// Solution: Check permissions in database
// 1. Verify permission exists
// 2. Verify role has permission
// 3. Verify user has role

// Debug permission check
const hasPermission = await checkUserPermission(userId, module, action);
console.log('Permission check:', { userId, module, action, hasPermission });
```

### Issue: Translation Not Working
```typescript
// Solution: Check translation key exists
const { t } = useTranslation();
console.log('Translation:', t('MODULE_NAME.title'));

// Verify key exists in translations.ts
// Check both en and ar objects
```

### Issue: Component Not Rendering
```typescript
// Solution: Check permission loading state
const { permissions, isLoading } = useModulePermissions('MODULE_NAME');

// Add debug logs
console.log('Permissions:', permissions);
console.log('Is Loading:', isLoading);

// Make sure to handle loading state
if (isLoading) return <div>Loading...</div>;
if (!permissions.canView) return null;
```

---

## 📱 Responsive Breakpoints

```typescript
// Tailwind CSS breakpoints
sm: '640px'   // Small devices
md: '768px'   // Medium devices  
lg: '1024px'  // Large devices
xl: '1280px'  // Extra large devices
2xl: '1536px' // 2X large devices

// Usage
<div className="
  text-sm md:text-base lg:text-lg    // Font sizes
  p-4 md:p-6 lg:p-8                  // Padding
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3  // Grid columns
">
```

---

## 🎨 Common UI Patterns

### Card with Actions
```typescript
<Card className="p-6">
  <div className="flex justify-between items-start mb-4">
    <div>
      <h3 className="font-semibold">{item.title}</h3>
      <p className="text-sm text-muted-foreground">{item.description}</p>
    </div>
    <div className="flex gap-2">
      {permissions.canEdit && (
        <Button size="icon" variant="ghost" onClick={handleEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {permissions.canDelete && (
        <Button size="icon" variant="ghost" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
</Card>
```

### Form with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address')
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' }
  });

  const onSubmit = async (data) => {
    // Handle submit
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### Data Table
```typescript
import { DataTable } from '@/shared/components/ui/data-table';

const columns = [
  { accessorKey: 'name', header: t('common.name') },
  { accessorKey: 'email', header: t('common.email') },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        {permissions.canEdit && <Button>Edit</Button>}
        {permissions.canDelete && <Button>Delete</Button>}
      </div>
    )
  }
];

<DataTable columns={columns} data={items} />
```

---

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

---

**Quick Tip**: Always check `DEVELOPMENT_GUIDE.md` for detailed explanations!
