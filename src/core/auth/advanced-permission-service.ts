/**
 * Advanced Permission Service
 * Integrates permission levels with existing permission system
 * Provides backward compatibility and migration support
 */

import { PermissionLevel, hasPermissionForAction, hasMinimumLevel } from './permission-levels';
import { canAccessSettingsAction } from './settings-levels';
import { RolePermissionService, UserRoleService, RoleService } from '@/core/data/user-service';

const rolePermissionService = new RolePermissionService();

/**
 * User's complete permission profile
 */
export interface PermissionProfile {
  userId: string;
  
  /** Module-specific permission levels */
  moduleLevels: Record<string, PermissionLevel>;
  
  /** Effective permission level (highest across all modules) */
  effectiveLevel: PermissionLevel;
  
  /** Is user a super admin */
  isSuperAdmin: boolean;
  
  /** Legacy permissions for backward compatibility */
  legacyPermissions?: Record<string, string[]>;
}

/**
 * Advanced permission service with level-based checks
 */
export class AdvancedPermissionService {
  /**
   * Get user's permission profile with module levels
   * @param userId - User ID
   * @returns Complete permission profile
   */
  static async getUserPermissionProfile(userId: string): Promise<PermissionProfile> {
    try {
      // Get user's roles and permissions
      const permissions = await rolePermissionService.getUserPermissions(userId);
      
      // Compute module levels
      const moduleLevels = await this.computeEffectiveLevels(userId, permissions);
      
      // Determine if super admin
      const isSuperAdmin = Object.values(moduleLevels).some(
        level => level === PermissionLevel.SUPER_ADMIN
      );
      
      // Calculate effective level (highest level across all modules)
      const effectiveLevel = isSuperAdmin
        ? PermissionLevel.SUPER_ADMIN
        : Math.max(...Object.values(moduleLevels), PermissionLevel.NONE);
      
      // Build legacy permission map for backward compatibility
      const legacyPermissions: Record<string, string[]> = {};
      permissions.forEach(perm => {
        if (!legacyPermissions[perm.module]) {
          legacyPermissions[perm.module] = [];
        }
        legacyPermissions[perm.module].push(perm.action);
      });
      
      return {
        userId,
        moduleLevels,
        effectiveLevel: effectiveLevel as PermissionLevel,
        isSuperAdmin,
        legacyPermissions,
      };
    } catch (error) {
      console.error('Failed to get user permission profile:', error);
      return {
        userId,
        moduleLevels: {},
        effectiveLevel: PermissionLevel.NONE,
        isSuperAdmin: false,
      };
    }
  }

  /**
   * Compute effective permission levels for all user's modules
   * Uses role.moduleLevels if available, falls back to computing from permissions
   */
  private static async computeEffectiveLevels(
    userId: string,
    permissions: Array<{ module: string; action: string }>
  ): Promise<Record<string, PermissionLevel>> {
    try {
      const userRoleService = new UserRoleService();
      const roleService = new RoleService();
      
      // Get user's roles to check for module levels
      const userRoles = await userRoleService.getUserRolesByUser(userId);
      const roleIds = userRoles.map(ur => ur.roleId);
      
      const moduleLevels: Record<string, PermissionLevel> = {};
      
      // First, try to use moduleLevels from roles
      for (const roleId of roleIds) {
        const role = await roleService.getRoleById(roleId);
        if (role?.moduleLevels) {
          const levels = typeof role.moduleLevels === 'string'
            ? JSON.parse(role.moduleLevels)
            : role.moduleLevels;
          
          // Merge with existing, keeping highest level
          Object.entries(levels).forEach(([moduleName, level]) => {
            const currentLevel = moduleLevels[moduleName] || PermissionLevel.NONE;
            moduleLevels[moduleName] = Math.max(currentLevel, level as number) as PermissionLevel;
          });
        }
      }
      
      // For modules without explicit levels, compute from permissions
      const moduleNames = [...new Set(permissions.map(p => p.module))];
      for (const moduleName of moduleNames) {
        if (moduleLevels[moduleName] === undefined) {
          const moduleActions = permissions
            .filter(p => p.module === moduleName)
            .map(p => p.action);
          
          // Determine level based on actions
          moduleLevels[moduleName] = this.inferLevelFromActions(moduleActions);
        }
      }
      
      return moduleLevels;
    } catch (error) {
      console.error('Failed to compute effective levels:', error);
      return {};
    }
  }

  /**
   * Infer permission level from available actions
   */
  private static inferLevelFromActions(actions: string[]): PermissionLevel {
    if (actions.length === 0) return PermissionLevel.NONE;
    if (actions.includes('*')) return PermissionLevel.SUPER_ADMIN;
    
    // Check for admin-level actions
    if (actions.some(a => ['configure', 'admin', 'manage_all', 'restore'].includes(a))) {
      return PermissionLevel.ADMIN;
    }
    
    // Check for full-level actions
    if (actions.some(a => ['delete', 'manage', 'assign', 'transfer'].includes(a))) {
      return PermissionLevel.FULL;
    }
    
    // Check for write-level actions
    if (actions.some(a => ['create', 'edit', 'update', 'duplicate'].includes(a))) {
      return PermissionLevel.WRITE;
    }
    
    // If they have any actions, assume read level
    return PermissionLevel.READ;
  }

  /**
   * Check if user has permission for an action in a module
   * @param userId - User ID
   * @param module - Module name
   * @param action - Action to check
   * @returns True if user has permission
   */
  static async checkPermissionLevel(
    userId: string,
    module: string,
    action: string
  ): Promise<boolean> {
    try {
      const profile = await this.getUserPermissionProfile(userId);
      
      // Super admins have all permissions
      if (profile.isSuperAdmin) {
        return true;
      }
      
      // Get user's level for this module
      const userLevel = profile.moduleLevels[module] || PermissionLevel.NONE;
      
      // Check if level allows this action
      return hasPermissionForAction(userLevel, action);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Check if user can access settings action
   * @param userId - User ID
   * @param action - Settings action (e.g., 'edit_company_info')
   * @returns True if user has permission
   */
  static async checkSettingsPermission(
    userId: string,
    action: string
  ): Promise<boolean> {
    try {
      const profile = await this.getUserPermissionProfile(userId);
      
      // Super admins have all permissions
      if (profile.isSuperAdmin) {
        return true;
      }
      
      // Get user's level for settings module
      const settingsLevel = profile.moduleLevels.settings || PermissionLevel.NONE;
      
      // Check if level allows this settings action
      return canAccessSettingsAction(settingsLevel, action);
    } catch (error) {
      console.error('Settings permission check failed:', error);
      return false;
    }
  }

  /**
   * Check if user has minimum level for a module
   * @param userId - User ID
   * @param module - Module name
   * @param minimumLevel - Minimum required level
   * @returns True if user meets or exceeds minimum level
   */
  static async hasMinimumLevel(
    userId: string,
    module: string,
    minimumLevel: PermissionLevel
  ): Promise<boolean> {
    try {
      const profile = await this.getUserPermissionProfile(userId);
      
      if (profile.isSuperAdmin) {
        return true;
      }
      
      const userLevel = profile.moduleLevels[module] || PermissionLevel.NONE;
      return hasMinimumLevel(userLevel, minimumLevel);
    } catch (error) {
      console.error('Level check failed:', error);
      return false;
    }
  }

  /**
   * Get user's permission level for a module
   * @param userId - User ID
   * @param module - Module name
   * @returns Permission level
   */
  static async getUserModuleLevel(
    userId: string,
    module: string
  ): Promise<PermissionLevel> {
    try {
      const profile = await this.getUserPermissionProfile(userId);
      return profile.moduleLevels[module] || PermissionLevel.NONE;
    } catch (error) {
      console.error('Failed to get user module level:', error);
      return PermissionLevel.NONE;
    }
  }
}
