import { open } from 'lmdb';
import * as argon2 from 'argon2';

const dbPath = './data/lmdb';

console.log('🔐 Testing admin login...\n');

const db = open({
  path: dbPath,
  compression: true,
  maxDbs: 35,
  encoding: 'json',
});

const usersDb = db.openDB({ name: 'users', encoding: 'json' });

// Find admin user
let adminUser = null;
for (const { value } of usersDb.getRange()) {
  if (value.email === 'admin@admin.com') {
    adminUser = value;
    break;
  }
}

if (!adminUser) {
  console.log('❌ Admin user not found!');
  db.close();
  process.exit(1);
}

console.log('✅ Admin user found:');
console.log('   ID:', adminUser.id);
console.log('   Email:', adminUser.email);
console.log('   Is Active:', adminUser.isActive);
console.log('   Password Hash:', adminUser.password?.substring(0, 50) + '...');

// Test password verification
const testPassword = 'Admin@123';
console.log('\n🔍 Testing password verification...');
console.log('   Test Password:', testPassword);

try {
  const isValid = await argon2.verify(adminUser.password, testPassword);
  console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');
  
  if (!isValid) {
    console.log('\n⚠️  Password verification failed!');
    console.log('   This means the stored password hash does not match "Admin@123"');
  } else {
    console.log('\n✅ Password verification successful!');
    console.log('   The issue might be in the API or frontend.');
  }
} catch (error) {
  console.log('   ❌ Error:', error.message);
}

db.close();
