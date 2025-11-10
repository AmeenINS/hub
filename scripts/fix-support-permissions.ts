/**
 * Script: fix-support-permissions.ts
 * Fix support module permissions - Super Admin should have SUPER_ADMIN level (5), not NONE (0)
 *
 * Run with: npx tsx scripts/fix-support-permissions.ts
 */
import { RoleService } from '../src/core/data/user-service';
import { PermissionLevel } from '../src/core/auth/permission-levels';

async function run() {
  const roleService = new RoleService();
  const roles = await roleService.getAllRoles();

  console.log(`Found ${roles.length} roles. Fixing support permissions...`);

  for (const role of roles) {
    let levels: Record<string, number> = {};
    if (role.moduleLevels) {
      levels = typeof role.moduleLevels === 'string' ? JSON.parse(role.moduleLevels) : role.moduleLevels;
    }

    const name = role.name.toLowerCase();
    let shouldBeLevel: number | null = null;

    // Fix specific roles
    if (name.includes('super')) {
      shouldBeLevel = PermissionLevel.SUPER_ADMIN; // 5
    } else if (name.includes('admin') && !name.includes('super')) {
      shouldBeLevel = PermissionLevel.ADMIN; // 4
    } else if (name.includes('manager')) {
      shouldBeLevel = PermissionLevel.FULL; // 3
    } else if (name.includes('sales') || name.includes('employee') || name.includes('rep')) {
      shouldBeLevel = PermissionLevel.WRITE; // 2
    } else if (name.includes('viewer')) {
      shouldBeLevel = PermissionLevel.READ; // 1
    }

    if (shouldBeLevel !== null && levels.support !== shouldBeLevel) {
      console.log(`🔧 Fixing role '${role.name}': support level ${levels.support} → ${shouldBeLevel}`);
      levels.support = shouldBeLevel;
      
      const updated = await roleService.updateRole(role.id, { moduleLevels: levels });
      console.log(`✅ Fixed support permission for role '${role.name}' (id=${role.id})`);
    } else {
      console.log(`✔ Role '${role.name}' support level is correct: ${levels.support}`);
    }
  }

  console.log('Done fixing support module permissions.');
}

run().catch(err => {
  console.error('Failed to fix support permissions:', err);
  process.exit(1);
});