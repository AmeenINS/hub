import { open } from 'lmdb';

const db = open({
  path: './data/lmdb',
  compression: true,
  encoding: 'json',
  maxDbs: 35,
});

const userRolesDb = db.openDB({ name: 'userRoles', encoding: 'json' });

// Get all user roles
console.log('=== All User Roles ===');
const allRoles = [];
for (const { key, value } of userRolesDb.getRange()) {
  console.log(`${key}:`, value);
  allRoles.push(value);
}

console.log('\n=== Total:', allRoles.length);

// Group by user
const byUser = {};
allRoles.forEach(role => {
  if (!byUser[role.userId]) {
    byUser[role.userId] = [];
  }
  byUser[role.userId].push(role);
});

console.log('\n=== By User ===');
Object.entries(byUser).forEach(([userId, roles]) => {
  console.log(`User ${userId}:`, roles.map(r => r.roleId));
});

db.close();
