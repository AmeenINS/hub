/**
 * Script: add-support-module.ts
 * Adds the 'support' module permission levels to all existing roles if missing.
 * Uses heuristic mapping based on role name to assign reasonable defaults.
 *
 * Run with: npx tsx scripts/add-support-module.ts
 */
import { RoleService } from '../src/core/data/user-service';
import { PermissionLevel } from '../src/core/auth/permission-levels';

async function run() {
  const roleService = new RoleService();
  const roles = await roleService.getAllRoles();

  console.log(`Found ${roles.length} roles. Processing support moduleLevels...`);

  for (const role of roles) {
    let levels: Record<string, number> = {};
    if (role.moduleLevels) {
      levels = typeof role.moduleLevels === 'string' ? JSON.parse(role.moduleLevels) : role.moduleLevels;
    }

    // Skip if already has support
    if (levels.support !== undefined) {
      console.log(`✔ Role '${role.name}' already has support level = ${levels.support}`);
      continue;
    }

    // Infer default level based on role name patterns
    const name = role.name.toLowerCase();
    let assigned: number = PermissionLevel.READ;
    if (name.includes('super')) assigned = PermissionLevel.SUPER_ADMIN;
    else if (name.includes('admin')) assigned = PermissionLevel.ADMIN;
    else if (name.includes('manager')) assigned = PermissionLevel.FULL;
    else if (name.includes('sales') || name.includes('employee') || name.includes('rep')) assigned = PermissionLevel.WRITE;
    else if (name.includes('viewer')) assigned = PermissionLevel.READ;

    levels.support = assigned;

    const updated = await roleService.updateRole(role.id, { moduleLevels: levels });
    console.log(`✅ Added support=${assigned} to role '${role.name}' (id=${role.id})`);
  }

  console.log('Done updating support module levels.');
}

run().catch(err => {
  console.error('Failed to add support module levels:', err);
  process.exit(1);
});
