import { open, RootDatabase, Database as LMDBDatabase } from 'lmdb';
import path from 'path';

/**
 * LMDB Database Manager
 * Lightning Memory-Mapped Database for high-performance key-value storage
 */
class LMDBManager {
  private static instance: LMDBManager;
  private db: RootDatabase | null = null;
  private databases: Map<string, LMDBDatabase> = new Map();
  private initializing: Promise<void> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): LMDBManager {
    if (!LMDBManager.instance) {
      LMDBManager.instance = new LMDBManager();
    }
    return LMDBManager.instance;
  }

  /**
   * Initialize LMDB database
   */
  async initialize() {
    if (this.isInitialized) return;
    if (this.initializing) {
      await this.initializing;
      return;
    }

    const dbPath = process.env.LMDB_PATH || './data/lmdb';
    const maxDbs = parseInt(process.env.LMDB_MAX_DBS || '35');
    const mapSize = parseInt(process.env.LMDB_MAP_SIZE || '10485760');

    const initialization = (async () => {
      try {
        this.db = open({
          path: path.resolve(process.cwd(), dbPath),
          compression: true,
          maxDbs,
          mapSize,
          encoding: 'json',
        });

        // Initialize all database stores
        await this.initializeDatabases();
        this.isInitialized = true;

        console.log('✅ LMDB Database initialized successfully');
      } catch (error) {
        this.db = null;
        this.databases.clear();
        this.isInitialized = false;
        console.error('❌ Failed to initialize LMDB:', error);
        throw error;
      } finally {
        this.initializing = null;
      }
    })();

    this.initializing = initialization;
    await initialization;
  }

  /**
   * Initialize individual database stores
   */
  private async initializeDatabases() {
    if (!this.db) throw new Error('Database not initialized');

    // User Management
    this.databases.set('users', this.db.openDB({ name: 'users', encoding: 'json' }));
    this.databases.set('roles', this.db.openDB({ name: 'roles', encoding: 'json' }));
    this.databases.set('permissions', this.db.openDB({ name: 'permissions', encoding: 'json' }));
    this.databases.set('userRoles', this.db.openDB({ name: 'userRoles', encoding: 'json' }));
    this.databases.set('rolePermissions', this.db.openDB({ name: 'rolePermissions', encoding: 'json' }));
    this.databases.set('positions', this.db.openDB({ name: 'positions', encoding: 'json' }));

    // Task Management
    this.databases.set('tasks', this.db.openDB({ name: 'tasks', encoding: 'json' }));
    this.databases.set('taskAssignments', this.db.openDB({ name: 'taskAssignments', encoding: 'json' }));
    this.databases.set('taskComments', this.db.openDB({ name: 'taskComments', encoding: 'json' }));
    this.databases.set('taskAttachments', this.db.openDB({ name: 'taskAttachments', encoding: 'json' }));
    this.databases.set('taskActivities', this.db.openDB({ name: 'taskActivities', encoding: 'json' }));

    // Audit & Security
    this.databases.set('auditLogs', this.db.openDB({ name: 'auditLogs', encoding: 'json' }));
    this.databases.set('sessions', this.db.openDB({ name: 'sessions', encoding: 'json' }));
    this.databases.set('twoFactorAuth', this.db.openDB({ name: 'twoFactorAuth', encoding: 'json' }));

    // Notifications
    this.databases.set('notifications', this.db.openDB({ name: 'notifications', encoding: 'json' }));

    // File uploads
    this.databases.set('files', this.db.openDB({ name: 'files', encoding: 'json' }));

    // Support
    this.databases.set('support_messages', this.db.openDB({ name: 'support_messages', encoding: 'json' }));

    // Scheduler
    this.databases.set('scheduledEvents', this.db.openDB({ name: 'scheduledEvents', encoding: 'json' }));
    this.databases.set('scheduledNotifications', this.db.openDB({ name: 'scheduledNotifications', encoding: 'json' }));

    // CRM
    this.databases.set('contacts', this.db.openDB({ name: 'contacts', encoding: 'json' }));
    this.databases.set('companies', this.db.openDB({ name: 'companies', encoding: 'json' }));
    this.databases.set('leads', this.db.openDB({ name: 'leads', encoding: 'json' }));
    this.databases.set('deals', this.db.openDB({ name: 'deals', encoding: 'json' }));
    this.databases.set('activities', this.db.openDB({ name: 'activities', encoding: 'json' }));
    this.databases.set('pipelines', this.db.openDB({ name: 'pipelines', encoding: 'json' }));
    this.databases.set('pipelineStages', this.db.openDB({ name: 'pipelineStages', encoding: 'json' }));
    this.databases.set('campaigns', this.db.openDB({ name: 'campaigns', encoding: 'json' }));
    this.databases.set('emailTemplates', this.db.openDB({ name: 'emailTemplates', encoding: 'json' }));
    this.databases.set('reports', this.db.openDB({ name: 'reports', encoding: 'json' }));

    // Notes
    this.databases.set('notes', this.db.openDB({ name: 'notes', encoding: 'json' }));
    this.databases.set('contactNotes', this.db.openDB({ name: 'contactNotes', encoding: 'json' }));

    // Geolocation / Tracking
    this.databases.set('userLocations', this.db.openDB({ name: 'userLocations', encoding: 'json' }));
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      await this.initialize();
    }
  }

  /**
   * Get a specific database store
   */
  getDatabase(name: string) {
    const db = this.databases.get(name);
    if (!db) {
      throw new Error(`Database '${name}' not found`);
    }
    return db;
  }

  /**
   * Close all databases
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.databases.clear();
      this.db = null;
      this.isInitialized = false;
      console.log('✅ LMDB Database closed successfully');
    }
  }

  /**
   * Get all entries from a database
   */
  async getAll<T>(dbName: string): Promise<T[]> {
    await this.ensureInitialized();
    const db = this.getDatabase(dbName);
    const entries: T[] = [];
    
    for (const { value } of db.getRange()) {
      entries.push(value);
    }
    
    return entries;
  }

  /**
   * Get a single entry by ID
   */
  async getById<T>(dbName: string, id: string): Promise<T | null> {
    await this.ensureInitialized();
    const db = this.getDatabase(dbName);
    const value = await db.get(id);
    return value || null;
  }

  /**
   * Create a new entry
   */
  async create<T>(dbName: string, id: string, data: T): Promise<T> {
    await this.ensureInitialized();
    const db = this.getDatabase(dbName);
    await db.put(id, {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return data;
  }

  /**
   * Update an existing entry
   */
  async update<T>(dbName: string, id: string, data: Partial<T>): Promise<T | null> {
    await this.ensureInitialized();
    const db = this.getDatabase(dbName);
    const existing = await db.get(id);
    
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await db.put(id, updated);
    return updated;
  }

  /**
   * Delete an entry
   */
  async delete(dbName: string, id: string): Promise<boolean> {
    await this.ensureInitialized();
    const db = this.getDatabase(dbName);
    return await db.remove(id);
  }

  /**
   * Query with filter
   */
  async query<T>(
    dbName: string,
    filter: (item: T) => boolean
  ): Promise<T[]> {
    await this.ensureInitialized();
    const db = this.getDatabase(dbName);
    const results: T[] = [];

    for (const { value } of db.getRange()) {
      if (filter(value)) {
        results.push(value);
      }
    }

    return results;
  }

  /**
   * Batch operations
   */
  async batch(operations: Array<{
    dbName: string;
    operation: 'put' | 'delete';
    id: string;
    data?: unknown;
  }>) {
    await this.ensureInitialized();
    const promises = operations.map(async (op) => {
      const db = this.getDatabase(op.dbName);
      
      if (op.operation === 'put') {
        return db.put(op.id, op.data);
      } else {
        return db.remove(op.id);
      }
    });

    return Promise.all(promises);
  }
}

// Export singleton instance
export const lmdb = LMDBManager.getInstance();
export default lmdb;
