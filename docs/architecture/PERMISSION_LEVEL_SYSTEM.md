# Permission Level System Architecture

## Overview

The Permission Level System is a professional, hierarchical permission management system that replaces the old boolean-based permission checks. It provides 6 distinct permission levels from NONE to SUPER_ADMIN, with each higher level inheriting all capabilities of lower levels.

## System Architecture

### Core Components

```
src/core/auth/
├── permission-levels.ts           # Core level definitions and utilities
├── settings-levels.ts             # Settings-specific configuration
└── advanced-permission-service.ts # Permission checking service

src/shared/hooks/
└── use-permission-level.ts        # React hooks for components

src/app/api/permissions/
├── level/[module]/route.ts        # Get level for specific module
└── profile/route.ts               # Get complete permission profile
```

## Permission Levels

### Hierarchy (0-5)

```typescript
enum PermissionLevel {
  NONE = 0,         // No access
  READ = 1,         // View only
  WRITE = 2,        // Create & edit
  FULL = 3,         // Delete & manage
  ADMIN = 4,        // Configure & admin
  SUPER_ADMIN = 5   // Complete control
}
```

### Level Capabilities

**NONE (0)**
- No access to module
- Cannot view any data

**READ (1)**
- View and list data
- Search and filter
- Export data
- Actions: `view`, `list`, `read`, `search`, `export`

**WRITE (2)**
- All READ permissions
- Create new records
- Edit existing records
- Duplicate records
- Actions: `create`, `edit`, `update`, `duplicate`

**FULL (3)**
- All WRITE permissions
- Delete records
- Manage module features
- Assign and transfer records
- Actions: `delete`, `manage`, `assign`, `transfer`

**ADMIN (4)**
- All FULL permissions
- Configure module settings
- Manage all records
- Restore deleted items
- View audit logs
- Actions: `configure`, `admin`, `manage_all`, `restore`

**SUPER_ADMIN (5)**
- All permissions across all modules
- System-wide administration
- Critical operations (database, environment)
- Special action: `*` (wildcard for all)

## Data Model

### Role Schema Update

```typescript
interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  moduleLevels?: Record<string, number>; // NEW: Module permission levels
  createdAt: string;
  updatedAt: string;
}
```

### Example Role Data

```json
{
  "id": "role_123",
  "name": "Sales Manager",
  "moduleLevels": {
    "contacts": 3,    // FULL access to contacts
    "deals": 3,       // FULL access to deals
    "reports": 1,     // READ access to reports
    "settings": 2,    // WRITE access to settings
    "users": 1        // READ access to users
  }
}
```

## Settings Module Configuration

### Permission Mapping

Settings actions are mapped to required permission levels:

```typescript
// Level 1: READ
view_general, view_company, view_system

// Level 2: WRITE
edit_appearance, edit_notifications, edit_language

// Level 3: FULL
edit_company_info, edit_email_settings, manage_templates

// Level 4: ADMIN
manage_integrations, manage_security, manage_backup

// Level 5: SUPER_ADMIN
manage_database, access_danger_zone, delete_all_data
```

### Settings Groups

Settings are organized into logical groups:

1. **General Settings** (WRITE)
   - Appearance, language, timezone
   - User preferences

2. **Company Settings** (FULL)
   - Company info, logo, contact details

3. **Communication** (FULL)
   - Email/SMS settings
   - Notification templates

4. **Integrations** (ADMIN)
   - Third-party integrations
   - API keys, webhooks

5. **Security** (ADMIN)
   - Authentication, permissions
   - Audit logs, backup

6. **System** (ADMIN/SUPER_ADMIN)
   - System logs, database
   - Environment variables

7. **Danger Zone** (SUPER_ADMIN)
   - Delete all data
   - Critical operations

## Usage Examples

### In Components (React Hooks)

```typescript
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { PermissionLevel } from '@/core/auth/permission-levels';

function SettingsPage() {
  const { level, canAdmin, hasAccess, isLoading } = usePermissionLevel('settings');

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div>
      {/* Show to READ and above */}
      {hasAccess(PermissionLevel.READ) && (
        <ViewSettings />
      )}

      {/* Show to FULL and above */}
      {hasAccess(PermissionLevel.FULL) && (
        <CompanySettings />
      )}

      {/* Show to ADMIN only */}
      {canAdmin && (
        <AdvancedSettings />
      )}
    </div>
  );
}
```

### Settings-Specific Hook

```typescript
import { useSettingsPermissions } from '@/shared/hooks/use-permission-level';

function SettingsPanel() {
  const {
    canEditCompany,
    canManageIntegrations,
    canAccessDangerZone,
    isLoading
  } = useSettingsPermissions();

  if (isLoading) return <Loader />;

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

export async function POST(request: NextRequest) {
  const decoded = JWTService.verifyToken(token);
  
  // Check if user has minimum level
  const hasAccess = await AdvancedPermissionService.hasMinimumLevel(
    decoded.userId,
    'settings',
    PermissionLevel.ADMIN
  );
  
  if (!hasAccess) {
    return NextResponse.json(
      { success: false, message: 'Access denied' },
      { status: 403 }
    );
  }

  // Process request...
}
```

### Settings Action Check

```typescript
export async function PUT(request: NextRequest) {
  const decoded = JWTService.verifyToken(token);
  
  // Check specific settings action
  const canEdit = await AdvancedPermissionService.checkSettingsPermission(
    decoded.userId,
    'edit_company_info'
  );
  
  if (!canEdit) {
    return NextResponse.json(
      { success: false, message: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Update company info...
}
```

### Get Complete Profile

```typescript
const profile = await AdvancedPermissionService.getUserPermissionProfile(userId);

console.log(profile);
/*
{
  userId: "user_123",
  moduleLevels: {
    contacts: 3,    // FULL
    settings: 4,    // ADMIN
    users: 1        // READ
  },
  effectiveLevel: 4,  // Highest level
  isSuperAdmin: false,
  legacyPermissions: { ... }  // For backward compatibility
}
*/
```

## API Endpoints

### GET /api/permissions/level/[module]

Get user's permission level for a specific module.

**Response:**
```json
{
  "success": true,
  "data": {
    "level": 3,
    "module": "settings",
    "levelName": "Full Access"
  }
}
```

### GET /api/permissions/profile

Get user's complete permission profile.

**Response:**
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
    "isSuperAdmin": false,
    "legacyPermissions": { ... }
  }
}
```

## Migration Strategy

### Phase 1: Coexistence (Current)

- New permission level system implemented
- Old boolean permission system still works
- Both can be used simultaneously
- `AdvancedPermissionService` checks `moduleLevels` first, falls back to legacy

### Phase 2: Gradual Migration

1. Add `moduleLevels` to existing roles
2. Update components to use new hooks
3. Update API routes to use new service
4. Test thoroughly with real users

### Phase 3: Legacy Removal

1. Remove old permission IDs from roles
2. Remove legacy permission check functions
3. Keep only module levels
4. Clean up unused code

## Backward Compatibility

The system maintains backward compatibility during migration:

1. **Profile includes legacy permissions**
   ```typescript
   const profile = await getUserPermissionProfile(userId);
   profile.legacyPermissions // Old permission map for compatibility
   ```

2. **Level inference from actions**
   ```typescript
   // If role has no moduleLevels, infer from permissions
   const actions = ['view', 'create', 'edit'];
   const level = inferLevelFromActions(actions); // Returns WRITE
   ```

3. **Dual checking**
   ```typescript
   // Service checks moduleLevels first, then falls back to legacy
   const hasAccess = await checkPermissionLevel(userId, module, action);
   ```

## Testing

### Test Permission Levels

```typescript
// Test hierarchical access
describe('Permission Levels', () => {
  it('WRITE includes READ actions', () => {
    expect(hasPermissionForAction(PermissionLevel.WRITE, 'view')).toBe(true);
    expect(hasPermissionForAction(PermissionLevel.WRITE, 'create')).toBe(true);
  });

  it('FULL includes WRITE actions', () => {
    expect(hasPermissionForAction(PermissionLevel.FULL, 'edit')).toBe(true);
    expect(hasPermissionForAction(PermissionLevel.FULL, 'delete')).toBe(true);
  });

  it('SUPER_ADMIN has all permissions', () => {
    expect(hasPermissionForAction(PermissionLevel.SUPER_ADMIN, 'anything')).toBe(true);
  });
});
```

### Test Settings Configuration

```typescript
describe('Settings Permissions', () => {
  it('requires FULL for company info', () => {
    expect(getRequiredLevelForSettings('edit_company_info')).toBe(PermissionLevel.FULL);
  });

  it('requires ADMIN for integrations', () => {
    expect(getRequiredLevelForSettings('manage_integrations')).toBe(PermissionLevel.ADMIN);
  });
});
```

## Best Practices

### 1. Always Check Permissions Before Rendering

```typescript
// ✅ Good - Check before render
const { canAdmin } = usePermissionLevel('settings');
return canAdmin ? <AdminPanel /> : null;

// ❌ Bad - Render then hide
return <AdminPanel visible={canAdmin} />;
```

### 2. Use Specific Hooks

```typescript
// ✅ Good - Use specific hook
const { canEditCompany } = useSettingsPermissions();

// ❌ Bad - Generic check
const { hasAccess } = usePermissionLevel('settings');
```

### 3. Handle Loading States

```typescript
// ✅ Good - Show loading
const { level, isLoading } = usePermissionLevel('settings');
if (isLoading) return <Skeleton />;

// ❌ Bad - No loading state
const { level } = usePermissionLevel('settings');
return <Settings />;
```

### 4. Use Minimum Level Checks

```typescript
// ✅ Good - Check minimum level
const hasAccess = await hasMinimumLevel(userId, module, PermissionLevel.ADMIN);

// ❌ Bad - Check exact level
const level = await getUserModuleLevel(userId, module);
if (level === PermissionLevel.ADMIN) { ... }
```

## Security Considerations

### 1. Server-Side Validation

Always validate permissions on the server, never trust client-side checks:

```typescript
// API route must check permissions
export async function POST(request: NextRequest) {
  const hasAccess = await AdvancedPermissionService.checkPermissionLevel(
    userId,
    module,
    action
  );
  
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Process request
}
```

### 2. Super Admin Checks

Super admins bypass all permission checks:

```typescript
if (profile.isSuperAdmin) {
  return true; // Has all permissions
}
```

### 3. Token Validation

Always verify JWT tokens before permission checks:

```typescript
const decoded = JWTService.verifyToken(token);
if (!decoded) {
  return { error: 'Unauthorized' };
}
```

## Troubleshooting

### User Has No Access

1. Check if user has assigned role
2. Check if role has `moduleLevels` defined
3. Check if module name matches exactly
4. Verify token is valid

### Level Not Working

1. Clear browser cache/cookies
2. Re-login to get fresh token
3. Check API endpoint returns correct level
4. Verify role `moduleLevels` in database

### Migration Issues

1. Ensure backward compatibility is active
2. Check both `moduleLevels` and legacy permissions
3. Run migration script to add levels to roles
4. Test with different user roles

## Future Enhancements

1. **Dynamic Level Configuration**
   - Allow admins to define custom levels
   - Per-module level customization

2. **Time-Based Permissions**
   - Temporary elevated access
   - Scheduled permission changes

3. **Resource-Specific Levels**
   - Different levels for different records
   - Owner-based access control

4. **Audit Trail**
   - Log all permission checks
   - Track level changes over time

5. **Permission Templates**
   - Predefined level sets
   - Quick role creation

---

**Documentation Version:** 1.0.0  
**Last Updated:** 2024  
**Author:** GitHub Copilot following Ameen INS Hub standards
