/**
 * Hierarchical Access Utility
 * Provides helper functions for filtering data based on user hierarchy
 * Users can see:
 * 1. Their own data (createdBy === userId)
 * 2. Data created by their subordinates (direct and indirect)
 */

import { UserService } from '@/core/data/user-service';

/**
 * Get all user IDs that the given user has access to (self + subordinates)
 */
export async function getAccessibleUserIds(userId: string): Promise<string[]> {
  const userService = new UserService();
  
  try {
    // Get all subordinates (recursive)
    const subordinates = await userService.getAllSubordinates(userId);
    const subordinateIds = subordinates.map(sub => sub.id);
    
    // Include the user themselves
    return [userId, ...subordinateIds];
  } catch (error) {
    console.error('Error getting accessible user IDs:', error);
    // Fallback: return only the user's own ID
    return [userId];
  }
}

/**
 * Filter array of items to only those accessible by the user
 * Items must have a 'createdBy' field
 */
export function filterByHierarchicalAccess<T extends { createdBy: string }>(
  items: T[],
  accessibleUserIds: string[]
): T[] {
  return items.filter(item => accessibleUserIds.includes(item.createdBy));
}

/**
 * Check if user has access to a specific item
 * Returns true if item.createdBy is the user or one of their subordinates
 */
export function hasAccessToItem<T extends { createdBy: string }>(
  item: T,
  accessibleUserIds: string[]
): boolean {
  return accessibleUserIds.includes(item.createdBy);
}

/**
 * Check if user has access to modify/delete an item
 * By default, users can only modify their own items, not subordinates' items
 * Set allowSubordinateEdit=true to allow editing subordinate items
 */
export function canModifyItem<T extends { createdBy: string }>(
  item: T,
  userId: string,
  allowSubordinateEdit: boolean = false
): boolean {
  if (item.createdBy === userId) {
    return true;
  }
  
  return allowSubordinateEdit;
}

/**
 * Get LMDB query predicate for hierarchical access
 * Use this with lmdb.query()
 */
export function createHierarchicalPredicate<T extends { createdBy: string }>(
  accessibleUserIds: string[]
): (item: T) => boolean {
  return (item: T) => accessibleUserIds.includes(item.createdBy);
}
