/**
 * Database initialization script
 * Run this to initialize LMDB and create super admin
 */

import 'dotenv/config';
import { dbInitializer } from '@/lib/db/initializer';

async function main() {
  try {
    console.log('🚀 Starting database initialization...\n');
    
    await dbInitializer.initialize();
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Login with: admin@ameen.com / Admin@123456');
    console.log('   2. Change the super admin password');
    console.log('   3. Create custom roles and users');
    console.log('   4. Start building!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();
