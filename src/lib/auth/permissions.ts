import { PermissionService, RolePermissionService } from '@/lib/db/user-service';
import { hasPermission } from '@/lib/permissions-helper';
import { isSuperAdmin, mapPermissionsByModule } from '@/lib/permissions-helper';
import type { Permission } from '@/types/database';

const rolePermissionService = new RolePermissionService();
const permissionService = new PermissionService();

export interface UserPermissionContext {
  permissions: Permission[];
  permissionMap: Record<string, string[]>;
  isSuperAdmin: boolean;
}

async function getUserPermissionContext(userId: string): Promise<UserPermissionContext> {
  const permissions = await rolePermissionService.getUserPermissions(userId);
  const permissionMap = mapPermissionsByModule(permissions);

  return {
    permissions,
    permissionMap,
    isSuperAdmin: isSuperAdmin(permissionMap),
  };
}

/**
 * Check if user has required permission
 */
export async function checkUserPermission(
  userId: string,
  requiredModule: string,
  requiredAction: string
): Promise<boolean> {
  try {
    const { permissionMap, isSuperAdmin } = await getUserPermissionContext(userId);

    if (isSuperAdmin) {
      return true;
    }

    return hasPermission(permissionMap, requiredModule, requiredAction);
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
  try {
    const { permissionMap, isSuperAdmin, permissions } = await getUserPermissionContext(userId);

    const modulePermissions: Record<string, string[]> = {};

    for (const moduleName of modules) {
      if (isSuperAdmin) {
        const modulePerms = await permissionService.getPermissionsByModule(moduleName);
        modulePermissions[moduleName] = getNormalizedActions(
          modulePerms.map((perm) => perm.action)
        );
        continue;
      }

      const actions = permissions
        .filter((perm) => perm.module === moduleName)
        .map((perm) => perm.action);

      if (actions.length > 0) {
        modulePermissions[moduleName] = getNormalizedActions(actions);
      } else {
        modulePermissions[moduleName] = getNormalizedActions(permissionMap[moduleName] || []);
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
  try {
    const { permissionMap, isSuperAdmin } = await getUserPermissionContext(userId);

    if (isSuperAdmin) {
      return true;
    }

    return (permissionMap[module] || []).length > 0;
  } catch (error) {
    console.error('Module access check failed:', error);
    return false;
  }
}

function getNormalizedActions(actions: string[]): string[] {
  const unique = Array.from(new Set(actions));

  if (unique.includes('read') && !unique.includes('view')) {
    unique.push('view');
  }

  if (unique.includes('update') && !unique.includes('edit')) {
    unique.push('edit');
  }

  return unique;
}

export async function getUserPermissionsContext(userId: string): Promise<UserPermissionContext> {
  return getUserPermissionContext(userId);
}
