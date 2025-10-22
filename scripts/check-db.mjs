#!/usr/bin/env node
/**
 * Quick script to check database and create admin user
 */

import { open } from 'lmdb';
import { resolve } from 'path';
import argon2 from 'argon2';

const dbPath = resolve(process.cwd(), 'data/lmdb');
const db = open({
  path: dbPath,
  compression: true,
});

async function checkAndCreateAdmin() {
  console.log('🔍 Checking database...\n');

  // Check users
  const users = db.get('users') || {};
  const userList = Object.values(users);
  
  console.log(`Found ${userList.length} users`);
  
  if (userList.length === 0) {
    console.log('\n📝 Creating default admin user...');
    
    const hashedPassword = await argon2.hash('Admin@123456');
    const adminId = 'admin-001';
    
    const adminUser = {
      id: adminId,
      email: 'admin@ameen.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: 'super-admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users[adminId] = adminUser;
    await db.put('users', users);
    
    console.log('✅ Admin user created successfully!');
    console.log('\n📌 Login credentials:');
    console.log('   Email: admin@ameen.com');
    console.log('   Password: Admin@123456\n');
  } else {
    console.log('\n👤 Existing users:');
    userList.forEach((user) => {
      console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
    });
  }

  db.close();
}

checkAndCreateAdmin().catch(console.error);
