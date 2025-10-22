import { PermissionService, RoleService, RolePermissionService } from '../src/lib/db/user-service';

async function addNewPermissions() {
  console.log('🚀 Adding new permissions for notifications and support...');
  
  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  try {
    // Add notifications and support permissions
    const notificationModules = ['notifications', 'support'];
    const actions = ['create', 'read', 'update', 'delete'];

    const createdPermissions = [];

    for (const moduleName of notificationModules) {
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

    // Additional special permissions
    const specialPermissions = [
      { module: 'notifications', action: 'view_all', description: 'View all notifications' },
      { module: 'support', action: 'reply', description: 'Reply to support messages' },
      { module: 'support', action: 'view_all', description: 'View all support messages' },
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
          // Get existing permission
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

    // Add permissions to super_admin role
    console.log('\n🔧 Adding permissions to super_admin role...');
    const superAdminRole = await roleService.getRoleByName('super_admin');
    
    if (superAdminRole) {
      // Add all new permissions to super_admin
      for (const permission of createdPermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(superAdminRole.id, permission.id);
          console.log(`  ✓ Added ${permission.module}:${permission.action} to super_admin`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('already assigned')) {
            console.log(`  ⚠️  ${errorMessage}`);
          }
        }
      }
      console.log(`✅ Added permissions to super_admin role`);
    }

    // Add read/create permissions to manager role
    console.log('\n🔧 Adding read/create permissions to manager role...');
    const managerRole = await roleService.getRoleByName('manager');
    
    if (managerRole) {
      const managerPermissions = createdPermissions.filter(p => 
        (p.module === 'notifications' || p.module === 'support') && 
        (p.action === 'read' || p.action === 'create')
      );
      
      for (const permission of managerPermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(managerRole.id, permission.id);
          console.log(`  ✓ Added ${permission.module}:${permission.action} to manager`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('already assigned')) {
            console.log(`  ⚠️  ${errorMessage}`);
          }
        }
      }
      console.log(`✅ Added notification/support permissions to manager role`);
    }

    // Add read permissions to employee role
    console.log('\n🔧 Adding read permissions to employee role...');
    const employeeRole = await roleService.getRoleByName('employee');
    
    if (employeeRole) {
      const employeePermissions = createdPermissions.filter(p => 
        (p.module === 'notifications' && p.action === 'read') ||
        (p.module === 'support' && (p.action === 'read' || p.action === 'create'))
      );
      
      for (const permission of employeePermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(employeeRole.id, permission.id);
          console.log(`  ✓ Added ${permission.module}:${permission.action} to employee`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('already assigned')) {
            console.log(`  ⚠️  ${errorMessage}`);
          }
        }
      }
      console.log(`✅ Added notification/support permissions to employee role`);
    }

    console.log('\n✅ New permissions added successfully!');
    console.log('📌 You can now access notifications and support features');
    console.log('📌 Please restart your dev server and refresh your browser');
    
  } catch (error) {
    console.error('❌ Error adding permissions:', error);
    throw error;
  }
}

addNewPermissions().catch(console.error);
