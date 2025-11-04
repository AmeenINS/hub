import { PermissionService, RoleService, RolePermissionService } from '../src/lib/db/user-service';

async function addNewModulesPermissions() {
  console.log('🚀 Adding new modules permissions...');
  
  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  try {
    // New modules to add
    const newModules = [
      'policies',
      'claims',
      'accounting',
      'inventory',
      'procurement',
      'workflows'
    ];

    const actions = ['create', 'read', 'update', 'delete', 'view'];

    const createdPermissions = [];

    // Standard permissions for each module
    for (const moduleName of newModules) {
      for (const action of actions) {
        try {
          const permission = await permissionService.createPermission({
            module: moduleName,
            action,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${moduleName}`,
          });
          createdPermissions.push(permission);
          console.log(`✅ Created permission: ${moduleName}:${action}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('already exists')) {
            console.log(`⚠️  Permission already exists: ${moduleName}:${action}`);
            // Get existing permission
            const allPerms = await permissionService.getAllPermissions();
            const existingPerm = allPerms.find(p => p.module === moduleName && p.action === action);
            if (existingPerm) {
              createdPermissions.push(existingPerm);
            }
          } else {
            throw error;
          }
        }
      }
    }

    console.log(`\n📊 Total permissions created/found: ${createdPermissions.length}`);

    // Find admin roles (both Administrator and Super Admin)
    const roles = await roleService.getAllRoles();
    const adminRoles = roles.filter(r => 
      r.name === 'Administrator' || 
      r.name === 'Super Admin' ||
      r.name === 'admin'
    );

    if (adminRoles.length === 0) {
      console.log('❌ No admin roles found! Please create Administrator or Super Admin role first.');
      return;
    }

    console.log(`\n🔍 Found ${adminRoles.length} admin role(s): ${adminRoles.map(r => r.name).join(', ')}`);

    // Assign all permissions to each admin role
    for (const adminRole of adminRoles) {
      console.log(`\n📝 Assigning permissions to ${adminRole.name}...`);
      let assignedCount = 0;
      let skippedCount = 0;

      for (const permission of createdPermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(adminRole.id, permission.id);
          assignedCount++;
          console.log(`  ✅ Assigned ${permission.module}:${permission.action}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('already assigned')) {
            skippedCount++;
            console.log(`  ⚠️  ${permission.module}:${permission.action} already assigned`);
          } else {
            console.error(`  ❌ Error assigning ${permission.module}:${permission.action}:`, errorMessage);
          }
        }
      }

      console.log(`\n✨ ${adminRole.name} permissions assignment completed!`);
      console.log(`   - Newly assigned: ${assignedCount}`);
      console.log(`   - Already assigned: ${skippedCount}`);
      console.log(`   - Total: ${createdPermissions.length}`);

      // Show summary
      const adminRolePermissions = await rolePermissionService.getPermissionsByRole(adminRole.id);
      console.log(`\n📋 ${adminRole.name} now has ${adminRolePermissions.length} total permissions`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
addNewModulesPermissions()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
