# Comprehensive Module Refactoring - Progress Report

## Overview

Systematic refactoring of all modules (Tasks, Notifications, Users, Contacts) to comply with development guidelines.

---

## Refactoring Checklist

### ✅ Standards to Apply

1. **API Client**: Replace `fetch()` with `apiClient`
2. **Translations**: Remove hardcoded text, use `t()` function
3. **Permissions**: Check permissions before rendering
4. **TypeScript**: Fix `any` types, add proper interfaces
5. **Error Handling**: Use `try/catch` with `getErrorMessage`
6. **Component Structure**: Professional import organization
7. **Loading States**: Add proper loading/error/empty states
8. **Comments**: English only

---

## Module Status

### 🟢 Tasks Module

#### ✅ Completed Files

1. **`src/app/dashboard/tasks/page.tsx`** - Main tasks list page
   - ✅ Replaced `fetch` with `apiClient`
   - ✅ Organized imports professionally
   - ✅ Added proper error handling with `getErrorMessage`
   - ✅ Removed auth store hydration complexity
   - ✅ Simplified data fetching logic
   - ✅ All translations already in place
   - ✅ Loading states properly implemented

**Before:**
```typescript
const response = await fetch('/api/tasks', {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

if (!response.ok) {
  if (response.status === 401) {
    toast.error(t('auth.loginError'));
    router.push('/login');
    return;
  }
  throw new Error('Failed to fetch tasks');
}
```

**After:**
```typescript
try {
  const response = await apiClient.get<ApiResponse<Task[]>>('/api/tasks');
  if (response.success && response.data) {
    setTasks(response.data.data || []);
  }
} catch (error) {
  toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
}
```

#### ⏳ Pending Files

2. **`src/features/tasks/components/kanban-board.tsx`**
   - Status: Needs review for hardcoded text
   - Action: Check for English-only labels

3. **`src/features/tasks/components/task-detail-dialog.tsx`**
   - Status: Not reviewed
   - Action: Full audit needed

4. **`src/app/dashboard/tasks/my-tasks/page.tsx`**
   - Status: Not reviewed
   - Action: Apply apiClient pattern

5. **`src/app/dashboard/tasks/new/page.tsx`**
   - Status: Not reviewed
   - Action: Apply apiClient pattern

6. **`src/app/dashboard/tasks/[id]/edit/page.tsx`**
   - Status: Not reviewed
   - Action: Apply apiClient pattern

---

### 🟡 Notifications Module

#### Files to Refactor

1. **`src/app/dashboard/notifications/page.tsx`**
   - Issues Found:
     - ❌ Using `fetch` directly (3+ instances)
     - ❌ Manual permission checks with fetch
     - ⚠️ Complex auth handling
   - Actions Needed:
     - Replace fetch with apiClient
     - Use `useModulePermissions` hook
     - Simplify error handling

2. **`src/app/api/notifications/route.ts`**
   - Action: Review for consistency

3. **`src/app/api/notifications/[id]/route.ts`**
   - Action: Review for consistency

---

### 🟡 Users Module

#### Files to Refactor

1. **`src/app/dashboard/users/page.tsx`**
   - Issues Found:
     - ❌ Using `fetch` directly (3 instances found)
     - Line 53: `await fetch('/api/users', ...)`
     - Line 96: `await fetch(\`/api/users/${deleteDialog.user.id}\`, ...)`
     - Line 117: `await fetch(\`/api/users/${user.id}\`, ...)`
   - Actions Needed:
     - Replace all fetch with apiClient
     - Add proper error handling
     - Check for hardcoded text

2. **`src/app/dashboard/users/new/page.tsx`**
   - Action: Full audit needed

3. **`src/app/dashboard/users/[id]/edit/page.tsx`**
   - Action: Full audit needed

4. **`src/features/dashboard/components/users-data-table.tsx`**
   - Action: Review if exists

---

### 🟢 Contacts Module

#### Status
- ✅ Main page already refactored (`contacts-client.tsx`)
- ✅ Using apiClient
- ✅ Professional structure
- ✅ Translations complete
- ⏳ Need to verify all sub-pages

---

## Refactoring Pattern

### Standard Component Structure

```typescript
'use client';

// React & Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// External libraries
import { Icon1, Icon2 } from 'lucide-react';
import { toast } from 'sonner';

// Internal utilities
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useModulePermissions } from '@/shared/hooks/use-permissions';

// Components - UI
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

// Types
import { MyType } from '@/shared/types/database';

// Types & Interfaces
interface MyInterface {
  // ...
}

// Constants
const MY_CONSTANT = 'value';

// Component
export default function MyComponent() {
  const { t } = useI18n();
  const router = useRouter();
  const { permissions, isLoading: permissionsLoading } = useModulePermissions('module_name');
  
  const [data, setData] = useState<MyType[]>([]);
  const [loading, setLoading] = useState(true);

  // Check permissions
  if (permissionsLoading) {
    return <div>Loading...</div>;
  }

  if (!permissions.canView) {
    return null; // or redirect
  }

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ApiResponse<MyType[]>>('/api/endpoint');
      
      if (response.success && response.data) {
        setData(response.data.data || []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Render with loading/error states
  if (loading) {
    return <LoadingState />;
  }

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

---

## API Conversion Examples

### Before (❌ Old Pattern):
```typescript
const response = await fetch('/api/users', {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

if (!response.ok) {
  if (response.status === 401) {
    toast.error('Unauthorized');
    router.push('/login');
    return;
  }
  throw new Error('Failed');
}

const data = await response.json();
```

### After (✅ New Pattern):
```typescript
try {
  const response = await apiClient.get<ApiResponse<User[]>>('/api/users');
  
  if (response.success && response.data) {
    setUsers(response.data.data || []);
  }
} catch (error) {
  toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
}
```

---

## Translation Pattern

### Before (❌ Hardcoded):
```typescript
<h1>Tasks</h1>
<p>Manage your tasks</p>
<Button>Create Task</Button>
```

### After (✅ Translated):
```typescript
<h1>{t('tasks.title')}</h1>
<p>{t('dashboard.manageTasks')}</p>
<Button>{t('tasks.createTask')}</Button>
```

---

## Permission Pattern

### Before (❌ Manual Check):
```typescript
const response = await fetch('/api/users/me/permissions?modules=tasks', {
  headers: { 'Authorization': `Bearer ${token}` },
});

if (response.ok) {
  const permissions = await response.json();
  const hasAccess = permissions.tasks && permissions.tasks.length > 0;
  setHasAccess(hasAccess);
}
```

### After (✅ Hook):
```typescript
const { permissions, isLoading } = useModulePermissions('tasks');

if (isLoading) return <LoadingState />;
if (!permissions.canView) return null;
```

---

## Progress Summary

### Completed
- ✅ Tasks main page (`page.tsx`) - Fully refactored
- ✅ Contacts main page (`contacts-client.tsx`) - Already done
- ✅ Language policy enforcement
- ✅ Documentation structure created
- ✅ Soft delete system implemented

### In Progress
- 🔄 Tasks module - remaining files
- 🔄 Documentation of refactoring patterns

### Not Started
- ⏳ Notifications module - complete refactor
- ⏳ Users module - complete refactor
- ⏳ TypeScript any types cleanup
- ⏳ Permission system verification
- ⏳ Database query optimization

---

## Next Steps

1. **Continue Tasks Module**: Refactor remaining 5 files
2. **Notifications Module**: Start comprehensive refactor
3. **Users Module**: Start comprehensive refactor
4. **Verify Permissions**: Check all modules have proper permission checks
5. **Fix TypeScript**: Remove remaining `any` types
6. **Testing**: Test all refactored modules

---

## Files Changed

### Session 1: Language Policy & Soft Delete
- `.github/copilot-instructions.md` - Added language policy
- `src/app/api/notifications/test/route.ts` - Fixed Persian comment
- `src/core/scheduler/scheduler-service.ts` - Fixed Persian comment
- `src/shared/i18n/translations.ts` - Fixed Arabic section comments
- Created `/docs` folder structure
- Moved soft delete documentation

### Session 2: Tasks Module Refactoring
- `src/app/dashboard/tasks/page.tsx` - Complete refactor with apiClient

---

**Last Updated**: November 2024  
**Status**: In Progress  
**Next Review**: After Tasks module completion
