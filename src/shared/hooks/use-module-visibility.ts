'use client';

import { useCallback } from 'react';
import { PermissionLevel } from '@/core/auth/permission-levels';
import { usePermissionProfile } from './use-permission-level';

const CRM_MODULES = [
  'crm',
  'crm_contacts',
  'crm_companies',
  'crm_leads',
  'crm_deals',
  'crm_activities',
  'crm_campaigns',
  'contacts',
  'companies',
  'leads',
  'deals',
];

const MODULE_ALIAS_MAP: Record<string, string[]> = {
  crm: CRM_MODULES,
  livetracking: ['tracking', 'liveTracking'],
  tracking: ['tracking', 'liveTracking'],
  commission: ['accounting'],
  calculator: ['calculator', 'accounting'],
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

const resolveModuleNames = (name: string | string[]) => {
  const names = Array.isArray(name) ? name : [name];
  const resolved = new Set<string>();

  names.forEach((rawName) => {
    if (!rawName) return;
    const trimmed = rawName.trim();
    if (!trimmed) return;

    const lowerKey = normalizeKey(trimmed);
    const aliases = MODULE_ALIAS_MAP[trimmed] || MODULE_ALIAS_MAP[lowerKey];

    if (aliases?.length) {
      aliases.forEach((alias) => resolved.add(alias));
    } else {
      resolved.add(trimmed);
    }
  });

  return Array.from(resolved);
};

export function useModuleVisibility() {
  const { profile } = usePermissionProfile();

  const hasAccess = useCallback(
    (moduleName: string | string[], minimumLevel: PermissionLevel = PermissionLevel.READ) => {
      if (!moduleName) return false;
      
      // Super Admin should still follow permission levels, not bypass everything
      // Only bypass if they have SUPER_ADMIN level (5) for the specific module
      
      const targets = resolveModuleNames(moduleName);
      if (!targets.length) return false;

      return targets.some((target) => {
        const level = profile.moduleLevels[target];
        return typeof level === 'number' && level >= minimumLevel;
      });
    },
    [profile.moduleLevels]
  );

  const getAccessLevel = useCallback(
    (moduleName: string | string[]) => {
      const targets = resolveModuleNames(moduleName);
      if (!targets.length) {
        return PermissionLevel.NONE;
      }

      return targets.reduce((maxLevel, target) => {
        const level = profile.moduleLevels[target] ?? PermissionLevel.NONE;
        return level > maxLevel ? level : maxLevel;
      }, PermissionLevel.NONE);
    },
    [profile.moduleLevels]
  );

  return {
    isLoading: profile.isLoading,
    hasAccess,
    getAccessLevel,
    profile,
  };
}
