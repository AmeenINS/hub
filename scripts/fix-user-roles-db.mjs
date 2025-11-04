import { open } from 'lmdb';

const db = open({
  path: './data/lmdb',
  compression: true,
  encoding: 'json',
  maxDbs: 35,
});

const userRolesDb = db.openDB({ name: 'userRoles', encoding: 'json' });

console.log('🔧 Fixing userRoles database...');

try {
  // Clear all corrupted data
  console.log('1️⃣ Clearing corrupted data...');
  await userRolesDb.clearAsync();
  
  console.log('✅ UserRoles database cleared successfully');
  console.log('\n⚠️  You need to re-run the super admin script to restore admin permissions:');
  console.log('   npx tsx scripts/create-super-admin.ts');
  
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  await db.close();
}
