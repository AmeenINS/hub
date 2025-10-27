import { PermissionService, RoleService, RolePermissionService } from '../src/lib/db/user-service.js';

async function addSchedulerPermissions() {
  console.log('🚀 Adding new permissions for scheduler system...');
  
  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  try {
    // Add scheduler permissions
    const schedulerModules = ['scheduler'];
    const actions = ['create', 'read', 'update', 'delete'];

    const createdPermissions = [];

    for (const moduleName of schedulerModules) {
      for (const action of actions) {
        try {
          const permission = await permissionService.createPermission({
            module: moduleName,
            action,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} scheduler events`,
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

    // Additional special permissions for scheduler
    const specialPermissions = [
      { module: 'scheduler', action: 'view_all', description: 'View all scheduler events' },
      { module: 'scheduler', action: 'assign_others', description: 'Assign events to other users' },
      { module: 'scheduler', action: 'manage_recurrence', description: 'Manage recurring events' },
      { module: 'scheduler', action: 'send_notifications', description: 'Send scheduler notifications' },
    ];

    for (const perm of specialPermissions) {
      try {
        const permission = await permissionService.createPermission(perm);
        createdPermissions.push(permission);
        console.log(`✅ Created special permission: ${perm.module}:${perm.action}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
          console.log(`⚠️  Permission already exists: ${perm.module}:${perm.action}`);
          const allPerms = await permissionService.getAllPermissions();
          const existingPerm = allPerms.find(p => p.module === perm.module && p.action === perm.action);
          if (existingPerm) {
            createdPermissions.push(existingPerm);
          }
        } else {
          throw error;
        }
      }
    }

    console.log(`\n📊 Total permissions created/found: ${createdPermissions.length}`);

    // Assign all scheduler permissions to super_admin role
    console.log('\n🔐 Assigning scheduler permissions to super_admin role...');
    
    const roles = await roleService.getAllRoles();
    const superAdminRole = roles.find(r => r.name === 'super_admin');

    if (superAdminRole) {
      const schedulerPermissions = createdPermissions.filter(p => p.module === 'scheduler');
      
      for (const permission of schedulerPermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(superAdminRole.id, permission.id);
          console.log(`✅ Assigned ${permission.module}:${permission.action} to super_admin`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('already exists')) {
            console.log(`⚠️  Permission already assigned: ${permission.module}:${permission.action}`);
          } else {
            throw error;
          }
        }
      }
    } else {
      console.log('⚠️  super_admin role not found, skipping role assignments');
    }

    // Also assign basic scheduler permissions to admin and manager roles
    const basicSchedulerPerms = createdPermissions.filter(p => 
      p.module === 'scheduler' && 
      ['create', 'read', 'update', 'delete', 'view_all'].includes(p.action)
    );

    const rolesToAssign = ['admin', 'manager'];
    
    for (const roleName of rolesToAssign) {
      const role = roles.find(r => r.name === roleName);
      if (role) {
        console.log(`\n🔐 Assigning basic scheduler permissions to ${roleName} role...`);
        
        for (const permission of basicSchedulerPerms) {
          try {
            await rolePermissionService.assignPermissionToRole(role.id, permission.id);
            console.log(`✅ Assigned ${permission.module}:${permission.action} to ${roleName}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('already exists')) {
              console.log(`⚠️  Permission already assigned: ${permission.module}:${permission.action}`);
            } else {
              throw error;
            }
          }
        }
      }
    }

    console.log('\n🎉 Scheduler permissions setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding scheduler permissions:', error);
    process.exit(1);
  }
}

// Run the script
addSchedulerPermissions().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});