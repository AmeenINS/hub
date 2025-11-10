import 'dotenv/config';
import { RolePermissionService } from './src/core/data/user-service';

async function checkPermissions() {
  const rolePermService = new RolePermissionService();
  
  console.log('\n=== Checking Admin User Permissions ===\n');
  
  // Get admin user ID (should be the one we created)
  const adminUserId = 'admin-super-001'; // From init-db.ts
  
  try {
    const permissions = await rolePermService.getUserPermissions(adminUserId);
    
    console.log('Admin User Permissions:');
    permissions.forEach(perm => {
      console.log(`  - ${perm.module}:${perm.action} (${perm.name})`);
    });
    
    console.log('\n=== Checking specific permission ===');
    console.log('Has users:read?', permissions.some(p => p.module === 'users' && p.action === 'read'));
    console.log('Has system:admin?', permissions.some(p => p.module === 'system' && p.action === 'admin'));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPermissions();
