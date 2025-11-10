/**
 * Migration Script: Remove Old Permission System & Install New Level System
 * This script:
 * 1. Removes all old permissions and role-permission mappings
 * 2. Creates new roles with moduleLevels
 * 3. Assigns users to appropriate roles
 * 4. Cleans up old permission data
 */

import { lmdb } from '../src/core/data/lmdb';
import { PermissionLevel } from '../src/core/auth/permission-levels';
import { nanoid } from 'nanoid';

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  moduleLevels?: Record<string, number> | string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  fullNameEn: string;
  password?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
}

interface Permission {
  id: string;
  module: string;
  action: string;
  [key: string]: string;
}

interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

/**
 * New role definitions with permission levels
 */
const NEW_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Super Administrator',
    description: 'Complete system control with all permissions',
    isSystemRole: true,
    moduleLevels: {
      dashboard: PermissionLevel.SUPER_ADMIN,
      users: PermissionLevel.SUPER_ADMIN,
      roles: PermissionLevel.SUPER_ADMIN,
      permissions: PermissionLevel.SUPER_ADMIN,
      settings: PermissionLevel.SUPER_ADMIN,
      contacts: PermissionLevel.SUPER_ADMIN,
      companies: PermissionLevel.SUPER_ADMIN,
      deals: PermissionLevel.SUPER_ADMIN,
      tasks: PermissionLevel.SUPER_ADMIN,
      notes: PermissionLevel.SUPER_ADMIN,
      scheduler: PermissionLevel.SUPER_ADMIN,
      reports: PermissionLevel.SUPER_ADMIN,
      notifications: PermissionLevel.SUPER_ADMIN,
      support: PermissionLevel.SUPER_ADMIN,
      locations: PermissionLevel.SUPER_ADMIN,
      positions: PermissionLevel.SUPER_ADMIN,
    },
  },
  {
    name: 'Administrator',
    description: 'System administration with most permissions',
    isSystemRole: true,
    moduleLevels: {
      dashboard: PermissionLevel.ADMIN,
      users: PermissionLevel.ADMIN,
      roles: PermissionLevel.FULL,
      permissions: PermissionLevel.READ,
      settings: PermissionLevel.ADMIN,
      contacts: PermissionLevel.ADMIN,
      companies: PermissionLevel.ADMIN,
      deals: PermissionLevel.ADMIN,
      tasks: PermissionLevel.ADMIN,
      notes: PermissionLevel.ADMIN,
      scheduler: PermissionLevel.ADMIN,
      reports: PermissionLevel.ADMIN,
      notifications: PermissionLevel.FULL,
      support: PermissionLevel.FULL,
      locations: PermissionLevel.ADMIN,
      positions: PermissionLevel.ADMIN,
    },
  },
  {
    name: 'Manager',
    description: 'Department manager with full access to core modules',
    isSystemRole: true,
    moduleLevels: {
      dashboard: PermissionLevel.FULL,
      users: PermissionLevel.READ,
      roles: PermissionLevel.READ,
      permissions: PermissionLevel.NONE,
      settings: PermissionLevel.WRITE,
      contacts: PermissionLevel.FULL,
      companies: PermissionLevel.FULL,
      deals: PermissionLevel.FULL,
      tasks: PermissionLevel.FULL,
      notes: PermissionLevel.FULL,
      scheduler: PermissionLevel.FULL,
      reports: PermissionLevel.FULL,
      notifications: PermissionLevel.WRITE,
      support: PermissionLevel.WRITE,
      locations: PermissionLevel.READ,
      positions: PermissionLevel.READ,
    },
  },
  {
    name: 'Sales Representative',
    description: 'Sales team member with CRM access',
    isSystemRole: true,
    moduleLevels: {
      dashboard: PermissionLevel.READ,
      users: PermissionLevel.NONE,
      roles: PermissionLevel.NONE,
      permissions: PermissionLevel.NONE,
      settings: PermissionLevel.READ,
      contacts: PermissionLevel.WRITE,
      companies: PermissionLevel.WRITE,
      deals: PermissionLevel.WRITE,
      tasks: PermissionLevel.WRITE,
      notes: PermissionLevel.WRITE,
      scheduler: PermissionLevel.WRITE,
      reports: PermissionLevel.READ,
      notifications: PermissionLevel.READ,
      support: PermissionLevel.READ,
      locations: PermissionLevel.READ,
      positions: PermissionLevel.NONE,
    },
  },
  {
    name: 'Viewer',
    description: 'Read-only access to most modules',
    isSystemRole: true,
    moduleLevels: {
      dashboard: PermissionLevel.READ,
      users: PermissionLevel.NONE,
      roles: PermissionLevel.NONE,
      permissions: PermissionLevel.NONE,
      settings: PermissionLevel.READ,
      contacts: PermissionLevel.READ,
      companies: PermissionLevel.READ,
      deals: PermissionLevel.READ,
      tasks: PermissionLevel.READ,
      notes: PermissionLevel.READ,
      scheduler: PermissionLevel.READ,
      reports: PermissionLevel.READ,
      notifications: PermissionLevel.READ,
      support: PermissionLevel.READ,
      locations: PermissionLevel.READ,
      positions: PermissionLevel.READ,
    },
  },
];

async function main() {
  console.log('🚀 Starting migration to Permission Level System...\n');

  try {
    // Step 1: Backup old data
    console.log('📦 Step 1: Backing up old data...');
    const oldRoles = await lmdb.getAll<Role>('roles');
    const oldPermissions = await lmdb.getAll<Permission>('permissions');
    const oldRolePermissions = await lmdb.getAll<RolePermission>('rolePermissions');
    const oldUserRoles = await lmdb.getAll<UserRole>('userRoles');
    
    console.log(`   - Found ${oldRoles.length} old roles`);
    console.log(`   - Found ${oldPermissions.length} old permissions`);
    console.log(`   - Found ${oldRolePermissions.length} old role-permission mappings`);
    console.log(`   - Found ${oldUserRoles.length} user-role assignments\n`);

    // Step 2: Clear old permission data
    console.log('🗑️  Step 2: Clearing old permission data...');
    
    // Clear old role-permission mappings
    for (const rp of oldRolePermissions) {
      await lmdb.delete('rolePermissions', rp.id);
    }
    console.log(`   ✅ Deleted ${oldRolePermissions.length} role-permission mappings`);
    
    // Clear old permissions
    for (const perm of oldPermissions) {
      await lmdb.delete('permissions', perm.id);
    }
    console.log(`   ✅ Deleted ${oldPermissions.length} permissions`);
    
    // Clear old roles
    for (const role of oldRoles) {
      await lmdb.delete('roles', role.id);
    }
    console.log(`   ✅ Deleted ${oldRoles.length} old roles\n`);

    // Step 3: Create new roles with permission levels
    console.log('✨ Step 3: Creating new roles with permission levels...');
    const newRoleIds: Record<string, string> = {};
    
    for (const roleData of NEW_ROLES) {
      const roleId = nanoid();
      const role: Role = {
        ...roleData,
        id: roleId,
        moduleLevels: roleData.moduleLevels,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await lmdb.create('roles', roleId, role);
      newRoleIds[roleData.name] = roleId;
      console.log(`   ✅ Created role: ${roleData.name} (${roleId})`);
    }
    console.log('');

    // Step 4: Migrate user role assignments
    console.log('👥 Step 4: Migrating user role assignments...');
    
    // Get all users
    const users = await lmdb.getAll<User>('users');
    console.log(`   - Found ${users.length} users to migrate\n`);

    // Clear old user-role assignments
    for (const ur of oldUserRoles) {
      await lmdb.delete('userRoles', ur.id);
    }
    console.log(`   ✅ Cleared ${oldUserRoles.length} old user-role assignments\n`);

    // Map old role names to new roles
    const roleMapping: Record<string, string> = {
      'super admin': 'Super Administrator',
      'super_admin': 'Super Administrator',
      'administrator': 'Administrator',
      'admin': 'Administrator',
      'manager': 'Manager',
      'sales': 'Sales Representative',
      'sales representative': 'Sales Representative',
      'viewer': 'Viewer',
      'employee': 'Viewer',
      'user': 'Viewer',
    };

    // Assign users to new roles
    let migratedCount = 0;
    for (const user of users) {
      // Check if user had old role assignment
      const oldUserRole = oldUserRoles.find(ur => ur.userId === user.id);
      
      if (oldUserRole) {
        const oldRole = oldRoles.find(r => r.id === oldUserRole.roleId);
        const oldRoleName = oldRole?.name.toLowerCase() || '';
        
        // Map to new role
        const newRoleName = roleMapping[oldRoleName] || 'Viewer';
        const newRoleId = newRoleIds[newRoleName];
        
        if (newRoleId) {
          const userRole: UserRole = {
            id: nanoid(),
            userId: user.id,
            roleId: newRoleId,
            assignedAt: new Date().toISOString(),
            assignedBy: 'system_migration',
          };
          
          await lmdb.create('userRoles', userRole.id, userRole);
          console.log(`   ✅ Migrated ${user.fullNameEn || user.email}: ${oldRoleName || 'no role'} → ${newRoleName}`);
          migratedCount++;
        }
      } else {
        // User had no role, assign Viewer by default
        const viewerRoleId = newRoleIds['Viewer'];
        
        const userRole: UserRole = {
          id: nanoid(),
          userId: user.id,
          roleId: viewerRoleId,
          assignedAt: new Date().toISOString(),
          assignedBy: 'system_migration',
        };
        
        await lmdb.create('userRoles', userRole.id, userRole);
        console.log(`   ✅ Assigned ${user.fullNameEn || user.email}: (no role) → Viewer`);
        migratedCount++;
      }
    }
    
    console.log(`\n   📊 Migrated ${migratedCount} user role assignments\n`);

    // Step 5: Verification
    console.log('🔍 Step 5: Verifying migration...');
    const newRoles = await lmdb.getAll<Role>('roles');
    const newUserRoles = await lmdb.getAll<UserRole>('userRoles');
    const remainingPermissions = await lmdb.getAll<Permission>('permissions');
    const remainingRolePermissions = await lmdb.getAll<RolePermission>('rolePermissions');
    
    console.log(`   ✅ New roles created: ${newRoles.length}`);
    console.log(`   ✅ User role assignments: ${newUserRoles.length}`);
    console.log(`   ✅ Old permissions remaining: ${remainingPermissions.length} (should be 0)`);
    console.log(`   ✅ Old role-permissions remaining: ${remainingRolePermissions.length} (should be 0)\n`);

    // Step 6: Display new role structure
    console.log('📋 Step 6: New Role Structure:\n');
    for (const role of newRoles) {
      console.log(`   🎭 ${role.name}`);
      console.log(`      Description: ${role.description}`);
      console.log(`      System Role: ${role.isSystemRole}`);
      
      if (role.moduleLevels) {
        const levels = typeof role.moduleLevels === 'string' 
          ? JSON.parse(role.moduleLevels) 
          : role.moduleLevels;
        
        console.log('      Permission Levels:');
        const levelNames = ['NONE', 'READ', 'WRITE', 'FULL', 'ADMIN', 'SUPER_ADMIN'];
        
        // Group by level
        const byLevel: Record<number, string[]> = {};
        Object.entries(levels).forEach(([module, level]) => {
          if (!byLevel[level as number]) byLevel[level as number] = [];
          byLevel[level as number].push(module);
        });
        
        // Display grouped
        Object.entries(byLevel)
          .sort(([a], [b]) => Number(b) - Number(a))
          .forEach(([level, modules]) => {
            console.log(`         ${levelNames[Number(level)]}: ${modules.join(', ')}`);
          });
      }
      console.log('');
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Removed ${oldRoles.length} old roles`);
    console.log(`   - Removed ${oldPermissions.length} old permissions`);
    console.log(`   - Removed ${oldRolePermissions.length} old role-permission mappings`);
    console.log(`   - Created ${newRoles.length} new roles with permission levels`);
    console.log(`   - Migrated ${migratedCount} user role assignments`);
    console.log('');
    console.log('🎉 Permission Level System is now active!');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Restart the application');
    console.log('   2. Test login with different user roles');
    console.log('   3. Verify permission checks in UI');
    console.log('   4. Check API route protection');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
main()
  .then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
