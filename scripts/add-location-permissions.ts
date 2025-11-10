/**
 * Add Location Tracking Permissions to Database
 * Run: npx tsx scripts/add-location-permissions.ts
 */

import { PermissionService, RoleService, RolePermissionService } from '../src/core/data/user-service';

async function addLocationPermissions() {
  console.log('🗺️  Adding location tracking permissions...');

  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  try {
    const locationActions = ['view', 'view_own', 'view_all', 'track'];
    const createdPermissions = [];

    for (const action of locationActions) {
      try {
        const permission = await permissionService.createPermission({
          module: 'location',
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')} location`,
        });
        createdPermissions.push(permission);
        console.log(`✅ Created permission: location:${action}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
          console.log(`⚠️  Permission already exists: location:${action}`);
          const allPerms = await permissionService.getAllPermissions();
          const existingPerm = allPerms.find(p => p.module === 'location' && p.action === action);
          if (existingPerm) {
            createdPermissions.push(existingPerm);
          }
        } else {
          throw error;
        }
      }
    }

    // Assign to super-admin role
    const superAdminRole = await roleService.getRoleByName('super-admin');
    if (superAdminRole) {
      console.log('\n📝 Assigning permissions to super-admin role...');
      for (const permission of createdPermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(superAdminRole.id, permission.id);
          console.log(`✅ Assigned location:${permission.action} to super-admin`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('already assigned')) {
            console.log(`⚠️  Permission already assigned: location:${permission.action}`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Location tracking permissions added successfully!');
    console.log('📦 Total permissions created/verified:', createdPermissions.length);
    console.log('\n📋 Permission Details:');
    console.log('   - location:view        → View location tracking page');
    console.log('   - location:view_own    → View own location only');
    console.log('   - location:view_all    → View all users locations');
    console.log('   - location:track       → Allow GPS tracking');
  } catch (error) {
    console.error('❌ Error adding location permissions:', error);
    throw error;
  }
}

addLocationPermissions()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
