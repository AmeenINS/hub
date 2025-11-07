/**
 * Script to check user permissions
 * Run this to verify admin user has correct permissions
 */

import { UserService } from '@/core/data/user-service';
import { RolePermissionService } from '@/core/data/user-service';

async function checkUserPermissions() {
  const userService = new UserService();
  const rolePermissionService = new RolePermissionService();

  console.log('🔍 Checking user: milad.raeisi@ameen.me\n');

  // Find milad user
  const miladUser = await userService.getUserByEmail('milad.raeisi@ameen.me');
  
  if (!miladUser) {
    console.log('❌ User not found!');
    return;
  }

  console.log('✅ User found:');
  console.log(`   ID: ${miladUser.id}`);
  console.log(`   Email: ${miladUser.email}`);
  console.log(`   Name: ${miladUser.fullNameEn}`);
  console.log(`   Active: ${miladUser.isActive}`);
  console.log(`   Manager ID: ${miladUser.managerId || 'None (Top-level admin)'}`);
  console.log(`   Position: ${miladUser.position || 'Not set'}`);

  // Get user permissions
  console.log('\n📋 Checking permissions...');
  const permissions = await rolePermissionService.getUserPermissions(miladUser.id);
  
  console.log(`\nTotal permissions: ${permissions.length}`);
  
  if (permissions.length === 0) {
    console.log('\n⚠️  No permissions found! User needs to be assigned a role with permissions.');
    console.log('\n💡 To fix this, run: npx tsx scripts/init-roles.mjs');
    return;
  }

  console.log('\nPermissions by module:');
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm.action);
    return acc;
  }, {} as Record<string, string[]>);

  Object.entries(permissionsByModule).forEach(([module, actions]) => {
    console.log(`   ${module}: ${actions.join(', ')}`);
  });

  // Check specifically for users module
  const usersPermissions = permissions.filter(p => p.module === 'users');
  console.log(`\n🔍 Users module permissions: ${usersPermissions.length}`);
  if (usersPermissions.length > 0) {
    usersPermissions.forEach(p => {
      console.log(`   ✅ ${p.action}`);
    });
  } else {
    console.log('   ❌ No "users" module permissions!');
  }

  // Get all users to check
  console.log('\n👥 Total users in database:');
  const allUsers = await userService.getAllUsers();
  console.log(`   ${allUsers.length} users found`);
  
  console.log('\n📊 Users summary:');
  allUsers.forEach(u => {
    console.log(`   - ${u.fullNameEn} (${u.email}) - Manager: ${u.managerId || 'None'}`);
  });
}

checkUserPermissions()
  .then(() => {
    console.log('\n✨ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
