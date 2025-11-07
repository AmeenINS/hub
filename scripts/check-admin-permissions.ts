/**
 * Check admin user permissions
 */

import { RolePermissionService } from '@/core/data/user-service';
import { checkUserPermission } from '@/core/auth/permissions';

async function checkAdminPermissions() {
  console.log('🔍 Checking admin permissions...\n');

  const adminUserId = 'dozLPIR8dhA7gKUmuVtNB'; // From script output
  const rolePermissionService = new RolePermissionService();

  // Get all permissions
  console.log('📋 Getting all user permissions...');
  const permissions = await rolePermissionService.getUserPermissions(adminUserId);
  console.log(`   Found ${permissions.length} permissions\n`);

  // Check for system admin
  const isSystemAdmin = permissions.some(
    (perm) => perm.module === 'system' && perm.action === 'admin'
  );
  console.log(`🔐 System Admin: ${isSystemAdmin ? '✅ Yes' : '❌ No'}\n`);

  // Check for users module permissions
  console.log('👥 Users module permissions:');
  const usersPerms = permissions.filter(p => p.module === 'users');
  if (usersPerms.length === 0) {
    console.log('   ❌ No permissions found!');
  } else {
    usersPerms.forEach(p => {
      console.log(`   ✅ ${p.action}`);
    });
  }

  // Test permission check function
  console.log('\n🧪 Testing checkUserPermission function:');
  const hasReadPermission = await checkUserPermission(adminUserId, 'users', 'read');
  console.log(`   users:read = ${hasReadPermission ? '✅ Yes' : '❌ No'}`);

  // Show all permissions grouped by module
  console.log('\n📊 All permissions by module:');
  const byModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm.action);
    return acc;
  }, {} as Record<string, string[]>);

  Object.entries(byModule).sort().forEach(([module, actions]) => {
    console.log(`   ${module}: ${actions.join(', ')}`);
  });

  console.log('\n✅ Check complete!');
}

checkAdminPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
