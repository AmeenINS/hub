/**
 * Comprehensive System Permissions Setup Script
 * 
 * This script adds all missing system permissions including:
 * - permissions:read, create, update, delete
 * - roles:read, create, update, delete
 * - location:view, view_own, view_all, track
 * - And assigns them to super-admin role
 * 
 * Run: docker exec ameen-hub npx tsx scripts/add-system-permissions.ts
 */

import { PermissionService, RoleService, RolePermissionService } from '../src/core/data/user-service';
import type { Permission } from '../src/types/database';

async function main() {
  console.log('🚀 Starting comprehensive permissions setup...\n');

  const permissionService = new PermissionService();
  const roleService = new RoleService();
  const rolePermissionService = new RolePermissionService();

  // Define all system permissions
  const systemPermissions = [
    // Permissions Management
    {
      module: 'permissions',
      action: 'read',
      descriptionEn: 'View Permissions',
      descriptionAr: 'عرض الصلاحيات'
    },
    {
      module: 'permissions',
      action: 'create',
      descriptionEn: 'Create Permissions',
      descriptionAr: 'إنشاء الصلاحيات'
    },
    {
      module: 'permissions',
      action: 'update',
      descriptionEn: 'Update Permissions',
      descriptionAr: 'تحديث الصلاحيات'
    },
    {
      module: 'permissions',
      action: 'delete',
      descriptionEn: 'Delete Permissions',
      descriptionAr: 'حذف الصلاحيات'
    },

    // Roles Management
    {
      module: 'roles',
      action: 'read',
      descriptionEn: 'View Roles',
      descriptionAr: 'عرض الأدوار'
    },
    {
      module: 'roles',
      action: 'create',
      descriptionEn: 'Create Roles',
      descriptionAr: 'إنشاء الأدوار'
    },
    {
      module: 'roles',
      action: 'update',
      descriptionEn: 'Update Roles',
      descriptionAr: 'تحديث الأدوار'
    },
    {
      module: 'roles',
      action: 'delete',
      descriptionEn: 'Delete Roles',
      descriptionAr: 'حذف الأدوار'
    },

    // Location Tracking
    {
      module: 'location',
      action: 'view',
      descriptionEn: 'View Location Tracking',
      descriptionAr: 'عرض تتبع الموقع'
    },
    {
      module: 'location',
      action: 'view_own',
      descriptionEn: 'View Own Location',
      descriptionAr: 'عرض الموقع الخاص'
    },
    {
      module: 'location',
      action: 'view_all',
      descriptionEn: 'View All Locations',
      descriptionAr: 'عرض جميع المواقع'
    },
    {
      module: 'location',
      action: 'track',
      descriptionEn: 'Track Location',
      descriptionAr: 'تتبع الموقع'
    },

    // Backup/Restore
    {
      module: 'backup',
      action: 'create',
      descriptionEn: 'Create Backup',
      descriptionAr: 'إنشاء نسخة احتياطية'
    },
    {
      module: 'backup',
      action: 'download',
      descriptionEn: 'Download Backup',
      descriptionAr: 'تنزيل النسخة الاحتياطية'
    },
    {
      module: 'backup',
      action: 'restore',
      descriptionEn: 'Restore Backup',
      descriptionAr: 'استعادة النسخة الاحتياطية'
    },
    {
      module: 'backup',
      action: 'delete',
      descriptionEn: 'Delete Backup',
      descriptionAr: 'حذف النسخة الاحتياطية'
    },

    // CRM - Contacts
    {
      module: 'contacts',
      action: 'read',
      descriptionEn: 'View Contacts',
      descriptionAr: 'عرض جهات الاتصال'
    },
    {
      module: 'contacts',
      action: 'create',
      descriptionEn: 'Create Contacts',
      descriptionAr: 'إنشاء جهات الاتصال'
    },
    {
      module: 'contacts',
      action: 'update',
      descriptionEn: 'Update Contacts',
      descriptionAr: 'تحديث جهات الاتصال'
    },
    {
      module: 'contacts',
      action: 'delete',
      descriptionEn: 'Delete Contacts',
      descriptionAr: 'حذف جهات الاتصال'
    },

    // CRM - Leads
    {
      module: 'leads',
      action: 'read',
      descriptionEn: 'View Leads',
      descriptionAr: 'عرض العملاء المحتملين'
    },
    {
      module: 'leads',
      action: 'create',
      descriptionEn: 'Create Leads',
      descriptionAr: 'إنشاء العملاء المحتملين'
    },
    {
      module: 'leads',
      action: 'update',
      descriptionEn: 'Update Leads',
      descriptionAr: 'تحديث العملاء المحتملين'
    },
    {
      module: 'leads',
      action: 'delete',
      descriptionEn: 'Delete Leads',
      descriptionAr: 'حذف العملاء المحتملين'
    },

    // CRM - Deals
    {
      module: 'deals',
      action: 'read',
      descriptionEn: 'View Deals',
      descriptionAr: 'عرض الصفقات'
    },
    {
      module: 'deals',
      action: 'create',
      descriptionEn: 'Create Deals',
      descriptionAr: 'إنشاء الصفقات'
    },
    {
      module: 'deals',
      action: 'update',
      descriptionEn: 'Update Deals',
      descriptionAr: 'تحديث الصفقات'
    },
    {
      module: 'deals',
      action: 'delete',
      descriptionEn: 'Delete Deals',
      descriptionAr: 'حذف الصفقات'
    },

    // CRM - Companies
    {
      module: 'companies',
      action: 'read',
      descriptionEn: 'View Companies',
      descriptionAr: 'عرض الشركات'
    },
    {
      module: 'companies',
      action: 'create',
      descriptionEn: 'Create Companies',
      descriptionAr: 'إنشاء الشركات'
    },
    {
      module: 'companies',
      action: 'update',
      descriptionEn: 'Update Companies',
      descriptionAr: 'تحديث الشركات'
    },
    {
      module: 'companies',
      action: 'delete',
      descriptionEn: 'Delete Companies',
      descriptionAr: 'حذف الشركات'
    },

    // Scheduler
    {
      module: 'scheduler',
      action: 'read',
      descriptionEn: 'View Scheduler',
      descriptionAr: 'عرض المجدول'
    },
    {
      module: 'scheduler',
      action: 'create',
      descriptionEn: 'Create Events',
      descriptionAr: 'إنشاء الأحداث'
    },
    {
      module: 'scheduler',
      action: 'update',
      descriptionEn: 'Update Events',
      descriptionAr: 'تحديث الأحداث'
    },
    {
      module: 'scheduler',
      action: 'delete',
      descriptionEn: 'Delete Events',
      descriptionAr: 'حذف الأحداث'
    },

    // Notes
    {
      module: 'notes',
      action: 'read',
      descriptionEn: 'View Notes',
      descriptionAr: 'عرض الملاحظات'
    },
    {
      module: 'notes',
      action: 'create',
      descriptionEn: 'Create Notes',
      descriptionAr: 'إنشاء الملاحظات'
    },
    {
      module: 'notes',
      action: 'update',
      descriptionEn: 'Update Notes',
      descriptionAr: 'تحديث الملاحظات'
    },
    {
      module: 'notes',
      action: 'delete',
      descriptionEn: 'Delete Notes',
      descriptionAr: 'حذف الملاحظات'
    },

    // Notifications
    {
      module: 'notifications',
      action: 'read',
      descriptionEn: 'View Notifications',
      descriptionAr: 'عرض الإشعارات'
    },
    {
      module: 'notifications',
      action: 'create',
      descriptionEn: 'Send Notifications',
      descriptionAr: 'إرسال الإشعارات'
    },
    {
      module: 'notifications',
      action: 'update',
      descriptionEn: 'Update Notifications',
      descriptionAr: 'تحديث الإشعارات'
    },
    {
      module: 'notifications',
      action: 'delete',
      descriptionEn: 'Delete Notifications',
      descriptionAr: 'حذف الإشعارات'
    }
  ];

  // Create all permissions
  console.log('📝 Creating permissions...\n');
  const createdPermissions: string[] = [];
  const skippedPermissions: string[] = [];
  const newPermissions: Permission[] = [];

  for (const perm of systemPermissions) {
    try {
      // Check if permission already exists
      const existing = await permissionService.getAllPermissions();
      const exists = existing.some(
        (p) => p.module === perm.module && p.action === perm.action
      );

      if (exists) {
        skippedPermissions.push(`${perm.module}:${perm.action}`);
        console.log(`⏭️  Skipped (exists): ${perm.module}:${perm.action}`);
      } else {
        const created = await permissionService.createPermission({
          module: perm.module,
          action: perm.action,
          description: perm.descriptionEn,
        });
        newPermissions.push(created);
        createdPermissions.push(`${perm.module}:${perm.action}`);
        console.log(`✅ Created: ${perm.module}:${perm.action}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to create ${perm.module}:${perm.action}:`, errorMessage);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   - Created: ${createdPermissions.length}`);
  console.log(`   - Skipped (already exist): ${skippedPermissions.length}`);
  console.log(`   - Total: ${systemPermissions.length}\n`);

  // Assign to super-admin role
  if (newPermissions.length > 0) {
    console.log('👑 Assigning permissions to super-admin role...\n');
    
    try {
      const roles = await roleService.getAllRoles();
      const superAdminRole = roles.find(
        (r) => r.name === 'super-admin' || r.name === 'Super Admin'
      );

      if (superAdminRole) {
        for (const permission of newPermissions) {
          try {
            await rolePermissionService.assignPermissionToRole(superAdminRole.id, permission.id);
            console.log(`✅ Assigned ${permission.module}:${permission.action} to super-admin`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(
              `❌ Failed to assign ${permission.module}:${permission.action}:`,
              errorMessage
            );
          }
        }
        console.log('\n✅ All new permissions assigned to super-admin role!');
      } else {
        console.warn('⚠️  Super-admin role not found. Please assign permissions manually.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to assign permissions to super-admin:', errorMessage);
    }
  }

  console.log('\n✅ Setup complete!\n');
  console.log('📍 Next steps:');
  console.log('   1. Visit: http://localhost:4000/dashboard/permissions');
  console.log('   2. Verify all permissions are listed');
  console.log('   3. Visit: http://localhost:4000/dashboard/roles');
  console.log('   4. Check super-admin role has all permissions\n');
}

main()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
