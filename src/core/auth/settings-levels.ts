/**
 * Settings Module Permission Configuration
 * Maps settings actions to required permission levels
 */

import { PermissionLevel } from './permission-levels';

/**
 * Settings permission configuration
 * Each setting action is mapped to the minimum required permission level
 */
export const SETTINGS_PERMISSION_CONFIG = {
  // ============ READ LEVEL (1) ============
  // View-only access to settings
  view_general: PermissionLevel.READ,
  view_company: PermissionLevel.READ,
  view_system: PermissionLevel.READ,
  view_appearance: PermissionLevel.READ,
  view_notifications: PermissionLevel.READ,
  view_language: PermissionLevel.READ,
  view_timezone: PermissionLevel.READ,

  // ============ WRITE LEVEL (2) ============
  // Can modify personal and basic settings
  edit_appearance: PermissionLevel.WRITE,
  edit_notifications: PermissionLevel.WRITE,
  edit_language: PermissionLevel.WRITE,
  edit_timezone: PermissionLevel.WRITE,
  edit_user_preferences: PermissionLevel.WRITE,

  // ============ FULL LEVEL (3) ============
  // Can manage company-wide settings
  edit_company_info: PermissionLevel.FULL,
  edit_company_logo: PermissionLevel.FULL,
  edit_company_contact: PermissionLevel.FULL,
  edit_email_settings: PermissionLevel.FULL,
  edit_sms_settings: PermissionLevel.FULL,
  manage_templates: PermissionLevel.FULL,
  manage_custom_fields: PermissionLevel.FULL,

  // ============ ADMIN LEVEL (4) ============
  // System administration capabilities
  manage_integrations: PermissionLevel.ADMIN,
  manage_api_keys: PermissionLevel.ADMIN,
  manage_webhooks: PermissionLevel.ADMIN,
  manage_security: PermissionLevel.ADMIN,
  manage_authentication: PermissionLevel.ADMIN,
  manage_backup: PermissionLevel.ADMIN,
  manage_audit_logs: PermissionLevel.ADMIN,
  view_system_logs: PermissionLevel.ADMIN,
  manage_permissions: PermissionLevel.ADMIN,
  manage_roles: PermissionLevel.ADMIN,

  // ============ SUPER_ADMIN LEVEL (5) ============
  // Critical system operations
  manage_database: PermissionLevel.SUPER_ADMIN,
  manage_environment: PermissionLevel.SUPER_ADMIN,
  access_danger_zone: PermissionLevel.SUPER_ADMIN,
  delete_all_data: PermissionLevel.SUPER_ADMIN,
  manage_super_admins: PermissionLevel.SUPER_ADMIN,
} as const;

/**
 * Settings permission groups for UI organization
 */
export const SETTINGS_PERMISSION_GROUPS = {
  general: {
    label: 'General Settings',
    actions: [
      'view_general',
      'edit_appearance',
      'edit_language',
      'edit_timezone',
      'edit_user_preferences',
    ],
    requiredLevel: PermissionLevel.WRITE,
  },
  company: {
    label: 'Company Settings',
    actions: [
      'view_company',
      'edit_company_info',
      'edit_company_logo',
      'edit_company_contact',
    ],
    requiredLevel: PermissionLevel.FULL,
  },
  communication: {
    label: 'Communication Settings',
    actions: [
      'edit_email_settings',
      'edit_sms_settings',
      'edit_notifications',
      'manage_templates',
    ],
    requiredLevel: PermissionLevel.FULL,
  },
  integration: {
    label: 'Integrations & API',
    actions: [
      'manage_integrations',
      'manage_api_keys',
      'manage_webhooks',
    ],
    requiredLevel: PermissionLevel.ADMIN,
  },
  security: {
    label: 'Security & Access',
    actions: [
      'manage_security',
      'manage_authentication',
      'manage_permissions',
      'manage_roles',
      'manage_audit_logs',
    ],
    requiredLevel: PermissionLevel.ADMIN,
  },
  system: {
    label: 'System Administration',
    actions: [
      'view_system',
      'view_system_logs',
      'manage_backup',
      'manage_database',
      'manage_environment',
    ],
    requiredLevel: PermissionLevel.ADMIN,
  },
  dangerZone: {
    label: 'Danger Zone',
    actions: [
      'access_danger_zone',
      'delete_all_data',
      'manage_super_admins',
    ],
    requiredLevel: PermissionLevel.SUPER_ADMIN,
  },
} as const;

/**
 * Get required permission level for a settings action
 * @param action - Settings action name
 * @returns Required permission level
 */
export function getRequiredLevelForSettings(action: string): PermissionLevel {
  return SETTINGS_PERMISSION_CONFIG[action as keyof typeof SETTINGS_PERMISSION_CONFIG] || PermissionLevel.NONE;
}

/**
 * Check if user's level allows a specific settings action
 * @param userLevel - User's permission level for settings module
 * @param action - Settings action to check
 * @returns True if user level allows the action
 */
export function canAccessSettingsAction(
  userLevel: PermissionLevel,
  action: string
): boolean {
  const requiredLevel = getRequiredLevelForSettings(action);
  return userLevel >= requiredLevel;
}

/**
 * Get all settings actions available at a permission level
 * @param userLevel - User's permission level
 * @returns Array of available action names
 */
export function getAvailableSettingsActions(userLevel: PermissionLevel): string[] {
  return Object.entries(SETTINGS_PERMISSION_CONFIG)
    .filter(([, requiredLevel]) => userLevel >= requiredLevel)
    .map(([action]) => action);
}

/**
 * Get settings groups accessible at a permission level
 * @param userLevel - User's permission level
 * @returns Array of accessible group names
 */
export function getAccessibleSettingsGroups(userLevel: PermissionLevel): string[] {
  return Object.entries(SETTINGS_PERMISSION_GROUPS)
    .filter(([, group]) => userLevel >= group.requiredLevel)
    .map(([groupName]) => groupName);
}
