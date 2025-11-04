import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding positions module permissions...');

  const permissions = [
    {
      module: 'positions',
      action: 'create',
      description: 'Create positions',
    },
    {
      module: 'positions',
      action: 'read',
      description: 'View positions',
    },
    {
      module: 'positions',
      action: 'update',
      description: 'Edit positions',
    },
    {
      module: 'positions',
      action: 'delete',
      description: 'Delete positions',
    },
  ];

  for (const perm of permissions) {
    // Check if permission already exists
    const existing = await prisma.permission.findFirst({
      where: {
        module: perm.module,
        action: perm.action,
      },
    });

    if (existing) {
      console.log(`⏭️  Permission ${perm.module}:${perm.action} already exists`);
      continue;
    }

    await prisma.permission.create({
      data: perm,
    });
    console.log(`✅ Created permission: ${perm.module}:${perm.action}`);
  }

  // Assign to admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      email: 'admin@ameen.me',
    },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: true,
            },
          },
        },
      },
    },
  });

  if (!adminUser) {
    console.log('❌ Admin user not found');
    return;
  }

  console.log('\n🔧 Assigning positions permissions to admin...');

  // Get admin's role
  const adminRole = adminUser.userRoles[0]?.role;
  if (!adminRole) {
    console.log('❌ Admin role not found');
    return;
  }

  // Get all positions permissions
  const positionsPermissions = await prisma.permission.findMany({
    where: {
      module: 'positions',
    },
  });

  for (const permission of positionsPermissions) {
    // Check if already assigned
    const existing = await prisma.rolePermission.findFirst({
      where: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });

    if (existing) {
      console.log(`⏭️  Permission ${permission.module}:${permission.action} already assigned`);
      continue;
    }

    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
    console.log(`✅ Assigned: ${permission.module}:${permission.action}`);
  }

  console.log('\n✅ Done! Admin now has all positions permissions.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
