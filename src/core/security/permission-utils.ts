/**
 * Permission Utils Compatibility
 * Provides backward compatible utility functions
 * 
 * @deprecated Use AdvancedPermissionService directly
 */

/**
 * Check if user is super admin from permission map
 */
export function isSuperAdmin(permissionMap: Record<string, string[]>): boolean {
  // Check if has super admin marker
  return permissionMap['*']?.includes('*') || false;
}

/**
 * Check if user has access to a module
 */
export function hasModuleAccess(
  permissionMap: Record<string, string[]>,
  moduleName: string
): boolean {
  // Super admin has access to everything
  if (isSuperAdmin(permissionMap)) {
    return true;
  }
  
  // Check if module has any permissions
  const modulePerms = permissionMap[moduleName];
  return modulePerms !== undefined && modulePerms.length > 0;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissionMap: Record<string, string[]>,
  moduleName: string,
  action: string
): boolean {
  // Super admin has all permissions
  if (isSuperAdmin(permissionMap)) {
    return true;
  }
  
  const moduleActions = permissionMap[moduleName] || [];
  return moduleActions.includes(action) || moduleActions.includes('*');
}

/**
 * Map permissions by module
 */
export function mapPermissionsByModule(
  permissions: Array<{ module: string; action: string }>
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  
  for (const perm of permissions) {
    if (!map[perm.module]) {
      map[perm.module] = [];
    }
    if (!map[perm.module].includes(perm.action)) {
      map[perm.module].push(perm.action);
    }
  }
  
  return map;
}
