import { open } from 'lmdb';
import { nanoid } from 'nanoid';

const db = open({
  path: './data/lmdb',
  compression: true,
  encoding: 'json',
  maxDbs: 35,
});

const userRolesDb = db.openDB({ name: 'userRoles', encoding: 'json' });

console.log('🧪 Testing User Role Assignment...\n');

// Test user and role IDs
const testUserId = '4Xv8WoCSCpg1DrAwnnRLF'; // ramya.venugopal@ameen.me
const oldRoleId = 'jYhE7kdQo7sb7scAII965'; // Team Leader
const newRoleId = '_vn-4rD9aDwA-RMG34TZM'; // Manager
const adminId = 'dozLPIR8dhA7gKUmuVtNB';

console.log('Test User:', testUserId);
console.log('Old Role:', oldRoleId);
console.log('New Role:', newRoleId);
console.log();

// Step 1: Check existing roles
console.log('1️⃣ Checking existing roles...');
let existingRoles = [];
for (const { key, value } of userRolesDb.getRange()) {
  if (value.userId === testUserId) {
    existingRoles.push(value);
    console.log('  Found:', value);
  }
}
console.log(`  Total: ${existingRoles.length}\n`);

// Step 2: Remove existing roles
console.log('2️⃣ Removing existing roles...');
for (const role of existingRoles) {
  const deleted = await userRolesDb.remove(role.id);
  console.log(`  Removed ${role.id}:`, deleted);
}
console.log();

// Step 3: Assign new role
console.log('3️⃣ Assigning new role...');
const newUserRoleId = nanoid();
const newUserRole = {
  id: newUserRoleId,
  userId: testUserId,
  roleId: newRoleId,
  assignedBy: adminId,
  assignedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await userRolesDb.put(newUserRoleId, newUserRole);
console.log('  Created:', newUserRole);
console.log();

// Step 4: Verify
console.log('4️⃣ Verifying...');
const verified = await userRolesDb.get(newUserRoleId);
console.log('  Retrieved:', verified);
console.log();

// Step 5: Check all roles for this user
console.log('5️⃣ Final check - all roles for this user:');
let finalRoles = [];
for (const { key, value } of userRolesDb.getRange()) {
  if (value.userId === testUserId) {
    finalRoles.push(value);
    console.log('  -', value);
  }
}
console.log(`  Total: ${finalRoles.length}\n`);

if (finalRoles.length === 1 && finalRoles[0].roleId === newRoleId) {
  console.log('✅ TEST PASSED! Role update works correctly.');
} else {
  console.log('❌ TEST FAILED! Expected 1 role with new roleId.');
}

await db.close();
