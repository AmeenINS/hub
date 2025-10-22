import { RolePermissionService } from '@/lib/db/user-service';

/**
 * Check if user has required permission
 */
export async function checkUserPermission(
  userId: string,
  requiredModule: string,
  requiredAction: string
): Promise<boolean> {
  const rolePermissionService = new RolePermissionService();
  
  try {
    const permissions = await rolePermissionService.getUserPermissions(userId);
    
    // Check if user has the required permission
    const hasPermission = permissions.some(
      (perm) =>
        perm.module === requiredModule &&
        perm.action === requiredAction
    );

    // Also check for admin permission (full access)
    const isAdmin = permissions.some(
      (perm) => perm.module === 'system' && perm.action === 'admin'
    );

    return hasPermission || isAdmin;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * Get user permissions for multiple modules
 */
export async function getUserModulePermissions(
  userId: string,
  modules: string[]
): Promise<Record<string, string[]>> {
  const rolePermissionService = new RolePermissionService();
  
  try {
    const permissions = await rolePermissionService.getUserPermissions(userId);
    
    // Check for admin access
    const isAdmin = permissions.some(
      (perm) => perm.module === 'system' && perm.action === 'admin'
    );

    const modulePermissions: Record<string, string[]> = {};
    
    for (const moduleName of modules) {
      if (isAdmin) {
        // Admin has all permissions
        modulePermissions[moduleName] = ['create', 'read', 'update', 'delete'];
      } else {
        // Get specific permissions for this module
        const modulePerms = permissions
          .filter((perm) => perm.module === moduleName)
          .map((perm) => perm.action);
        modulePermissions[moduleName] = modulePerms;
      }
    }

    return modulePermissions;
  } catch (error) {
    console.error('Failed to get user permissions:', error);
    return {};
  }
}

/**
 * Check if user has any permission in a module (at least read)
 */
export async function hasModuleAccess(
  userId: string,
  module: string
): Promise<boolean> {
  const rolePermissionService = new RolePermissionService();
  
  try {
    const permissions = await rolePermissionService.getUserPermissions(userId);
    
    // Check for admin access
    const isAdmin = permissions.some(
      (perm) => perm.module === 'system' && perm.action === 'admin'
    );

    if (isAdmin) return true;

    // Check if user has any permission in this module
    return permissions.some((perm) => perm.module === module);
  } catch (error) {
    console.error('Module access check failed:', error);
    return false;
  }
}
