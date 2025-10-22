import { lmdb } from './lmdb';
import { User, Role, Permission, UserRole, RolePermission } from '@/types/database';
import { nanoid } from 'nanoid';
import * as argon2 from 'argon2';

/**
 * User Service
 * Handles all user-related database operations
 */
export class UserService {
  private readonly dbName = 'users';

  /**
   * Create a new user
   */
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = nanoid();
    
    // Hash password with Argon2
    const hashedPassword = await argon2.hash(data.password);

    const user: User = {
      ...data,
      id,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return lmdb.getById<User>(this.dbName, id);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const users = await lmdb.query<User>(this.dbName, (user) => user.email === email);
    return users[0] || null;
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return lmdb.getAll<User>(this.dbName);
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    if (data.password) {
      data.password = await argon2.hash(data.password);
    }
    return lmdb.update<User>(this.dbName, id, data);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }

  /**
   * Verify user password
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await argon2.verify(user.password, password);
    return isValid ? user : null;
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleId: string): Promise<User[]> {
    const userRoleService = new UserRoleService();
    const userRoles = await userRoleService.getUserRolesByRole(roleId);
    const userIds = userRoles.map((ur) => ur.userId);

    const users = await lmdb.getAll<User>(this.dbName);
    return users.filter((user) => userIds.includes(user.id));
  }
}

/**
 * Role Service
 * Handles all role-related database operations
 */
export class RoleService {
  private readonly dbName = 'roles';

  /**
   * Create a new role
   */
  async createRole(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const id = nanoid();
    
    const role: Role = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, role);
    return role;
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    return lmdb.getById<Role>(this.dbName, id);
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    const roles = await lmdb.query<Role>(this.dbName, (role) => role.name === name);
    return roles[0] || null;
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return lmdb.getAll<Role>(this.dbName);
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    return lmdb.update<Role>(this.dbName, id, data);
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

/**
 * Permission Service
 * Handles all permission-related database operations
 */
export class PermissionService {
  private readonly dbName = 'permissions';

  /**
   * Create a new permission
   */
  async createPermission(data: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Permission> {
    const id = nanoid();
    
    const permission: Permission = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, permission);
    return permission;
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission | null> {
    return lmdb.getById<Permission>(this.dbName, id);
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return lmdb.getAll<Permission>(this.dbName);
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return lmdb.query<Permission>(this.dbName, (perm) => perm.module === module);
  }

  /**
   * Update permission
   */
  async updatePermission(id: string, data: Partial<Permission>): Promise<Permission | null> {
    return lmdb.update<Permission>(this.dbName, id, data);
  }

  /**
   * Delete permission
   */
  async deletePermission(id: string): Promise<boolean> {
    return lmdb.delete(this.dbName, id);
  }
}

/**
 * UserRole Service
 * Handles user-role relationships
 */
export class UserRoleService {
  private readonly dbName = 'userRoles';

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<UserRole> {
    const id = nanoid();
    
    const userRole: UserRole = {
      id,
      userId,
      roleId,
      assignedBy,
      assignedAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, userRole);
    return userRole;
  }

  /**
   * Get user roles by user ID
   */
  async getUserRolesByUser(userId: string): Promise<UserRole[]> {
    return lmdb.query<UserRole>(this.dbName, (ur) => ur.userId === userId);
  }

  /**
   * Get user roles by role ID
   */
  async getUserRolesByRole(roleId: string): Promise<UserRole[]> {
    return lmdb.query<UserRole>(this.dbName, (ur) => ur.roleId === roleId);
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const userRoles = await lmdb.query<UserRole>(
      this.dbName,
      (ur) => ur.userId === userId && ur.roleId === roleId
    );

    if (userRoles.length === 0) return false;

    return lmdb.delete(this.dbName, userRoles[0].id);
  }
}

/**
 * RolePermission Service
 * Handles role-permission relationships
 */
export class RolePermissionService {
  private readonly dbName = 'rolePermissions';

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    const id = nanoid();
    
    const rolePermission: RolePermission = {
      id,
      roleId,
      permissionId,
      createdAt: new Date().toISOString(),
    };

    await lmdb.create(this.dbName, id, rolePermission);
    return rolePermission;
  }

  /**
   * Get permissions by role ID
   */
  async getPermissionsByRole(roleId: string): Promise<RolePermission[]> {
    return lmdb.query<RolePermission>(this.dbName, (rp) => rp.roleId === roleId);
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const rolePermissions = await lmdb.query<RolePermission>(
      this.dbName,
      (rp) => rp.roleId === roleId && rp.permissionId === permissionId
    );

    if (rolePermissions.length === 0) return false;

    return lmdb.delete(this.dbName, rolePermissions[0].id);
  }

  /**
   * Get all permissions for a user (through their roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoleService = new UserRoleService();
    const permissionService = new PermissionService();

    // Get user's roles
    const userRoles = await userRoleService.getUserRolesByUser(userId);
    const roleIds = userRoles.map((ur) => ur.roleId);

    // Get permissions for each role
    const permissionIds = new Set<string>();
    for (const roleId of roleIds) {
      const rolePermissions = await this.getPermissionsByRole(roleId);
      rolePermissions.forEach((rp) => permissionIds.add(rp.permissionId));
    }

    // Fetch actual permission objects
    const permissions: Permission[] = [];
    for (const permissionId of permissionIds) {
      const permission = await permissionService.getPermissionById(permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }

    return permissions;
  }
}
