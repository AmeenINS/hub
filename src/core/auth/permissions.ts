import { AdvancedPermissionService } from './advanced-permission-service';
import { PermissionLevel } from './permission-levels';
import { getLevelActions } from './permissions-compat';

/**
 * Backwards-compatible function used by legacy routes.
 * Returns a mapping of requested modules to action arrays.
 */
export async function getUserModulePermissions(userId: string, modules: string[]) {
  const profile = await AdvancedPermissionService.getUserPermissionProfile(userId);
  const result: Record<string, string[]> = {};

  for (const m of modules) {
    const level = profile.moduleLevels[m] ?? PermissionLevel.NONE;
    result[m] = getLevelActions(level as PermissionLevel);
  }



  return result;
}

export { getUserPermissionsContext, hasPermission } from './permissions-compat';
