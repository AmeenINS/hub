import { AdvancedPermissionService } from './advanced-permission-service';
import { PermissionLevel } from './permission-levels';

/**
 * Permission Compatibility Layer
 * Provides backward compatible functions for old permission checks
 * Maps to new permission level system
 *
 * @deprecated Use AdvancedPermissionService directly
 */

/**
 * Get user permissions context (backward compatible)
 * @deprecated Use AdvancedPermissionService.getUserPermissionProfile instead
 */
export async function getUserPermissionsContext(userId: string) {
  const profile = await AdvancedPermissionService.getUserPermissionProfile(userId);

  return {
    permissions: Object.entries(profile.moduleLevels).flatMap(([moduleName, level]) => {
      const actions = getLevelActions(level as PermissionLevel);
      return actions.map((action) => ({ module: moduleName, action }));
    }),
    permissionMap: Object.entries(profile.moduleLevels).reduce((acc, [moduleName, level]) => {
      acc[moduleName] = getLevelActions(level as PermissionLevel);
      return acc;
    }, {} as Record<string, string[]>),
    isSuperAdmin: profile.isSuperAdmin,
  };
}

/**
 * Check if permission map has specific permission
 * @deprecated Use AdvancedPermissionService.checkPermissionLevel instead
 */
export function hasPermission(
  permissionMap: Record<string, string[]>,
  moduleName: string,
  action: string
): boolean {
  // Check for super admin (has all permissions)
  if (permissionMap['*']?.includes('*')) {
    return true;
  }

  const moduleActions = permissionMap[moduleName] || [];
  return moduleActions.includes(action) || moduleActions.includes('*');
}

/**
 * Get actions for a permission level
 */
export function getLevelActions(level: PermissionLevel): string[] {
  switch (level) {
    case PermissionLevel.NONE:
      return [];
    case PermissionLevel.READ:
      return ['read', 'view', 'list'];
    case PermissionLevel.WRITE:
      return ['read', 'view', 'list', 'create', 'edit', 'update'];
    case PermissionLevel.FULL:
      return ['read', 'view', 'list', 'create', 'edit', 'update', 'delete', 'manage'];
    case PermissionLevel.ADMIN:
      return ['read', 'view', 'list', 'create', 'edit', 'update', 'delete', 'manage', 'configure', 'admin', 'assign-role'];
    case PermissionLevel.SUPER_ADMIN:
      return ['*'];
    default:
      return [];
  }
}
