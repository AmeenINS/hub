/**
 * Add Insurance Products Module Permissions to Database
 * Run: npx tsx scripts/add-insurance-products-permissions.ts
 */

import { PermissionService, RoleService, RolePermissionService } from '../src/core/data/user-service';

async function addInsuranceProductsPermissions() {
  console.log('🏥 Adding insurance products permissions...');

  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  try {
    const insuranceProductsActions = ['view', 'create', 'edit', 'delete'];
    const createdPermissions = [];

    for (const action of insuranceProductsActions) {
      try {
        const permission = await permissionService.createPermission({
          module: 'insurance-products',
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} insurance products`,
        });
        createdPermissions.push(permission);
        console.log(`✅ Created permission: insurance-products:${action}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
          console.log(`⚠️  Permission already exists: insurance-products:${action}`);
          const allPerms = await permissionService.getAllPermissions();
          const existingPerm = allPerms.find(p => p.module === 'insurance-products' && p.action === action);
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
          console.log(`✅ Assigned insurance-products:${permission.action} to super-admin`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('already exists')) {
            console.log(`⚠️  Permission already assigned: insurance-products:${permission.action}`);
          } else {
            throw error;
          }
        }
      }
    } else {
      console.log('⚠️  Super-admin role not found. Please create it first.');
    }

    console.log('\n✅ Insurance products permissions setup complete!');
  } catch (error) {
    console.error('❌ Error adding insurance products permissions:', error);
    throw error;
  }
}

// Run the script
addInsuranceProductsPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
