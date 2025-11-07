import { PermissionService, RoleService, RolePermissionService } from '../src/core/data/user-service';

async function addCRMPermissions() {
  console.log('🚀 Adding CRM permissions...');
  
  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  try {
    // CRM modules
    const crmModules = [
      'crm_contacts',
      'crm_companies', 
      'crm_leads',
      'crm_deals',
      'crm_activities',
      'crm_pipelines',
      'crm_campaigns',
      'crm_reports',
      'crm_email_templates'
    ];

    const actions = ['create', 'read', 'update', 'delete'];

    const createdPermissions = [];

    // Standard CRUD permissions for each module
    for (const moduleName of crmModules) {
      for (const action of actions) {
        try {
          const permission = await permissionService.createPermission({
            module: moduleName,
            action,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${moduleName.replace('crm_', '').replace('_', ' ')}`,
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

    // Special CRM permissions
    const specialPermissions = [
      { module: 'crm_contacts', action: 'view_all', description: 'View all contacts across organization' },
      { module: 'crm_companies', action: 'view_all', description: 'View all companies across organization' },
      { module: 'crm_leads', action: 'view_all', description: 'View all leads across organization' },
      { module: 'crm_deals', action: 'view_all', description: 'View all deals across organization' },
      { module: 'crm_activities', action: 'view_all', description: 'View all activities across organization' },
      { module: 'crm_leads', action: 'convert', description: 'Convert leads to deals' },
      { module: 'crm_deals', action: 'close', description: 'Close deals as won/lost' },
      { module: 'crm_pipelines', action: 'manage', description: 'Manage pipeline stages and configuration' },
      { module: 'crm_campaigns', action: 'launch', description: 'Launch and execute campaigns' },
      { module: 'crm_reports', action: 'view_all', description: 'View all CRM reports' },
      { module: 'crm_reports', action: 'export', description: 'Export CRM reports' },
      { module: 'crm_activities', action: 'schedule', description: 'Schedule activities and meetings' },
      { module: 'crm_email_templates', action: 'send', description: 'Send emails using templates' },
    ];

    for (const { module, action, description } of specialPermissions) {
      try {
        const permission = await permissionService.createPermission({
          module,
          action,
          description,
        });
        createdPermissions.push(permission);
        console.log(`✅ Created special permission: ${module}:${action}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
          console.log(`⚠️  Special permission already exists: ${module}:${action}`);
          // Get existing permission
          const allPerms = await permissionService.getAllPermissions();
          const existingPerm = allPerms.find(p => p.module === module && p.action === action);
          if (existingPerm) {
            createdPermissions.push(existingPerm);
          }
        } else {
          throw error;
        }
      }
    }

    console.log(`📊 Total permissions created/found: ${createdPermissions.length}`);

    // Get admin roles to assign CRM permissions
    const allRoles = await roleService.getAllRoles();
    const adminRole = allRoles.find(role => role.name.toLowerCase().includes('admin'));
    const managerRole = allRoles.find(role => role.name.toLowerCase().includes('manager'));

    if (adminRole) {
      console.log('\n🔐 Assigning CRM permissions to Admin role...');
      // Admin gets all CRM permissions
      for (const permission of createdPermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(adminRole.id, permission.id);
          console.log(`✅ Assigned ${permission.module}:${permission.action} to Admin`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('already exists')) {
            console.error(`❌ Error assigning permission to Admin: ${errorMessage}`);
          }
        }
      }
    }

    if (managerRole) {
      console.log('\n🔐 Assigning basic CRM permissions to Manager role...');
      // Manager gets read/update permissions, but not delete or admin-level permissions
      const managerPermissions = createdPermissions.filter(p => 
        !['delete', 'manage', 'view_all', 'export'].includes(p.action) ||
        ['crm_contacts:read', 'crm_companies:read', 'crm_leads:update', 'crm_deals:update'].includes(`${p.module}:${p.action}`)
      );
      
      for (const permission of managerPermissions) {
        try {
          await rolePermissionService.assignPermissionToRole(managerRole.id, permission.id);
          console.log(`✅ Assigned ${permission.module}:${permission.action} to Manager`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('already exists')) {
            console.error(`❌ Error assigning permission to Manager: ${errorMessage}`);
          }
        }
      }
    }

    console.log('\n🎉 CRM permissions setup completed!');
    console.log('\n📋 Summary:');
    console.log(`- Created ${createdPermissions.length} CRM permissions`);
    console.log(`- Admin role permissions: ${adminRole ? 'Updated' : 'Not found'}`);
    console.log(`- Manager role permissions: ${managerRole ? 'Updated' : 'Not found'}`);

  } catch (error) {
    console.error('❌ Error adding CRM permissions:', error);
    throw error;
  }
}

if (require.main === module) {
  addCRMPermissions()
    .then(() => {
      console.log('✅ CRM permissions script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ CRM permissions script failed:', error);
      process.exit(1);
    });
}

export { addCRMPermissions };