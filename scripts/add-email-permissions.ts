/**
 * Script: add-email-module.ts
 * Adds the 'email' module permission levels to all existing roles if missing.
 * Uses heuristic mapping based on role name to assign reasonable defaults.
 *
 * Run with: npx tsx scripts/add-email-permissions.ts
 */
import { RoleService } from '../src/core/data/user-service';
import { PermissionLevel } from '../src/core/auth/permission-levels';

async function run() {
  const roleService = new RoleService();
  const roles = await roleService.getAllRoles();

  console.log(`Found ${roles.length} roles. Processing email moduleLevels...`);

  for (const role of roles) {
    let levels: Record<string, number> = {};
    if (role.moduleLevels) {
      levels = typeof role.moduleLevels === 'string' ? JSON.parse(role.moduleLevels) : role.moduleLevels;
    }

    // Skip if already has email
    if (levels.email !== undefined) {
      console.log(`✔ Role '${role.name}' already has email level = ${levels.email}`);
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

    levels.email = assigned;

    const updated = await roleService.updateRole(role.id, { moduleLevels: levels });
    console.log(`✅ Added email=${assigned} to role '${role.name}' (id=${role.id})`);
  }

  console.log('Done updating email module levels.');
}

run().catch(err => {
  console.error('Failed to add email module levels:', err);
  process.exit(1);
});
