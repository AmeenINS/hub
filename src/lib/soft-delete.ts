/**
 * Soft Delete Utility for LMDB
 * Implements logical deletion with recovery capability
 * 
 * All data can be restored
 */

export interface SoftDeletable {
  deletedAt?: string | null;
  deletedBy?: string | null;
  isDeleted?: boolean;
}

export interface SoftDeleteOptions {
  userId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RestoreOptions {
  userId: string;
  reason?: string;
}

/**
 * Mark an entity as deleted (Soft Delete)
 * @param entity - The entity to soft delete
 * @param options - Delete options including user ID
 * @returns Updated entity with soft delete fields
 */
export function softDelete<T extends SoftDeletable>(
  entity: T,
  options: SoftDeleteOptions
): T {
  return {
    ...entity,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: options.userId,
  };
}

/**
 * Restore a soft deleted entity
 * @param entity - The entity to restore
 * @param _options - Restore options including user ID (for audit logging)
 * @returns Restored entity
 */
export function restore<T extends SoftDeletable>(
  entity: T,
  _options: RestoreOptions
): T {
  return {
    ...entity,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };
}

/**
 * Check if an entity is deleted
 * @param entity - The entity to check
 * @returns True if entity is soft deleted
 */
export function isDeleted<T extends SoftDeletable>(entity: T): boolean {
  return entity.isDeleted === true || !!entity.deletedAt;
}

/**
 * Filter out deleted entities from a list
 * @param entities - List of entities
 * @param includeDeleted - Whether to include deleted items (default: false)
 * @returns Filtered list
 */
export function filterDeleted<T extends SoftDeletable>(
  entities: T[],
  includeDeleted: boolean = false
): T[] {
  if (includeDeleted) {
    return entities;
  }
  return entities.filter(entity => !isDeleted(entity));
}

/**
 * Get only deleted entities
 * @param entities - List of entities
 * @returns List of deleted entities
 */
export function getDeletedOnly<T extends SoftDeletable>(entities: T[]): T[] {
  return entities.filter(entity => isDeleted(entity));
}

/**
 * Permanently delete an entity (USE WITH CAUTION!)
 * This should only be used by admins and for compliance reasons
 * @param entity - The entity to permanently delete
 * @returns null (entity is removed)
 */
export function permanentDelete<T>(entity: T): null {
  // Log this action for audit
  console.warn('PERMANENT DELETE:', {
    timestamp: new Date().toISOString(),
    entity: entity
  });
  return null;
}

/**
 * Bulk soft delete multiple entities
 * @param entities - List of entities to delete
 * @param options - Delete options
 * @returns Updated entities
 */
export function bulkSoftDelete<T extends SoftDeletable>(
  entities: T[],
  options: SoftDeleteOptions
): T[] {
  return entities.map(entity => softDelete(entity, options));
}

/**
 * Bulk restore multiple entities
 * @param entities - List of entities to restore
 * @param options - Restore options
 * @returns Restored entities
 */
export function bulkRestore<T extends SoftDeletable>(
  entities: T[],
  options: RestoreOptions
): T[] {
  return entities.map(entity => restore(entity, options));
}

/**
 * Get deletion info for an entity
 * @param entity - The entity to get info from
 * @returns Deletion information or null
 */
export function getDeletionInfo<T extends SoftDeletable>(
  entity: T
): { deletedAt: string; deletedBy: string } | null {
  if (!isDeleted(entity)) {
    return null;
  }
  return {
    deletedAt: entity.deletedAt || '',
    deletedBy: entity.deletedBy || '',
  };
}

/**
 * Auto-cleanup old deleted items (for compliance)
 * Delete items that have been in trash for more than specified days
 * @param entities - List of entities
 * @param daysInTrash - Number of days items can stay in trash (default: 30)
 * @returns { toKeep, toDelete }
 */
export function autoCleanup<T extends SoftDeletable>(
  entities: T[],
  daysInTrash: number = 30
): { toKeep: T[]; toDelete: T[] } {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInTrash);
  
  const toKeep: T[] = [];
  const toDelete: T[] = [];
  
  entities.forEach(entity => {
    if (!entity.deletedAt) {
      toKeep.push(entity);
      return;
    }
    
    const deletedDate = new Date(entity.deletedAt);
    if (deletedDate < cutoffDate) {
      toDelete.push(entity);
    } else {
      toKeep.push(entity);
    }
  });
  
  return { toKeep, toDelete };
}
