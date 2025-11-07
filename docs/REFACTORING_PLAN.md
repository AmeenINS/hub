# Complete Application Refactoring Plan

## 🎯 Objective
Refactor entire application to be highly professional, cohesive, and aligned with development guidelines.

## ✅ Completed Refactorings

### 1. API Client Migration
- [x] `/src/app/dashboard/page.tsx` - Replaced `fetch` with `apiClient`
- [x] `/src/features/dashboard/components/user-avatar-upload.tsx` - Replaced `fetch` with `apiClient`
- [x] `/src/app/dashboard/crm/contacts/contacts-client.tsx` - Replaced `fetch` with `apiClient`

## 🔄 In Progress

### 2. Remaining fetch() Replacements
- [ ] `/src/app/dashboard/crm/contacts/[id]/contact-profile-client.tsx`
- [ ] `/src/features/tasks/components/task-detail-dialog.tsx` (multiple fetch calls)
- [ ] `/src/features/scheduler/components/create-scheduler-dialog.tsx`
- [ ] `/src/features/scheduler/components/notification-service.tsx`
- [ ] `/src/features/scheduler/components/scheduler-event-detail-dialog.tsx`
- [ ] `/src/features/scheduler/components/scheduler-event-card.tsx`
- [ ] `/src/shared/components/ui/file-upload.tsx`

## 📋 Next Steps

### 3. Translation System Audit
- [ ] Audit all components for hardcoded text
- [ ] Move all text to `/src/shared/i18n/translations.ts`
- [ ] Ensure bilingual support (EN + AR) for all UI elements
- [ ] Add missing translations

### 4. Permission System Integration
- [ ] Create `/src/hooks/use-permissions.ts` hook (if not exists)
- [ ] Add permission checks to all page components
- [ ] Add permission checks to all action buttons
- [ ] Verify API routes have permission validation
- [ ] Add loading states during permission checks

### 5. TypeScript Type Safety
- [ ] Remove all `any` types (except in api-client generics)
- [ ] Add proper interface definitions
- [ ] Ensure all API responses are typed
- [ ] Add proper types to all component props

### 6. Error Handling Standardization
- [ ] Wrap all API calls in try/catch
- [ ] Use `getErrorMessage()` helper consistently
- [ ] Add error boundaries to major sections
- [ ] Add error states to all data-fetching components

### 7. Component Structure Standardization
- [ ] Reorganize imports (React, Next.js, UI, utils, types)
- [ ] Add TypeScript interfaces at top
- [ ] Use consistent hook order
- [ ] Add loading/error/empty states to all lists
- [ ] Implement proper responsive design

### 8. Database Query Optimization
- [ ] Audit Prisma queries for efficiency
- [ ] Replace `include` with `select` where appropriate
- [ ] Add pagination to large data sets
- [ ] Implement proper indexing
- [ ] Add transaction handling where needed

### 9. Security Enhancements
- [ ] Add rate limiting to API routes
- [ ] Implement CSRF protection
- [ ] Add input validation (Zod schemas)
- [ ] Add security headers
- [ ] Implement Content Security Policy

### 10. Performance Optimizations
- [ ] Add React.memo to expensive components
- [ ] Implement code splitting for heavy features
- [ ] Optimize images with Next.js Image component
- [ ] Add debouncing to search inputs
- [ ] Implement lazy loading for modals/dialogs

### 11. Accessibility Improvements
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add alt text to all images
- [ ] Verify color contrast ratios
- [ ] Add focus states to all inputs

### 12. Mobile Responsiveness
- [ ] Audit all layouts for mobile-first design
- [ ] Fix desktop-only components
- [ ] Add mobile navigation patterns
- [ ] Test touch interactions
- [ ] Verify responsive breakpoints

## 🎨 Code Quality Standards

### Import Organization
```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { toast } from 'sonner';

// 3. Internal utilities
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useTranslation } from '@/shared/hooks/use-translation';
import { useModulePermissions } from '@/shared/hooks/use-permissions';

// 4. Components (UI first, then features)
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

// 5. Types
import { Contact } from '@/shared/types/database';

// 6. Icons (last)
import { Plus, Edit, Trash2 } from 'lucide-react';
```

### Component Structure Template
```typescript
'use client';

// Imports (organized as above)

// Types & Interfaces
interface MyComponentProps {
  id: string;
  data: DataType;
}

// Component
export function MyComponent({ id, data }: MyComponentProps) {
  // 1. Hooks
  const router = useRouter();
  const { t } = useTranslation();
  const { permissions, isLoading } = useModulePermissions('myModule');
  
  // 2. State
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 3. Effects
  useEffect(() => {
    // Check permissions and redirect if needed
    if (!isLoading && !permissions.canView) {
      router.push('/dashboard/access-denied');
    }
  }, [permissions, isLoading, router]);
  
  // 4. Handlers
  const handleAction = async () => {
    try {
      const response = await apiClient.post('/api/action', data);
      if (response.success) {
        toast.success(t('messages.success'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.error')));
    }
  };
  
  // 5. Render guards
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!permissions.canView) {
    return null;
  }
  
  if (error) {
    return <ErrorState error={error} onRetry={fetchData} />;
  }
  
  if (items.length === 0) {
    return <EmptyState onAction={handleAction} />;
  }
  
  // 6. Main render
  return (
    <div className="container mx-auto p-4">
      {/* Component content */}
    </div>
  );
}
```

### API Route Template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/core/auth/jwt';
import { checkUserPermission } from '@/core/auth/permissions';
import { prisma } from '@/core/data/prisma';
import { z } from 'zod';

// Validation schema
const requestSchema = z.object({
  field1: z.string().min(1),
  field2: z.string().email(),
});

export async function POST(request: NextRequest) {
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
      'module',
      'action'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // 3. Validate input
    const body = await request.json();
    const validated = requestSchema.parse(body);

    // 4. Process request
    const result = await prisma.model.create({
      data: {
        ...validated,
        userId: decoded.userId,
      },
      select: {
        id: true,
        field1: true,
        field2: true,
      },
    });

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Created successfully',
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 📊 Progress Tracking

### Phase 1: Critical Fixes (Days 1-2)
- [x] 20% - API Client migration started
- [ ] Translation system audit
- [ ] Permission system integration
- [ ] Type safety improvements

### Phase 2: Standards Implementation (Days 3-5)
- [ ] Error handling standardization
- [ ] Component structure refactoring
- [ ] Database optimization
- [ ] Security enhancements

### Phase 3: Quality & Performance (Days 6-7)
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] Final testing & documentation

## 🎯 Success Criteria

- [ ] Zero direct `fetch()` calls (except in api-client.ts)
- [ ] Zero hardcoded UI text
- [ ] All features have permission checks
- [ ] Zero `any` types (except necessary generics)
- [ ] All API calls have error handling
- [ ] All components follow standard structure
- [ ] All Prisma queries optimized
- [ ] Security headers implemented
- [ ] Performance score > 90
- [ ] Mobile-responsive throughout
- [ ] Accessibility score > 95

## 📝 Notes

- Keep git commits atomic and well-documented
- Test each refactoring before moving to next
- Update documentation as changes are made
- Run TypeScript check after each major change
- Verify no breaking changes in existing functionality
