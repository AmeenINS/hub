/**
 * Permission Level Hooks
 * React hooks for checking permission levels in components
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/shared/state/auth-store';
import { apiClient } from '@/core/api/client';
import { PermissionLevel } from '@/core/auth/permission-levels';

/**
 * Result from usePermissionLevel hook
 */
export interface UsePermissionLevelResult {
  /** User's permission level for this module */
  level: PermissionLevel;
  
  /** Is data still loading */
  isLoading: boolean;
  
  /** Can view/read data (READ or higher) */
  canView: boolean;
  
  /** Can create/edit data (WRITE or higher) */
  canWrite: boolean;
  
  /** Can delete and manage (FULL or higher) */
  canFull: boolean;
  
  /** Can configure module (ADMIN or higher) */
  canAdmin: boolean;
  
  /** Check if user has specific level or higher */
  hasAccess: (requiredLevel: PermissionLevel) => boolean;
}

/**
 * Hook to get user's permission level for a module
 * @param module - Module name (e.g., 'settings', 'contacts', 'users')
 * @returns Permission level and convenience flags
 * 
 * @example
 * const { level, canAdmin, hasAccess } = usePermissionLevel('settings');
 * 
 * if (canAdmin) {
 *   return <AdvancedSettings />;
 * }
 * 
 * if (hasAccess(PermissionLevel.FULL)) {
 *   return <DeleteButton />;
 * }
 */
export function usePermissionLevel(module: string): UsePermissionLevelResult {
  const { user } = useAuthStore();
  const [level, setLevel] = useState<PermissionLevel>(PermissionLevel.NONE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissionLevel() {
      if (!user) {
        setLevel(PermissionLevel.NONE);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiClient.get<{
          level: PermissionLevel;
          module: string;
          levelName: string;
        }>(`/api/permissions/level/${module}`);

        if (response.success && response.data) {
          setLevel(response.data.level);
        } else {
          setLevel(PermissionLevel.NONE);
        }
      } catch (error) {
        console.error('Failed to fetch permission level:', error);
        setLevel(PermissionLevel.NONE);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPermissionLevel();
  }, [user, module]);

  return {
    level,
    isLoading,
    canView: level >= PermissionLevel.READ,
    canWrite: level >= PermissionLevel.WRITE,
    canFull: level >= PermissionLevel.FULL,
    canAdmin: level >= PermissionLevel.ADMIN,
    hasAccess: (requiredLevel: PermissionLevel) => level >= requiredLevel,
  };
}

/**
 * Complete permission profile for user
 */
export interface PermissionProfile {
  /** Module name to permission level mapping */
  moduleLevels: Record<string, PermissionLevel>;
  
  /** Is user a super admin */
  isSuperAdmin: boolean;
  
  /** Highest permission level across all modules */
  effectiveLevel: PermissionLevel;
  
  /** Is data still loading */
  isLoading: boolean;
}

/**
 * Hook to get user's complete permission profile
 * @returns Complete permission profile with all module levels
 * 
 * @example
 * const { profile, getModuleLevel, hasModuleAccess } = usePermissionProfile();
 * 
 * const settingsLevel = getModuleLevel('settings');
 * if (hasModuleAccess('users', PermissionLevel.ADMIN)) {
 *   // User is admin for users module
 * }
 */
export function usePermissionProfile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<PermissionProfile>({
    moduleLevels: {},
    isSuperAdmin: false,
    effectiveLevel: PermissionLevel.NONE,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile({
          moduleLevels: {},
          isSuperAdmin: false,
          effectiveLevel: PermissionLevel.NONE,
          isLoading: false,
        });
        return;
      }

      try {
        const response = await apiClient.get<{
          userId: string;
          moduleLevels: Record<string, PermissionLevel>;
          effectiveLevel: PermissionLevel;
          isSuperAdmin: boolean;
        }>('/api/permissions/profile');

        if (response.success && response.data) {
          setProfile({
            ...response.data,
            isLoading: false,
          });
        } else {
          setProfile({
            moduleLevels: {},
            isSuperAdmin: false,
            effectiveLevel: PermissionLevel.NONE,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch permission profile:', error);
        setProfile({
          moduleLevels: {},
          isSuperAdmin: false,
          effectiveLevel: PermissionLevel.NONE,
          isLoading: false,
        });
      }
    }

    fetchProfile();
  }, [user]);

  return {
    profile,
    
    /** Get permission level for a specific module */
    getModuleLevel: (module: string): PermissionLevel => {
      return profile.moduleLevels[module] || PermissionLevel.NONE;
    },
    
    /** Check if user has minimum level for a module */
    hasModuleAccess: (module: string, minimumLevel: PermissionLevel): boolean => {
      const moduleLevel = profile.moduleLevels[module] || PermissionLevel.NONE;
      return moduleLevel >= minimumLevel;
    },
  };
}

/**
 * Settings-specific permission checks
 */
export interface UseSettingsPermissionsResult {
  /** Is data still loading */
  isLoading: boolean;
  
  /** Can view general settings */
  canViewGeneral: boolean;
  
  /** Can edit appearance/language */
  canEditAppearance: boolean;
  
  /** Can edit company information */
  canEditCompany: boolean;
  
  /** Can manage integrations and API keys */
  canManageIntegrations: boolean;
  
  /** Can manage security settings */
  canManageSecurity: boolean;
  
  /** Can access danger zone (delete all data, etc.) */
  canAccessDangerZone: boolean;
  
  /** User's permission level for settings */
  settingsLevel: PermissionLevel;
}

/**
 * Hook for settings-specific permissions
 * @returns Convenience flags for common settings permissions
 * 
 * @example
 * const { canEditCompany, canManageIntegrations, isLoading } = useSettingsPermissions();
 * 
 * if (isLoading) return <Loader />;
 * 
 * return (
 *   <div>
 *     {canEditCompany && <CompanySettings />}
 *     {canManageIntegrations && <IntegrationsPanel />}
 *   </div>
 * );
 */
export function useSettingsPermissions(): UseSettingsPermissionsResult {
  const { level, isLoading } = usePermissionLevel('settings');

  return {
    isLoading,
    settingsLevel: level,
    canViewGeneral: level >= PermissionLevel.READ,
    canEditAppearance: level >= PermissionLevel.WRITE,
    canEditCompany: level >= PermissionLevel.FULL,
    canManageIntegrations: level >= PermissionLevel.ADMIN,
    canManageSecurity: level >= PermissionLevel.ADMIN,
    canAccessDangerZone: level >= PermissionLevel.SUPER_ADMIN,
  };
}
