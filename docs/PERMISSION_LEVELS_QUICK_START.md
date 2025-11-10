# Permission Level System - Quick Start Guide

## 🎯 Overview

The Permission Level System provides 6 hierarchical levels: **NONE → READ → WRITE → FULL → ADMIN → SUPER_ADMIN**

Each higher level includes all permissions of lower levels.

## 📦 Installation

Already installed! Files are in:
- `src/core/auth/permission-levels.ts`
- `src/core/auth/settings-levels.ts`
- `src/core/auth/advanced-permission-service.ts`
- `src/shared/hooks/use-permission-level.ts`

## 🚀 Quick Usage

### In Components

```typescript
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { PermissionLevel } from '@/core/auth/permission-levels';

function MyComponent() {
  const { level, canWrite, canAdmin, isLoading } = usePermissionLevel('contacts');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Everyone with READ or higher sees this */}
      <ContactsList />

      {/* Only WRITE and higher */}
      {canWrite && <button>Create Contact</button>}

      {/* Only ADMIN and higher */}
      {canAdmin && <button>Configure Module</button>}
    </div>
  );
}
```

### Settings Specific

```typescript
import { useSettingsPermissions } from '@/shared/hooks/use-permission-level';

function SettingsPage() {
  const {
    canEditCompany,
    canManageIntegrations,
    canAccessDangerZone
  } = useSettingsPermissions();

  return (
    <div>
      {canEditCompany && <CompanyForm />}
      {canManageIntegrations && <IntegrationsPanel />}
      {canAccessDangerZone && <DangerZone />}
    </div>
  );
}
```

### In API Routes

```typescript
import { AdvancedPermissionService } from '@/core/auth/advanced-permission-service';
import { PermissionLevel } from '@/core/auth/permission-levels';
import { JWTService } from '@/core/auth/jwt';

export async function POST(request: NextRequest) {
  // Verify token
  const token = request.cookies.get('auth-token')?.value;
  const decoded = JWTService.verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check permission
  const hasAccess = await AdvancedPermissionService.hasMinimumLevel(
    decoded.userId,
    'contacts',
    PermissionLevel.WRITE
  );

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request...
  return NextResponse.json({ success: true });
}
```

### Check Specific Settings Action

```typescript
export async function PUT(request: NextRequest) {
  const decoded = JWTService.verifyToken(token);

  // Check specific settings action
  const canEdit = await AdvancedPermissionService.checkSettingsPermission(
    decoded.userId,
    'edit_company_info'
  );

  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update company info...
}
```

## 📊 Permission Levels

| Level | Value | Name | Capabilities |
|-------|-------|------|-------------|
| NONE | 0 | No Access | Cannot access module |
| READ | 1 | Read Only | View, list, search, export |
| WRITE | 2 | Read & Write | + Create, edit, update |
| FULL | 3 | Full Access | + Delete, manage, assign |
| ADMIN | 4 | Administrator | + Configure, admin features |
| SUPER_ADMIN | 5 | Super Admin | All permissions |

## 🎨 Settings Actions

### READ Level (1)
- `view_general` - View general settings
- `view_company` - View company information
- `view_system` - View system settings

### WRITE Level (2)
- `edit_appearance` - Edit theme, colors
- `edit_notifications` - Edit notification preferences
- `edit_language` - Change language settings

### FULL Level (3)
- `edit_company_info` - Edit company details
- `edit_email_settings` - Configure email
- `manage_templates` - Manage email/SMS templates

### ADMIN Level (4)
- `manage_integrations` - Third-party integrations
- `manage_api_keys` - API key management
- `manage_security` - Security settings
- `manage_backup` - Backup configuration

### SUPER_ADMIN Level (5)
- `manage_database` - Database operations
- `access_danger_zone` - Critical operations
- `delete_all_data` - Destructive actions

## 🔧 Role Configuration

### Add Levels to Role

```typescript
// In role data
{
  "id": "role_123",
  "name": "Sales Manager",
  "moduleLevels": {
    "contacts": 3,    // FULL access
    "deals": 3,       // FULL access
    "reports": 1,     // READ only
    "settings": 2,    // WRITE access
    "users": 1        // READ only
  }
}
```

### Update Role with Levels

```typescript
import { RoleService } from '@/core/data/user-service';

const roleService = new RoleService();

await roleService.updateRole(roleId, {
  moduleLevels: {
    contacts: PermissionLevel.FULL,
    settings: PermissionLevel.ADMIN,
    users: PermissionLevel.READ
  }
});
```

## 🧪 Testing

### Test in Browser Console

```javascript
// Get current user's permission profile
fetch('/api/permissions/profile', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log(data));

// Get level for specific module
fetch('/api/permissions/level/settings', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log(data));
```

## 📋 Checklist for New Features

- [ ] Determine required permission level (READ/WRITE/FULL/ADMIN)
- [ ] Add permission check in component using `usePermissionLevel`
- [ ] Add permission check in API route using `AdvancedPermissionService`
- [ ] Show loading state while checking permissions
- [ ] Handle "no access" case (redirect or hide UI)
- [ ] Test with different user roles
- [ ] Document required permission level

## 🎯 Common Patterns

### Pattern 1: Button Visibility

```typescript
const { canWrite } = usePermissionLevel('contacts');

return (
  <div>
    {canWrite && <button onClick={createContact}>Create</button>}
  </div>
);
```

### Pattern 2: Form Protection

```typescript
const { canFull, isLoading } = usePermissionLevel('contacts');

if (isLoading) return <Skeleton />;
if (!canFull) return <AccessDenied />;

return <EditContactForm />;
```

### Pattern 3: Feature Access

```typescript
const { hasAccess } = usePermissionLevel('settings');

if (hasAccess(PermissionLevel.ADMIN)) {
  return <AdvancedSettings />;
}

return <BasicSettings />;
```

### Pattern 4: Multiple Modules

```typescript
const { profile, hasModuleAccess } = usePermissionProfile();

const canManageUsers = hasModuleAccess('users', PermissionLevel.ADMIN);
const canViewReports = hasModuleAccess('reports', PermissionLevel.READ);
```

## ⚠️ Common Mistakes

### ❌ Not Checking on Server

```typescript
// Bad - only client check
const { canWrite } = usePermissionLevel('contacts');
if (canWrite) {
  await apiClient.post('/api/contacts', data); // No server check!
}
```

### ✅ Correct

```typescript
// Good - server validates too
const { canWrite } = usePermissionLevel('contacts');
if (canWrite) {
  // API route checks permission again
  await apiClient.post('/api/contacts', data);
}
```

### ❌ No Loading State

```typescript
// Bad - no loading
const { canAdmin } = usePermissionLevel('settings');
return canAdmin && <AdminPanel />;
```

### ✅ Correct

```typescript
// Good - handle loading
const { canAdmin, isLoading } = usePermissionLevel('settings');
if (isLoading) return <Skeleton />;
return canAdmin && <AdminPanel />;
```

## 🔗 API Endpoints

### GET /api/permissions/level/[module]

Returns user's level for specific module.

```bash
curl http://localhost:3000/api/permissions/level/settings \
  -H "Cookie: auth-token=..." \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "data": {
    "level": 4,
    "module": "settings",
    "levelName": "Administrator"
  }
}
```

### GET /api/permissions/profile

Returns complete permission profile.

```bash
curl http://localhost:3000/api/permissions/profile \
  -H "Cookie: auth-token=..." \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "moduleLevels": {
      "contacts": 3,
      "settings": 4,
      "users": 1
    },
    "effectiveLevel": 4,
    "isSuperAdmin": false
  }
}
```

## 📚 Learn More

- **Full Documentation:** `docs/architecture/PERMISSION_LEVEL_SYSTEM.md`
- **Code Examples:** See hook implementations in `src/shared/hooks/`
- **API Integration:** Check `src/app/api/permissions/`

## 🆘 Need Help?

1. Check full documentation for detailed examples
2. Look at existing components using permission hooks
3. Test API endpoints in browser console
4. Verify role has `moduleLevels` defined in database

---

**Quick Reference:**
- Import hooks: `@/shared/hooks/use-permission-level`
- Import levels: `@/core/auth/permission-levels`
- Import service: `@/core/auth/advanced-permission-service`
