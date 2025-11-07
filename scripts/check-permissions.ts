import { PermissionService, RoleService, RolePermissionService } from '../src/core/data/user-service';

async function checkPermissions() {
  console.log('🔍 Checking permissions setup...\n');
  
  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  try {
    // Get all permissions
    const allPermissions = await permissionService.getAllPermissions();
    
    // Filter notifications and support permissions
    const notificationPerms = allPermissions.filter(p => 
      p.module === 'notifications' || p.module === 'support'
    );
    
    console.log('📋 Notifications & Support Permissions:');
    console.log('----------------------------------------');
    notificationPerms.forEach(p => {
      console.log(`  • ${p.module}:${p.action} - ${p.description || 'N/A'}`);
    });
    
    // Check super_admin permissions
    console.log('\n👑 Super Admin Permissions:');
    console.log('----------------------------------------');
    const superAdminRole = await roleService.getRoleByName('super_admin');
    if (superAdminRole) {
      const rolePerms = await rolePermissionService.getPermissionsByRole(superAdminRole.id);
      const permIds = rolePerms.map(rp => rp.permissionId);
      const permissions = await Promise.all(
        permIds.map(id => permissionService.getPermissionById(id))
      );
      
      const notifPerms = permissions.filter(p => 
        p && (p.module === 'notifications' || p.module === 'support')
      );
      
      notifPerms.forEach(p => {
        if (p) {
          console.log(`  ✓ ${p.module}:${p.action}`);
        }
      });
    }
    
    // Check manager permissions
    console.log('\n👔 Manager Permissions:');
    console.log('----------------------------------------');
    const managerRole = await roleService.getRoleByName('manager');
    if (managerRole) {
      const rolePerms = await rolePermissionService.getPermissionsByRole(managerRole.id);
      const permIds = rolePerms.map(rp => rp.permissionId);
      const permissions = await Promise.all(
        permIds.map(id => permissionService.getPermissionById(id))
      );
      
      const notifPerms = permissions.filter(p => 
        p && (p.module === 'notifications' || p.module === 'support')
      );
      
      notifPerms.forEach(p => {
        if (p) {
          console.log(`  ✓ ${p.module}:${p.action}`);
        }
      });
    }
    
    // Check employee permissions
    console.log('\n👤 Employee Permissions:');
    console.log('----------------------------------------');
    const employeeRole = await roleService.getRoleByName('employee');
    if (employeeRole) {
      const rolePerms = await rolePermissionService.getPermissionsByRole(employeeRole.id);
      const permIds = rolePerms.map(rp => rp.permissionId);
      const permissions = await Promise.all(
        permIds.map(id => permissionService.getPermissionById(id))
      );
      
      const notifPerms = permissions.filter(p => 
        p && (p.module === 'notifications' || p.module === 'support')
      );
      
      notifPerms.forEach(p => {
        if (p) {
          console.log(`  ✓ ${p.module}:${p.action}`);
        }
      });
    }
    
    console.log('\n✅ Permission check completed!');
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
    throw error;
  }
}

checkPermissions().catch(console.error);
