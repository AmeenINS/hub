/**
 * Quick check for milad user
 */

import { UserService } from '@/lib/db/user-service';

async function checkMilad() {
  const userService = new UserService();
  
  const milad = await userService.getUserByEmail('milad.raeisi@ameen.me');
  
  if (!milad) {
    console.log('❌ Milad user not found');
    return;
  }
  
  console.log('✅ Milad user:');
  console.log(JSON.stringify({
    id: milad.id,
    email: milad.email,
    fullNameEn: milad.fullNameEn,
    managerId: milad.managerId,
    isActive: milad.isActive,
    position: milad.position
  }, null, 2));
  
  console.log('\n🔍 Manager status:', milad.managerId ? '❌ Has manager (NOT top-level admin)' : '✅ No manager (Top-level admin)');
}

checkMilad()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
