import { lmdb } from './lmdb';
import { AuditLog, AuditAction } from '@/types/database';
import { nanoid } from 'nanoid';

/**
 * Audit Service
 * Handles audit logging for security and compliance
 */
export class AuditService {
  private readonly dbName = 'auditLogs';

  /**
   * Create audit log entry
   */
  async log(data: {
    userId: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const id = nanoid();
    
    const auditLog: AuditLog = {
      id,
      ...data,
      timestamp: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, auditLog);
    return auditLog;
  }

  /**
   * Get audit logs by user ID
   */
  async getLogsByUser(userId: string): Promise<AuditLog[]> {
    const logs = await lmdb.query<AuditLog>(
      this.dbName,
      (log) => log.userId === userId
    );
    
    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get audit logs by resource
   */
  async getLogsByResource(resource: string, resourceId?: string): Promise<AuditLog[]> {
    const logs = await lmdb.query<AuditLog>(
      this.dbName,
      (log) => {
        if (resourceId) {
          return log.resource === resource && log.resourceId === resourceId;
        }
        return log.resource === resource;
      }
    );
    
    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get audit logs by action
   */
  async getLogsByAction(action: AuditAction): Promise<AuditLog[]> {
    return lmdb.query<AuditLog>(this.dbName, (log) => log.action === action);
  }

  /**
   * Get audit logs within date range
   */
  async getLogsByDateRange(startDate: string, endDate: string): Promise<AuditLog[]> {
    const logs = await lmdb.query<AuditLog>(
      this.dbName,
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );
    
    return logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get all audit logs
   */
  async getAllLogs(limit?: number): Promise<AuditLog[]> {
    const logs = await lmdb.getAll<AuditLog>(this.dbName);
    const sorted = logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
}
