import { open } from 'lmdb';

const db = open({
  path: './data/lmdb',
  compression: true,
  encoding: 'json',
  maxDbs: 35,
});

console.log('=== Checking All Databases ===\n');

// Check Users
const usersDb = db.openDB({ name: 'users', encoding: 'json' });
console.log('📊 Users:');
let userCount = 0;
for (const { key, value } of usersDb.getRange()) {
  console.log(`  ${value.email} (${key})`);
  userCount++;
}
console.log(`  Total: ${userCount}\n`);

// Check Roles
const rolesDb = db.openDB({ name: 'roles', encoding: 'json' });
console.log('🎭 Roles:');
let roleCount = 0;
for (const { key, value } of rolesDb.getRange()) {
  console.log(`  ${value.name} (${key})`);
  roleCount++;
}
console.log(`  Total: ${roleCount}\n`);

// Check UserRoles
const userRolesDb = db.openDB({ name: 'userRoles', encoding: 'json' });
console.log('🔗 User-Role Assignments:');
let assignmentCount = 0;
const assignments = [];
for (const { key, value } of userRolesDb.getRange()) {
  assignments.push(value);
  assignmentCount++;
}

if (assignmentCount === 0) {
  console.log('  ⚠️  NO USER ROLES ASSIGNED!');
} else {
  assignments.forEach(a => {
    console.log(`  User: ${a.userId} -> Role: ${a.roleId}`);
    console.log(`    Assigned by: ${a.assignedBy} at ${a.assignedAt}`);
  });
}
console.log(`  Total: ${assignmentCount}\n`);

db.close();
