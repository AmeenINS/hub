/**
 * Permission Level System
 * Professional hierarchical permission system with 6 levels
 * Higher levels automatically inherit all permissions from lower levels
 */

/**
 * Permission levels - hierarchical from 0 to 5
 * Each higher level includes all permissions of lower levels
 */
export enum PermissionLevel {
  /** No access to the module */
  NONE = 0,
  
  /** Read-only access - can view and list data */
  READ = 1,
  
  /** Write access - can create and edit records */
  WRITE = 2,
  
  /** Full access - can delete and manage module features */
  FULL = 3,
  
  /** Admin access - can configure module settings */
  ADMIN = 4,
  
  /** Super admin - complete control over everything */
  SUPER_ADMIN = 5,
}

/**
 * Human-readable names for permission levels
 */
export const PermissionLevelNames: Record<PermissionLevel, string> = {
  [PermissionLevel.NONE]: 'No Access',
  [PermissionLevel.READ]: 'Read Only',
  [PermissionLevel.WRITE]: 'Read & Write',
  [PermissionLevel.FULL]: 'Full Access',
  [PermissionLevel.ADMIN]: 'Administrator',
  [PermissionLevel.SUPER_ADMIN]: 'Super Admin',
};

/**
 * Actions available at each permission level
 * Higher levels inherit all actions from lower levels
 */
export const PermissionLevelActions: Record<PermissionLevel, string[]> = {
  [PermissionLevel.NONE]: [],
  [PermissionLevel.READ]: ['view', 'list', 'read', 'search', 'export'],
  [PermissionLevel.WRITE]: ['view', 'list', 'read', 'search', 'export', 'create', 'edit', 'update', 'duplicate'],
  [PermissionLevel.FULL]: ['view', 'list', 'read', 'search', 'export', 'create', 'edit', 'update', 'duplicate', 'delete', 'manage', 'assign', 'transfer'],
  [PermissionLevel.ADMIN]: ['view', 'list', 'read', 'search', 'export', 'create', 'edit', 'update', 'duplicate', 'delete', 'manage', 'assign', 'transfer', 'configure', 'admin', 'manage_all', 'restore'],
  [PermissionLevel.SUPER_ADMIN]: ['*'], // All permissions
};

/**
 * Check if a user's permission level allows a specific action
 * @param userLevel - User's current permission level
 * @param action - Action to check (e.g., 'view', 'create', 'delete')
 * @returns True if user level allows the action
 * 
 * @example
 * if (hasPermissionForAction(PermissionLevel.WRITE, 'create')) {
 *   // User can create records
 * }
 */
export function hasPermissionForAction(
  userLevel: PermissionLevel,
  action: string
): boolean {
  // Super admin has all permissions
  if (userLevel >= PermissionLevel.SUPER_ADMIN) {
    return true;
  }

  // No access
  if (userLevel === PermissionLevel.NONE) {
    return false;
  }

  // Check if action is in the allowed list for this level
  const allowedActions = PermissionLevelActions[userLevel];
  return allowedActions.includes(action);
}

/**
 * Check if user has at least the minimum required level
 * @param userLevel - User's current permission level
 * @param requiredLevel - Minimum level required
 * @returns True if user level meets or exceeds required level
 * 
 * @example
 * if (hasMinimumLevel(userPermissionLevel, PermissionLevel.WRITE)) {
 *   // User has at least WRITE access
 * }
 */
export function hasMinimumLevel(
  userLevel: PermissionLevel,
  requiredLevel: PermissionLevel
): boolean {
  return userLevel >= requiredLevel;
}

/**
 * Get all actions available at a specific permission level
 * @param level - Permission level
 * @returns Array of action names
 */
export function getActionsForLevel(level: PermissionLevel): string[] {
  return PermissionLevelActions[level] || [];
}

/**
 * Get the minimum permission level required for an action
 * @param action - Action name
 * @returns Minimum permission level required
 */
export function getMinimumLevelForAction(action: string): PermissionLevel {
  // Super admin actions
  if (action === '*') {
    return PermissionLevel.SUPER_ADMIN;
  }

  // Check each level from highest to lowest
  for (let level = PermissionLevel.SUPER_ADMIN; level >= PermissionLevel.READ; level--) {
    const actions = PermissionLevelActions[level as PermissionLevel];
    if (actions.includes(action) || actions.includes('*')) {
      // Find the lowest level that has this action
      for (let minLevel = PermissionLevel.READ; minLevel <= level; minLevel++) {
        const minActions = PermissionLevelActions[minLevel as PermissionLevel];
        if (minActions.includes(action)) {
          return minLevel as PermissionLevel;
        }
      }
      return level as PermissionLevel;
    }
  }

  return PermissionLevel.NONE;
}

/**
 * Convert legacy permission actions to permission level
 * Used for migrating from old boolean permission system
 * @param actions - Array of action strings
 * @returns Appropriate permission level
 */
export function actionsToPermissionLevel(actions: string[]): PermissionLevel {
  if (actions.length === 0) {
    return PermissionLevel.NONE;
  }

  // Check for super admin
  if (actions.includes('*') || actions.includes('super_admin')) {
    return PermissionLevel.SUPER_ADMIN;
  }

  // Check for admin actions
  if (actions.some(a => ['configure', 'admin', 'manage_all'].includes(a))) {
    return PermissionLevel.ADMIN;
  }

  // Check for full access
  if (actions.some(a => ['delete', 'manage', 'assign'].includes(a))) {
    return PermissionLevel.FULL;
  }

  // Check for write access
  if (actions.some(a => ['create', 'edit', 'update'].includes(a))) {
    return PermissionLevel.WRITE;
  }

  // Default to read access if they have any actions
  return PermissionLevel.READ;
}

/**
 * Permission level utilities and constants
 */
export const PermissionLevelUtils = {
  hasPermissionForAction,
  hasMinimumLevel,
  getActionsForLevel,
  getMinimumLevelForAction,
  actionsToPermissionLevel,
  
  /** All available permission levels */
  allLevels: [
    PermissionLevel.NONE,
    PermissionLevel.READ,
    PermissionLevel.WRITE,
    PermissionLevel.FULL,
    PermissionLevel.ADMIN,
    PermissionLevel.SUPER_ADMIN,
  ],
  
  /** User-assignable levels (excludes NONE and SUPER_ADMIN) */
  userLevels: [
    PermissionLevel.READ,
    PermissionLevel.WRITE,
    PermissionLevel.FULL,
    PermissionLevel.ADMIN,
  ],
} as const;
