# Permission System Implementation Guide

## 🔐 Overview

This document explains how the comprehensive permission system is implemented across all UI components in the AmeenINS Hub application.

## 🎯 Key Features

- **Complete UI Filtering**: All menus, buttons, and components respect user permissions
- **Fine-grained Control**: Both parent modules and submenu items can have individual permission checks
- **Real-time Updates**: Permission changes reflect immediately without page refresh
- **Hierarchical Access**: Sub-items can inherit parent permissions or have their own
- **Professional UX**: Components are completely hidden when access is denied (no partial visibility)

## 🏗️ Architecture

### Core Hook: `useModuleVisibility`

The entire system is built around the `useModuleVisibility` hook:

```typescript
const { hasAccess: canAccessModule, isLoading: permissionsLoading } = useModuleVisibility();

// Check single module
const canViewCRM = canAccessModule('crm');

// Check multiple modules (OR logic)
const canViewAnyAccount = canAccessModule(['accounting', 'commission', 'calculator']);
```

### Permission Levels

The system uses these permission levels:
- `NONE` (0): No access
- `READ` (1): View-only access  
- `WRITE` (2): Create and edit
- `FULL` (3): Delete and manage
- `ADMIN` (4): Module configuration
- `SUPER_ADMIN` (5): System-wide access

## 📍 Implementation Locations

### 1. Sidebar Navigation (`app-sidebar.tsx`)

**Features:**
- Parent modules filtered by main module permission
- Sub-items filtered by individual permissions
- Hierarchical filtering (parent hidden if all sub-items inaccessible)
- Loading states during permission checks

**Implementation:**
```typescript
// Each module has permission check
{
  title: t('modules.crm'),
  module: 'crm',
  items: [
    {
      title: t('modules.contacts'),
      module: ['crm', 'crm_contacts', 'contacts'], // Multiple aliases
    },
    {
      title: t('modules.companies'),
      module: ['crm', 'crm_companies', 'companies'],
    }
  ],
}

// Smart filtering logic
const filterNavItems = React.useMemo(() => {
  return allNavItems
    .filter((item) => hasModuleAccess(item.module))
    .map((item) => {
      if (item.items && item.items.length > 0) {
        const filteredSubItems = item.items.filter((subItem) => {
          if (subItem.module) {
            return hasModuleAccess(subItem.module);
          }
          return true; // Inherit parent permission
        });
        
        if (filteredSubItems.length === 0) {
          return null; // Hide parent if no accessible children
        }
        
        return { ...item, items: filteredSubItems };
      }
      return item;
    })
    .filter(Boolean);
}, [permissionsLoading, allNavItems, hasModuleAccess]);
```

### 2. Dashboard Page (`dashboard/page.tsx`)

**Features:**
- Module cards filtered by permissions
- Stats cards hidden without access
- Loading skeletons during permission checks
- Modal sub-items also filtered

**Implementation:**
```typescript
// Stats cards with permission checks
{hasModuleAccess('notes') && (
  <Card>
    {/* Notes statistics */}
  </Card>
)}

// Module filtering
const accessibleModules = permissionsLoading
  ? []
  : appModules.filter(module => hasModuleAccess(module.module));
```

### 3. Header Navigation (`dashboard/layout.tsx`)

**Features:**
- Quick access buttons hidden without permission
- Notification button filtered
- Calculator shortcut controlled by accounting permission

**Implementation:**
```typescript
const showCalculatorShortcut = !permissionsLoading && canAccessModule('accounting');
const showNotesShortcut = !permissionsLoading && canAccessModule('notes');
const showNotificationButton = !permissionsLoading && canAccessModule('notifications');

{showCalculatorShortcut && (
  <Button variant="ghost" size="icon" asChild>
    <Link href="/dashboard/calculator">
      <Calculator className="h-5 w-5" />
    </Link>
  </Button>
)}
```

### 4. Mobile Navigation (`mobile-nav.tsx`)

**Features:**
- Bottom navigation filtered by permissions
- Responsive design maintained
- Graceful handling when no items accessible

**Implementation:**
```typescript
const navItems = [
  { title: t('dashboard.dashboard'), href: '/dashboard', module: 'dashboard' },
  { title: t('modules.crm'), href: '/dashboard/crm/contacts', module: 'crm' },
  { title: t('nav.notes'), href: '/dashboard/notes', module: 'notes' },
  { title: t('tasks.tasks'), href: '/dashboard/tasks', module: 'tasks' },
  { title: t('settings.settings'), href: '/dashboard/settings', module: 'settings' },
];

const visibleItems = navItems.filter((item) => canAccessModule(item.module));
```

## 🎨 UI/UX Best Practices

### 1. Complete Hiding
Components without permission are completely hidden (not disabled or grayed out):

```typescript
// ✅ Correct - Complete hiding
{hasPermission && <Component />}

// ❌ Wrong - Showing disabled state
<Component disabled={!hasPermission} />
```

### 2. Loading States
Always show loading states during permission checks:

```typescript
{permissionsLoading ? (
  <SkeletonLoader />
) : (
  filteredItems.map(item => <Item key={item.id} />)
)}
```

### 3. Graceful Fallbacks
Handle cases where no items are accessible:

```typescript
{accessibleItems.length === 0 ? (
  <div className="text-center text-muted-foreground">
    {t('common.noData')}
  </div>
) : (
  accessibleItems.map(item => <Item key={item.id} />)
)}
```

## 🔧 Module Aliases

The system supports module aliases for flexible permission mapping:

```typescript
const MODULE_ALIAS_MAP: Record<string, string[]> = {
  crm: ['crm', 'crm_contacts', 'crm_companies', 'contacts', 'companies'],
  accounting: ['accounting', 'commission', 'calculator'],
  livetracking: ['tracking', 'liveTracking'],
};
```

## 📝 Available Modules

Currently implemented modules with permission checks:

### Core Modules
- `dashboard` - Main dashboard
- `liveTracking` - Live tracking system

### Business Modules
- `crm` - Customer relationship management
  - `crm_contacts` - Contact management
  - `crm_companies` - Company management  
  - `crm_leads` - Lead management
  - `crm_deals` - Deal management
  - `crm_activities` - Activity tracking
  - `crm_campaigns` - Campaign management

### Insurance Modules  
- `policies` - Policy management
- `claims` - Claims processing

### Financial Modules
- `accounting` - Financial management
- `commission` - Commission tracking
- `calculator` - Financial calculator

### Operational Modules
- `tasks` - Task management
- `notes` - Note taking
- `scheduler` - Event scheduling
- `workflows` - Process automation
- `inventory` - Inventory management  
- `procurement` - Procurement system

### Administrative Modules
- `users` - User management
- `roles` - Role and permission management
- `reports` - Reporting and analytics
- `notifications` - Notification system
- `settings` - System settings
- `support` - Support system

## 🧪 Testing Permissions

### 1. Test Different Permission Levels
```typescript
// Test with different user roles
const testScenarios = [
  { role: 'viewer', expected: ['dashboard', 'notes'] },
  { role: 'agent', expected: ['dashboard', 'crm', 'tasks', 'notes'] },
  { role: 'manager', expected: ['dashboard', 'crm', 'tasks', 'reports'] },
  { role: 'admin', expected: ['*'] }, // All modules
];
```

### 2. Test Loading States
- Verify skeletons show during permission loading
- Ensure UI doesn't flash between states
- Test with slow network conditions

### 3. Test Edge Cases
- User with no permissions (should show minimal UI)
- User with partial CRM access (should show filtered sub-items)
- Super admin (should see everything)

## 🚀 Performance Considerations

### 1. Memoization
Permission filtering uses `React.useMemo` to prevent unnecessary recalculations:

```typescript
const filterNavItems = React.useMemo(() => {
  // Expensive filtering logic
}, [permissionsLoading, allNavItems, hasModuleAccess]);
```

### 2. Efficient API Calls
- Permission profile loaded once and cached
- Real-time updates via WebSocket/SSE
- Batch permission checks where possible

### 3. Loading Optimization
- Show loading skeletons instead of empty states
- Progressive disclosure of accessible items
- Minimize layout shifts

## 🔍 Debugging

### Common Issues
1. **Module not showing**: Check if module name matches permission database
2. **Loading forever**: Verify API endpoint is working
3. **Permission not updating**: Check if WebSocket connection is active

### Debug Tools
```typescript
// Add to component for debugging
console.log('Permissions loading:', permissionsLoading);
console.log('User permissions:', profile.moduleLevels);
console.log('Module access check:', canAccessModule('moduleName'));
```

## 📋 Checklist for New Features

When adding new features:

- [ ] Add module permission to navigation items
- [ ] Filter UI components based on permissions
- [ ] Add loading states during permission checks
- [ ] Test with different permission levels
- [ ] Update module alias map if needed
- [ ] Add permission checks to API routes
- [ ] Document new permission requirements

## 🔗 Related Files

- `/src/shared/hooks/use-module-visibility.ts` - Core permission hook
- `/src/core/auth/permissions.ts` - Permission utilities
- `/src/shared/hooks/use-permission-level.ts` - Permission level hooks
- `/docs/PERMISSION_LEVELS_QUICK_START.md` - Permission levels guide
- `/docs/architecture/PERMISSION_LEVEL_SYSTEM.md` - Architecture details

---

This permission system ensures that users only see what they have access to, providing a clean, secure, and professional user experience.