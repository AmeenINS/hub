import { open } from 'lmdb';
import path from 'path';
import { fileURLToPath } from 'url';
import * as argon2 from 'argon2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(path.dirname(__dirname), 'data', 'lmdb');

console.log('🚀 Initializing database with maxDbs=25...\n');

const db = open({ 
  path: dbPath,
  compression: true,
  maxDbs: 25,
  mapSize: 10485760,
  encoding: 'json',
});

// Open all required databases
const databases = {
  users: db.openDB({ name: 'users', encoding: 'json' }),
  roles: db.openDB({ name: 'roles', encoding: 'json' }),
  permissions: db.openDB({ name: 'permissions', encoding: 'json' }),
  userRoles: db.openDB({ name: 'userRoles', encoding: 'json' }),
  rolePermissions: db.openDB({ name: 'rolePermissions', encoding: 'json' }),
  positions: db.openDB({ name: 'positions', encoding: 'json' }),
  tasks: db.openDB({ name: 'tasks', encoding: 'json' }),
  taskAssignments: db.openDB({ name: 'taskAssignments', encoding: 'json' }),
  taskComments: db.openDB({ name: 'taskComments', encoding: 'json' }),
  taskAttachments: db.openDB({ name: 'taskAttachments', encoding: 'json' }),
  taskActivities: db.openDB({ name: 'taskActivities', encoding: 'json' }),
  auditLogs: db.openDB({ name: 'auditLogs', encoding: 'json' }),
  sessions: db.openDB({ name: 'sessions', encoding: 'json' }),
  twoFactorAuth: db.openDB({ name: 'twoFactorAuth', encoding: 'json' }),
  notifications: db.openDB({ name: 'notifications', encoding: 'json' }),
  support_messages: db.openDB({ name: 'support_messages', encoding: 'json' }),
};

console.log('✅ All databases initialized\n');

// Create admin user
const adminPassword = await argon2.hash('Admin@123');
const adminId = 'vZARQ_lGBjDqrzmdMyrCK';
const admin = {
  id: adminId,
  email: 'admin@admin.com',
  password: adminPassword,
  fullNameEn: 'Admin User',
  fullNameAr: 'مدير النظام',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await databases.users.put(adminId, admin);
console.log('✅ Admin user created');

// Create admin role
const adminRoleId = '0k21khzVk6oEH2suztbof';
const adminRole = {
  id: adminRoleId,
  name: 'Admin',
  description: 'Administrator with full access',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await databases.roles.put(adminRoleId, adminRole);
console.log('✅ Admin role created');

// Assign admin role to admin user
const userRoleId = '7srGVgGk8UWJi2Ff7JDVm';
const userRole = {
  id: userRoleId,
  userId: adminId,
  roleId: adminRoleId,
  assignedBy: adminId,
  assignedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await databases.userRoles.put(userRoleId, userRole);
console.log('✅ Admin role assigned to admin user');

// Create system:admin permission
const adminPermId = 'LQtKmazw9qeQCQVUDVTw1';
const adminPerm = {
  id: adminPermId,
  module: 'system',
  action: 'admin',
  description: 'Full system administrator access',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await databases.permissions.put(adminPermId, adminPerm);
console.log('✅ Admin permission created');

// Assign permission to admin role
const rolePermId = 'VnMtwe-FxaX36CNtpN-oS';
const rolePerm = {
  id: rolePermId,
  roleId: adminRoleId,
  permissionId: adminPermId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await databases.rolePermissions.put(rolePermId, rolePerm);
console.log('✅ Permission assigned to admin role');

console.log('\n🎉 Database initialization complete!');
console.log('\nLogin credentials:');
console.log('Email: admin@admin.com');
console.log('Password: Admin@123');

db.close();
