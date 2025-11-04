import { open } from 'lmdb';
import { nanoid } from 'nanoid';

const dbPath = './data/lmdb';

console.log('🚀 Initializing complete roles and permissions system...\n');

const db = open({
  path: dbPath,
  compression: true,
  maxDbs: 35,
  encoding: 'json',
});

// Open all databases
const usersDb = db.openDB({ name: 'users', encoding: 'json' });
const rolesDb = db.openDB({ name: 'roles', encoding: 'json' });
const permissionsDb = db.openDB({ name: 'permissions', encoding: 'json' });
const userRolesDb = db.openDB({ name: 'userRoles', encoding: 'json' });
const rolePermissionsDb = db.openDB({ name: 'rolePermissions', encoding: 'json' });

console.log('✅ All databases opened\n');

// ============================================
// 0. Clear existing data (except users)
// ============================================
console.log('🧹 Cleaning existing roles and permissions...');

// Clear rolePermissions
for (const { key } of rolePermissionsDb.getRange()) {
  await rolePermissionsDb.remove(key);
}

// Clear userRoles
for (const { key } of userRolesDb.getRange()) {
  await userRolesDb.remove(key);
}

// Clear permissions
for (const { key } of permissionsDb.getRange()) {
  await permissionsDb.remove(key);
}

// Clear roles
for (const { key } of rolesDb.getRange()) {
  await rolesDb.remove(key);
}

console.log('✅ Cleanup complete\n');

// ============================================
// 1. Define All Permissions
// ============================================
const allPermissions = [
  // System Admin
  { code: 'system:admin', name: 'System Administrator', description: 'Full system access', module: 'system' },
  
  // Users Module
  { code: 'users:read', name: 'View Users', description: 'View users list and details', module: 'users' },
  { code: 'users:create', name: 'Create Users', description: 'Create new users', module: 'users' },
  { code: 'users:update', name: 'Update Users', description: 'Update user information', module: 'users' },
  { code: 'users:delete', name: 'Delete Users', description: 'Delete users', module: 'users' },
  { code: 'users:assign-role', name: 'Assign Roles', description: 'Assign roles to users', module: 'users' },
  { code: 'users:export', name: 'Export Users', description: 'Export users data', module: 'users' },
  
  // Roles Module
  { code: 'roles:read', name: 'View Roles', description: 'View roles list and details', module: 'roles' },
  { code: 'roles:create', name: 'Create Roles', description: 'Create new roles', module: 'roles' },
  { code: 'roles:update', name: 'Update Roles', description: 'Update role information', module: 'roles' },
  { code: 'roles:delete', name: 'Delete Roles', description: 'Delete roles', module: 'roles' },
  
  // Permissions Module
  { code: 'permissions:read', name: 'View Permissions', description: 'View permissions list', module: 'permissions' },
  { code: 'permissions:create', name: 'Create Permissions', description: 'Create new permissions', module: 'permissions' },
  { code: 'permissions:update', name: 'Update Permissions', description: 'Update permissions', module: 'permissions' },
  { code: 'permissions:delete', name: 'Delete Permissions', description: 'Delete permissions', module: 'permissions' },
  { code: 'permissions:assign', name: 'Assign Permissions', description: 'Assign permissions to roles', module: 'permissions' },
  
  // Tasks Module
  { code: 'tasks:read', name: 'View Tasks', description: 'View tasks list and details', module: 'tasks' },
  { code: 'tasks:create', name: 'Create Tasks', description: 'Create new tasks', module: 'tasks' },
  { code: 'tasks:update', name: 'Update Tasks', description: 'Update task information', module: 'tasks' },
  { code: 'tasks:delete', name: 'Delete Tasks', description: 'Delete tasks', module: 'tasks' },
  { code: 'tasks:assign', name: 'Assign Tasks', description: 'Assign tasks to users', module: 'tasks' },
  { code: 'tasks:comment', name: 'Comment on Tasks', description: 'Add comments to tasks', module: 'tasks' },
  { code: 'tasks:attach', name: 'Attach Files', description: 'Attach files to tasks', module: 'tasks' },
  { code: 'tasks:export', name: 'Export Tasks', description: 'Export tasks data', module: 'tasks' },
  
  // Reports Module
  { code: 'reports:read', name: 'View Reports', description: 'View reports', module: 'reports' },
  { code: 'reports:create', name: 'Create Reports', description: 'Create new reports', module: 'reports' },
  { code: 'reports:export', name: 'Export Reports', description: 'Export reports data', module: 'reports' },
  { code: 'reports:analytics', name: 'Analytics Access', description: 'Access analytics and insights', module: 'reports' },
  
  // Notifications Module
  { code: 'notifications:read', name: 'View Notifications', description: 'View notifications', module: 'notifications' },
  { code: 'notifications:create', name: 'Create Notifications', description: 'Send notifications', module: 'notifications' },
  { code: 'notifications:update', name: 'Update Notifications', description: 'Update notifications', module: 'notifications' },
  { code: 'notifications:delete', name: 'Delete Notifications', description: 'Delete notifications', module: 'notifications' },
  
  // Support Module
  { code: 'support:read', name: 'View Support Tickets', description: 'View support tickets', module: 'support' },
  { code: 'support:create', name: 'Create Support Tickets', description: 'Create support tickets', module: 'support' },
  { code: 'support:update', name: 'Update Support Tickets', description: 'Update support tickets', module: 'support' },
  { code: 'support:close', name: 'Close Support Tickets', description: 'Close support tickets', module: 'support' },
  { code: 'support:assign', name: 'Assign Support Tickets', description: 'Assign tickets to agents', module: 'support' },
  
  // Settings Module
  { code: 'settings:read', name: 'View Settings', description: 'View system settings', module: 'settings' },
  { code: 'settings:update', name: 'Update Settings', description: 'Update system settings', module: 'settings' },
  
  // Audit Module
  { code: 'audit:read', name: 'View Audit Logs', description: 'View audit logs', module: 'audit' },
  { code: 'audit:export', name: 'Export Audit Logs', description: 'Export audit logs', module: 'audit' },
  
  // Positions Module
  { code: 'positions:read', name: 'View Positions', description: 'View positions list', module: 'positions' },
  { code: 'positions:create', name: 'Create Positions', description: 'Create new positions', module: 'positions' },
  { code: 'positions:update', name: 'Update Positions', description: 'Update positions', module: 'positions' },
  { code: 'positions:delete', name: 'Delete Positions', description: 'Delete positions', module: 'positions' },
];

console.log('📋 Creating permissions...');
const permissionMap = new Map();

for (const perm of allPermissions) {
  const permId = nanoid();
  const [module, action] = perm.code.split(':');
  const permission = {
    id: permId,
    module: module,
    action: action,
    name: perm.name,
    description: perm.description,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await permissionsDb.put(permId, permission);
  permissionMap.set(perm.code, permId);
  console.log(`  ✓ ${perm.code}`);
}

console.log(`\n✅ ${allPermissions.length} permissions created\n`);

// ============================================
// 2. Define All Roles with their Permissions
// ============================================
const allRoles = [
  {
    name: 'Super Admin',
    nameAr: 'المدير العام',
    description: 'Full system access with all permissions',
    descriptionAr: 'صلاحيات كاملة للنظام',
    permissions: ['system:admin'], // This gives access to everything
  },
  {
    name: 'Administrator',
    nameAr: 'المدير',
    description: 'System administrator with most permissions',
    descriptionAr: 'مدير النظام مع معظم الصلاحيات',
    permissions: [
      'system:admin',
      'users:read', 'users:create', 'users:update', 'users:assign-role',
      'roles:read', 'roles:create', 'roles:update',
      'permissions:read', 'permissions:assign',
      'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete', 'tasks:assign',
      'reports:read', 'reports:create', 'reports:export', 'reports:analytics',
      'notifications:read', 'notifications:create',
      'support:read', 'support:create', 'support:update', 'support:close', 'support:assign',
      'settings:read', 'settings:update',
      'audit:read', 'audit:export',
      'positions:read', 'positions:create', 'positions:update', 'positions:delete',
    ],
  },
  {
    name: 'Manager',
    nameAr: 'مدير',
    description: 'Department or team manager',
    descriptionAr: 'مدير القسم أو الفريق',
    permissions: [
      'users:read', 'users:create', 'users:update',
      'roles:read',
      'tasks:read', 'tasks:create', 'tasks:update', 'tasks:assign', 'tasks:comment', 'tasks:attach',
      'reports:read', 'reports:create', 'reports:analytics',
      'notifications:read',
      'support:read', 'support:create', 'support:update',
      'positions:read',
    ],
  },
  {
    name: 'Team Leader',
    nameAr: 'قائد الفريق',
    description: 'Team leader with task management',
    descriptionAr: 'قائد الفريق مع إدارة المهام',
    permissions: [
      'users:read',
      'tasks:read', 'tasks:create', 'tasks:update', 'tasks:assign', 'tasks:comment', 'tasks:attach',
      'reports:read',
      'notifications:read',
      'support:read', 'support:create',
      'positions:read',
    ],
  },
  {
    name: 'Employee',
    nameAr: 'موظف',
    description: 'Regular employee with basic access',
    descriptionAr: 'موظف عادي مع صلاحيات أساسية',
    permissions: [
      'users:read',
      'tasks:read', 'tasks:update', 'tasks:comment', 'tasks:attach',
      'reports:read',
      'notifications:read',
      'support:read', 'support:create',
      'positions:read',
    ],
  },
  {
    name: 'HR Manager',
    nameAr: 'مدير الموارد البشرية',
    description: 'Human resources manager',
    descriptionAr: 'مدير الموارد البشرية',
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:export',
      'roles:read', 'roles:create', 'roles:update',
      'permissions:read',
      'tasks:read',
      'reports:read', 'reports:create', 'reports:export',
      'notifications:read', 'notifications:create',
      'audit:read',
      'positions:read', 'positions:create', 'positions:update', 'positions:delete',
    ],
  },
  {
    name: 'Project Manager',
    nameAr: 'مدير المشروع',
    description: 'Project manager with full task management',
    descriptionAr: 'مدير المشروع مع إدارة كاملة للمهام',
    permissions: [
      'users:read',
      'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete', 'tasks:assign', 'tasks:comment', 'tasks:attach', 'tasks:export',
      'reports:read', 'reports:create', 'reports:analytics',
      'notifications:read',
      'positions:read',
    ],
  },
  {
    name: 'Support Agent',
    nameAr: 'وكيل الدعم',
    description: 'Customer support agent',
    descriptionAr: 'وكيل دعم العملاء',
    permissions: [
      'users:read',
      'support:read', 'support:create', 'support:update', 'support:close',
      'notifications:read',
      'tasks:read',
    ],
  },
  {
    name: 'Support Manager',
    nameAr: 'مدير الدعم',
    description: 'Support team manager',
    descriptionAr: 'مدير فريق الدعم',
    permissions: [
      'users:read',
      'support:read', 'support:create', 'support:update', 'support:close', 'support:assign',
      'notifications:read', 'notifications:create',
      'reports:read', 'reports:create',
      'tasks:read',
    ],
  },
  {
    name: 'Analyst',
    nameAr: 'محلل',
    description: 'Data analyst with reporting access',
    descriptionAr: 'محلل بيانات مع صلاحيات التقارير',
    permissions: [
      'users:read',
      'tasks:read',
      'reports:read', 'reports:create', 'reports:export', 'reports:analytics',
      'audit:read', 'audit:export',
      'positions:read',
    ],
  },
  {
    name: 'Auditor',
    nameAr: 'مدقق',
    description: 'System auditor with read-only access',
    descriptionAr: 'مدقق النظام مع صلاحيات القراءة فقط',
    permissions: [
      'users:read',
      'roles:read',
      'permissions:read',
      'tasks:read',
      'reports:read',
      'audit:read', 'audit:export',
      'positions:read',
    ],
  },
  {
    name: 'Guest',
    nameAr: 'ضيف',
    description: 'Guest user with minimal access',
    descriptionAr: 'مستخدم ضيف مع صلاحيات محدودة',
    permissions: [
      'tasks:read',
      'reports:read',
      'notifications:read',
    ],
  },
];

console.log('👥 Creating roles...');
const roleMap = new Map();

for (const role of allRoles) {
  const roleId = nanoid();
  const roleData = {
    id: roleId,
    name: role.name,
    nameAr: role.nameAr,
    description: role.description,
    descriptionAr: role.descriptionAr,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await rolesDb.put(roleId, roleData);
  roleMap.set(role.name, roleId);
  
  console.log(`  ✓ ${role.name} (${role.nameAr})`);
  
  // Assign permissions to role
  for (const permCode of role.permissions) {
    const permId = permissionMap.get(permCode);
    if (permId) {
      const rpId = nanoid();
      const rolePermission = {
        id: rpId,
        roleId: roleId,
        permissionId: permId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await rolePermissionsDb.put(rpId, rolePermission);
    }
  }
}

console.log(`\n✅ ${allRoles.length} roles created with permissions\n`);

// ============================================
// 3. Update Admin User with Super Admin Role
// ============================================
console.log('👤 Updating admin user...');

// Find admin user
let adminUser = null;
for (const { value } of usersDb.getRange()) {
  if (value.email === 'admin@admin.com') {
    adminUser = value;
    break;
  }
}

if (adminUser) {
  // Remove old role assignment
  const oldRoles = [];
  for (const { key, value } of userRolesDb.getRange()) {
    if (value.userId === adminUser.id) {
      oldRoles.push(key);
    }
  }
  
  for (const roleKey of oldRoles) {
    await userRolesDb.remove(roleKey);
  }
  
  // Assign Super Admin role
  const superAdminRoleId = roleMap.get('Super Admin');
  const userRoleId = nanoid();
  const userRole = {
    id: userRoleId,
    userId: adminUser.id,
    roleId: superAdminRoleId,
    assignedBy: adminUser.id,
    assignedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await userRolesDb.put(userRoleId, userRole);
  console.log('  ✓ Admin user assigned Super Admin role');
} else {
  console.log('  ⚠ Admin user not found');
}

console.log('\n🎉 Complete roles and permissions system initialized!\n');
console.log('📊 Summary:');
console.log(`   - ${allPermissions.length} permissions created`);
console.log(`   - ${allRoles.length} roles created`);
console.log(`   - Admin user updated with Super Admin role\n`);

console.log('🔐 Roles created:');
for (const role of allRoles) {
  console.log(`   • ${role.name} (${role.nameAr})`);
}

console.log('\n✨ Ready to use!');

db.close();
