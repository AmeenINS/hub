// Test UserRoleService directly
import { UserRoleService } from '../src/core/data/user-service.js';

const service = new UserRoleService();

const testUserId = 'gRQLPtTWINN0EXE3G5zN3'; // milad.raeisi@ameen.me  
const newRoleId = 'hOGJxs3-soqtnp-43x_Gj'; // Employee role
const adminId = 'dozLPIR8dhA7gKUmuVtNB';

console.log('🧪 Testing UserRoleService...\n');

async function test() {
  try {
    // 1. Get existing roles
    console.log('1️⃣ Get existing roles...');
    const existing = await service.getUserRolesByUser(testUserId);
    console.log('Existing roles:', existing);
    console.log();

    // 2. Remove existing roles
    console.log('2️⃣ Remove existing roles...');
    for (const role of existing) {
      const removed = await service.removeRoleFromUser(testUserId, role.roleId);
      console.log(`Removed ${role.roleId}:`, removed);
    }
    console.log();

    // 3. Assign new role
    console.log('3️⃣ Assign new role...');
    const assigned = await service.assignRoleToUser(testUserId, newRoleId, adminId);
    console.log('Assigned:', assigned);
    console.log();

    // 4. Verify
    console.log('4️⃣ Verify...');
    const final = await service.getUserRolesByUser(testUserId);
    console.log('Final roles:', final);
    console.log();

    if (final.length === 1 && final[0].roleId === newRoleId) {
      console.log('✅ TEST PASSED!');
    } else {
      console.log('❌ TEST FAILED!');
      console.log('Expected 1 role with roleId:', newRoleId);
      console.log('Got:', final.length, 'roles');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
