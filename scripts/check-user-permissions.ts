/**
 * Script to check user permissions
 * Usage: npx tsx scripts/check-user-permissions.ts <email>
 */

import { AdvancedPermissionService } from '../src/core/auth/advanced-permission-service';
import { UserService } from '../src/core/data/user-service';

async function checkUserPermissions() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Please provide user email');
    console.log('Usage: npx tsx scripts/check-user-permissions.ts <email>');
    process.exit(1);
  }

  console.log(`\n🔍 Checking permissions for: ${email}\n`);

  try {
    // Find user by email
    const userService = new UserService();
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log(`👤 User: ${user.fullNameEn || 'N/A'}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 User ID: ${user.id}\n`);

    // Get user profile
    const profile = await AdvancedPermissionService.getUserPermissionProfile(user.id);

    console.log('📋 Module Permissions:');
    console.log('─────────────────────────────────────────');
    
    const modules = Object.entries(profile.moduleLevels);
    if (modules.length === 0) {
      console.log('   No permissions assigned');
    } else {
      modules.forEach(([module, level]) => {
        const levelNames = ['NONE', 'READ', 'WRITE', 'FULL', 'ADMIN', 'SUPER_ADMIN'];
        const levelName = typeof level === 'number' ? levelNames[level] : level;
        console.log(`   ${module.padEnd(25)} → ${levelName}`);
      });
    }

    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUserPermissions();
