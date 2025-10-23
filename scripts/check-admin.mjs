import { open } from 'lmdb';

const dbPath = './data/lmdb';

console.log('🔍 Checking admin user...\n');

const db = open({
  path: dbPath,
  compression: true,
  maxDbs: 35,
  encoding: 'json',
});

const usersDb = db.openDB({ name: 'users', encoding: 'json' });

console.log('📋 All users in database:');
for (const { value } of usersDb.getRange()) {
  console.log('\n-------------------');
  console.log('ID:', value.id);
  console.log('Email:', value.email);
  console.log('Name:', value.name);
  console.log('Username:', value.username);
  console.log('Password Hash:', value.password?.substring(0, 50) + '...');
  console.log('Is Active:', value.isActive);
  console.log('Email Verified:', value.emailVerified);
}

db.close();
