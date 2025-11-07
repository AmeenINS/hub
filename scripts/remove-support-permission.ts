/**
 * Script: remove-support-permission.ts
 * Remove support permission from Super Administrator for testing
 *
 * Run with: npx tsx scripts/remove-support-permission.ts
 */
import { RoleService } from '../src/core/data/user-service';
import { PermissionLevel } from '../src/core/auth/permission-levels';

async function run() {
  const roleService = new RoleService();
  const roles = await roleService.getAllRoles();

  console.log(`Found ${roles.length} roles. Removing support permission from Super Administrator...`);

  for (const role of roles) {
    const name = role.name.toLowerCase();
    
    if (name.includes('super') && name.includes('admin')) {
      let levels: Record<string, number> = {};
      if (role.moduleLevels) {
        levels = typeof role.moduleLevels === 'string' ? JSON.parse(role.moduleLevels) : role.moduleLevels;
      }

      console.log(`🔧 Removing support permission from role '${role.name}': ${levels.support} → 0`);
      levels.support = PermissionLevel.NONE; // 0
      
      const updated = await roleService.updateRole(role.id, { moduleLevels: levels });
      console.log(`✅ Removed support permission from role '${role.name}' (id=${role.id})`);
    }
  }

  console.log('Done removing support permission from Super Administrator for testing.');
}

run().catch(err => {
  console.error('Failed to remove support permission:', err);
  process.exit(1);
});