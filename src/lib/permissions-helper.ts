/**
 * Privileges that we treat as "full admin" access.
 * Having all of these means the user can administer the entire system.
 */
const ADMIN_PRIVILEGE_REQUIREMENTS: Array<{ module: string; action: string }> = [
  { module: 'users', action: 'assign-role' },
  { module: 'permissions', action: 'assign' },
  { module: 'roles', action: 'create' },
  { module: 'settings', action: 'update' },
];

/**
 * Check if user is super admin
 * Super admin has system:admin permission
 * or the equivalent full administrator privilege set.
 */
export function isSuperAdmin(permissions: Record<string, string[]>): boolean {
  if (permissions['system']?.includes('admin')) {
    return true;
  }

  const hasFullAdminPrivileges = ADMIN_PRIVILEGE_REQUIREMENTS.every(({ module, action }) =>
    permissions[module]?.includes(action)
  );

  return hasFullAdminPrivileges;
}

/**
 * Get effective permissions for a module
 * If user is super admin, return all permissions
 */
export function getModulePermissions(
  permissions: Record<string, string[]>,
  module: string
): string[] {
  if (isSuperAdmin(permissions)) {
    // Super admin has all permissions
    return ['create', 'read', 'update', 'delete', 'view', 'edit'];
  }
  
  return permissions[module] || [];
}

/**
 * Convert a flat permission list into a module -> actions map
 */
export function mapPermissionsByModule(
  permissions: Array<{ module: string; action: string }>
): Record<string, string[]> {
  return permissions.reduce<Record<string, string[]>>((acc, permission) => {
    const { module, action } = permission;
    if (!acc[module]) {
      acc[module] = [];
    }

    if (!acc[module].includes(action)) {
      acc[module].push(action);
    }

    return acc;
  }, {});
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  permissions: Record<string, string[]>,
  module: string,
  action: string
): boolean {
  if (isSuperAdmin(permissions)) {
    return true; // Super admin has all permissions
  }
  
  const modulePermissions = permissions[module] || [];
  
  // Map action aliases
  const actionMap: Record<string, string[]> = {
    'view': ['read', 'view'],
    'read': ['read', 'view'],
    'edit': ['update', 'edit'],
    'update': ['update', 'edit'],
  };
  
  const allowedActions = actionMap[action] || [action];
  return allowedActions.some(a => modulePermissions.includes(a));
}

/**
 * Check if user has access to a module (has any permission)
 */
export function hasModuleAccess(
  permissions: Record<string, string[]>,
  module: string
): boolean {
  if (isSuperAdmin(permissions)) {
    return true; // Super admin has access to all modules
  }
  
  return (permissions[module] || []).length > 0;
}
