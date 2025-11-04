import { lmdb } from '../src/lib/db/lmdb';
import { v4 as uuidv4 } from 'uuid';

interface Permission {
  id: string;
  module: string;
  action: string;
  descriptionEn: string;
  descriptionAr: string;
  createdAt: string;
}

interface Role {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

async function addNotesPermissions() {
  try {
    console.log('🔄 Initializing LMDB...');
    await lmdb.initialize();

    const permissionsDb = lmdb.getDatabase('permissions');
    const rolesDb = lmdb.getDatabase('roles');
    const rolePermissionsDb = lmdb.getDatabase('rolePermissions');

    // Define notes permissions
    const notesPermissions = [
      {
        module: 'notes',
        action: 'view',
        descriptionEn: 'View notes',
        descriptionAr: 'عرض الملاحظات',
      },
      {
        module: 'notes',
        action: 'create',
        descriptionEn: 'Create notes',
        descriptionAr: 'إنشاء ملاحظات',
      },
      {
        module: 'notes',
        action: 'edit',
        descriptionEn: 'Edit notes',
        descriptionAr: 'تعديل الملاحظات',
      },
      {
        module: 'notes',
        action: 'delete',
        descriptionEn: 'Delete notes',
        descriptionAr: 'حذف الملاحظات',
      },
    ];

    console.log('\n📝 Creating notes permissions...');
    const createdPermissions: Permission[] = [];

    for (const permData of notesPermissions) {
      const permissionId = uuidv4();
      const permission: Permission = {
        id: permissionId,
        ...permData,
        createdAt: new Date().toISOString(),
      };

      await permissionsDb.put(permissionId, permission);
      createdPermissions.push(permission);
      console.log(`✅ Created permission: ${permission.module}:${permission.action}`);
    }

    // Find Administrator and Super Admin roles
    console.log('\n🔍 Finding admin roles...');
    const adminRoles: Role[] = [];
    
    for (const { value } of rolesDb.getRange()) {
      const role = value as Role;
      if (role.nameEn === 'Administrator' || role.nameEn === 'Super Admin') {
        adminRoles.push(role);
        console.log(`Found role: ${role.nameEn} (${role.id})`);
      }
    }

    if (adminRoles.length === 0) {
      console.log('⚠️ No admin roles found. Permissions created but not assigned.');
      return;
    }

    // Assign permissions to admin roles
    console.log('\n🔗 Assigning permissions to admin roles...');
    for (const role of adminRoles) {
      for (const permission of createdPermissions) {
        const rolePermId = `${role.id}_${permission.id}`;
        await rolePermissionsDb.put(rolePermId, {
          roleId: role.id,
          permissionId: permission.id,
          createdAt: new Date().toISOString(),
        });
      }
      console.log(`✅ Assigned ${createdPermissions.length} permissions to ${role.nameEn}`);
    }

    console.log('\n✅ Notes permissions setup completed successfully!');
    console.log(`Created ${createdPermissions.length} permissions`);
    console.log(`Assigned to ${adminRoles.length} admin role(s)`);

  } catch (error) {
    console.error('❌ Error setting up notes permissions:', error);
    throw error;
  }
}

// Run the script
addNotesPermissions()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
