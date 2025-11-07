/**
 * Script to create Super Admin user
 * Creates an admin user with full access to all modules
 */

import { UserService, RoleService, UserRoleService, RolePermissionService, PermissionService } from '@/core/data/user-service';

async function createSuperAdmin() {
  const userService = new UserService();
  const roleService = new RoleService();
  const userRoleService = new UserRoleService();
  const rolePermissionService = new RolePermissionService();
  const permissionService = new PermissionService();

  console.log('🔧 Creating Super Admin User...\n');

  // Admin user details
  const adminEmail = 'admin@ameen.me';
  const adminPassword = '12332120@110';
  const adminFullNameEn = 'System Administrator';
  const adminFullNameAr = 'مدير النظام';

  // Check if admin already exists
  console.log('🔍 Checking if admin user exists...');
  const existingAdmin = await userService.getUserByEmail(adminEmail);
  
  let adminUser;
  if (existingAdmin) {
    console.log('✅ Admin user already exists!');
    console.log(`   ID: ${existingAdmin.id}`);
    console.log(`   Email: ${existingAdmin.email}`);
    adminUser = existingAdmin;
  } else {
    // Create admin user
    console.log('📝 Creating admin user...');
    adminUser = await userService.createUser({
      email: adminEmail,
      password: adminPassword,
      fullNameEn: adminFullNameEn,
      fullNameAr: adminFullNameAr,
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: false,
      position: 'System Administrator',
      department: 'IT',
    });
    console.log('✅ Admin user created!');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
  }

  // Get or create Super Admin role
  console.log('\n🔍 Checking Super Admin role...');
  let superAdminRole = await roleService.getRoleByName('Super Admin');
  
  if (!superAdminRole) {
    console.log('📝 Creating Super Admin role...');
    superAdminRole = await roleService.createRole({
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      isSystemRole: true,
    });
    console.log('✅ Super Admin role created!');
  } else {
    console.log('✅ Super Admin role already exists!');
  }

  // Assign role to admin user
  console.log('\n🔗 Assigning Super Admin role to user...');
  const existingUserRoles = await userRoleService.getUserRolesByUser(adminUser.id);
  const hasSuperAdminRole = existingUserRoles.some(ur => ur.roleId === superAdminRole.id);
  
  if (!hasSuperAdminRole) {
    await userRoleService.assignRoleToUser(adminUser.id, superAdminRole.id, adminUser.id);
    console.log('✅ Role assigned!');
  } else {
    console.log('✅ User already has Super Admin role!');
  }

  // Get all permissions
  console.log('\n📋 Getting all permissions...');
  const allPermissions = await permissionService.getAllPermissions();
  console.log(`   Found ${allPermissions.length} permissions`);

  // Assign all permissions to Super Admin role
  console.log('\n🔐 Assigning all permissions to Super Admin role...');
  const existingRolePermissions = await rolePermissionService.getPermissionsByRole(superAdminRole.id);
  const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permissionId));
  
  let assignedCount = 0;
  for (const permission of allPermissions) {
    if (!existingPermissionIds.has(permission.id)) {
      await rolePermissionService.assignPermissionToRole(superAdminRole.id, permission.id);
      assignedCount++;
    }
  }
  
  console.log(`✅ Assigned ${assignedCount} new permissions`);
  console.log(`   Total permissions: ${allPermissions.length}`);

  // Verify user permissions
  console.log('\n✅ Verifying admin permissions...');
  const adminPermissions = await rolePermissionService.getUserPermissions(adminUser.id);
  console.log(`   Admin has ${adminPermissions.length} permissions`);

  // Group permissions by module
  const permissionsByModule = adminPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm.action);
    return acc;
  }, {} as Record<string, string[]>);

  console.log('\n📊 Permissions by module:');
  Object.entries(permissionsByModule).forEach(([module, actions]) => {
    console.log(`   ${module}: ${actions.join(', ')}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Super Admin Setup Complete!');
  console.log('='.repeat(60));
  console.log('\n🔐 Login Credentials:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: Super Admin`);
  console.log(`   Permissions: All (${adminPermissions.length} total)`);
  console.log('='.repeat(60));
}

createSuperAdmin()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
