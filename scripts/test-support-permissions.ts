/**
 * Script: test-support-permissions.ts
 * Test support permissions for current user
 *
 * Run with: npx tsx scripts/test-support-permissions.ts
 */
import { AdvancedPermissionService } from '../src/core/auth/advanced-permission-service';
import { UserService } from '../src/core/data/user-service';

async function run() {
  const userService = new UserService();
  
  // Get all users with Super Administrator role
  const users = await userService.getAllUsers();
  
  console.log(`Found ${users.length} users. Testing support permissions...`);
  
  for (const user of users) {
    const profile = await AdvancedPermissionService.getUserPermissionProfile(user.id);
    const supportLevel = await AdvancedPermissionService.getUserModuleLevel(user.id, 'support');
    
    console.log(`\n👤 User: ${user.fullNameEn || user.email}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`📋 Support Level: ${supportLevel}`);
    console.log(`📊 All Module Levels:`, profile.moduleLevels);
  }
}

run().catch(err => {
  console.error('Failed to test support permissions:', err);
  process.exit(1);
});