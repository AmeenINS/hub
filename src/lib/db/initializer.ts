import { lmdb } from './lmdb';
import { UserService, RoleService, PermissionService, RolePermissionService, UserRoleService } from './user-service';


/**
 * Database Initializer
 * Sets up the initial database structure and creates the super admin
 */
export class DatabaseInitializer {
  private userService: UserService;
  private roleService: RoleService;
  private permissionService: PermissionService;
  private rolePermissionService: RolePermissionService;
  private userRoleService: UserRoleService;

  constructor() {
    this.userService = new UserService();
    this.roleService = new RoleService();
    this.permissionService = new PermissionService();
    this.rolePermissionService = new RolePermissionService();
    this.userRoleService = new UserRoleService();
  }

  /**
   * Initialize database with default data
   */
  async initialize() {
    try {
      // Initialize LMDB
      await lmdb.initialize();

      // Check if super admin already exists
      const existingAdmin = await this.userService.getUserByEmail('admin@ameen.com');
      if (existingAdmin) {
        console.log('✅ Database already initialized');
        return;
      }

      console.log('🔧 Initializing database...');

      // Create default permissions
      await this.createDefaultPermissions();

      // Create default roles
      await this.createDefaultRoles();

      // Create super admin user
      await this.createSuperAdmin();

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create default permissions
   */
  private async createDefaultPermissions() {
    const modules = ['users', 'roles', 'permissions', 'tasks', 'departments', 'reports', 'notifications', 'support'];
    const actions = ['create', 'read', 'update', 'delete'];

    const permissions = [];

    for (const moduleName of modules) {
      for (const action of actions) {
        const permission = await this.permissionService.createPermission({
          module: moduleName,
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${moduleName}`,
        });
        permissions.push(permission);
      }
    }

    // Additional special permissions
    const specialPermissions = [
      { module: 'tasks', action: 'assign', description: 'Assign tasks to users' },
      { module: 'tasks', action: 'view_all', description: 'View all tasks' },
      { module: 'tasks', action: 'view_own', description: 'View own tasks only' },
      { module: 'users', action: 'manage_roles', description: 'Manage user roles' },
      { module: 'system', action: 'admin', description: 'Full system access' },
      { module: 'reports', action: 'export', description: 'Export reports' },
      { module: 'notifications', action: 'view_all', description: 'View all notifications' },
      { module: 'support', action: 'reply', description: 'Reply to support messages' },
      { module: 'support', action: 'view_all', description: 'View all support messages' },
    ];

    for (const perm of specialPermissions) {
      await this.permissionService.createPermission(perm);
    }

    console.log(`✅ Created ${permissions.length + specialPermissions.length} permissions`);
  }

  /**
   * Create default roles
   */
  private async createDefaultRoles() {
    // Super Admin Role
    const superAdminRole = await this.roleService.createRole({
      name: 'super_admin',
      description: 'Full system access with all permissions',
      isSystemRole: true,
    });

    // Manager Role
    const managerRole = await this.roleService.createRole({
      name: 'manager',
      description: 'Department manager with task assignment capabilities',
      isSystemRole: true,
    });

    // Employee Role
    const employeeRole = await this.roleService.createRole({
      name: 'employee',
      description: 'Standard employee with basic task access',
      isSystemRole: true,
    });

    // Assign permissions to roles
    const allPermissions = await this.permissionService.getAllPermissions();

    // Super Admin gets all permissions
    for (const permission of allPermissions) {
      await this.rolePermissionService.assignPermissionToRole(
        superAdminRole.id,
        permission.id
      );
    }

    // Manager gets task and user management permissions
    const managerPermissions = allPermissions.filter(
      (p) =>
        (p.module === 'tasks') ||
        (p.module === 'users' && p.action === 'read') ||
        (p.module === 'reports')
    );

    for (const permission of managerPermissions) {
      await this.rolePermissionService.assignPermissionToRole(
        managerRole.id,
        permission.id
      );
    }

    // Employee gets basic task permissions
    const employeePermissions = allPermissions.filter(
      (p) =>
        (p.module === 'tasks' && (p.action === 'read' || p.action === 'update' || p.action === 'view_own')) ||
        (p.module === 'users' && p.action === 'read')
    );

    for (const permission of employeePermissions) {
      await this.rolePermissionService.assignPermissionToRole(
        employeeRole.id,
        permission.id
      );
    }

    console.log('✅ Created default roles: super_admin, manager, employee');
  }

  /**
   * Create super admin user
   */
  private async createSuperAdmin() {
    const superAdmin = await this.userService.createUser({
      email: 'admin@ameen.com',
      password: 'Admin@123456', // Change this in production!
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
    });

    // Assign super_admin role
    const superAdminRole = await this.roleService.getRoleByName('super_admin');
    if (superAdminRole) {
      await this.userRoleService.assignRoleToUser(
        superAdmin.id,
        superAdminRole.id,
        superAdmin.id
      );
    }

    console.log('✅ Created super admin user');
    console.log('   Email: admin@ameen.com');
    console.log('   Password: Admin@123456');
    console.log('   ⚠️  CHANGE PASSWORD IN PRODUCTION!');
  }
}

/**
 * Export singleton instance
 */
export const dbInitializer = new DatabaseInitializer();
