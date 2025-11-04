# Example: Adding a New Feature with i18n & Permissions

> **Complete example showing how to add a new "Projects" feature with internationalization and permission system**

## Step 1: Add Translations

```typescript
// src/lib/i18n/translations.ts

export const translations = {
  en: {
    // ... existing translations
    projects: {
      title: 'Projects',
      list: 'Projects List',
      create: 'Create Project',
      edit: 'Edit Project',
      delete: 'Delete Project',
      view: 'View Project',
      description: 'Manage your projects',
      
      form: {
        name: 'Project Name',
        namePlaceholder: 'Enter project name',
        description: 'Description',
        descriptionPlaceholder: 'Enter project description',
        status: 'Status',
        startDate: 'Start Date',
        endDate: 'End Date',
        budget: 'Budget',
        owner: 'Project Owner'
      },
      
      status: {
        planning: 'Planning',
        active: 'Active',
        onHold: 'On Hold',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      
      messages: {
        createSuccess: 'Project created successfully',
        updateSuccess: 'Project updated successfully',
        deleteSuccess: 'Project deleted successfully',
        deleteConfirm: 'Are you sure you want to delete this project?',
        noPermission: 'You do not have permission to access projects',
        loadError: 'Failed to load projects'
      }
    }
  },
  ar: {
    // ... existing translations
    projects: {
      title: 'المشاريع',
      list: 'قائمة المشاريع',
      create: 'إنشاء مشروع',
      edit: 'تعديل مشروع',
      delete: 'حذف مشروع',
      view: 'عرض مشروع',
      description: 'إدارة مشاريعك',
      
      form: {
        name: 'اسم المشروع',
        namePlaceholder: 'أدخل اسم المشروع',
        description: 'الوصف',
        descriptionPlaceholder: 'أدخل وصف المشروع',
        status: 'الحالة',
        startDate: 'تاريخ البداية',
        endDate: 'تاريخ النهاية',
        budget: 'الميزانية',
        owner: 'مالك المشروع'
      },
      
      status: {
        planning: 'التخطيط',
        active: 'نشط',
        onHold: 'معلق',
        completed: 'مكتمل',
        cancelled: 'ملغى'
      },
      
      messages: {
        createSuccess: 'تم إنشاء المشروع بنجاح',
        updateSuccess: 'تم تحديث المشروع بنجاح',
        deleteSuccess: 'تم حذف المشروع بنجاح',
        deleteConfirm: 'هل أنت متأكد من حذف هذا المشروع؟',
        noPermission: 'ليس لديك صلاحية للوصول إلى المشاريع',
        loadError: 'فشل تحميل المشاريع'
      }
    }
  }
};
```

## Step 2: Create Permission Script

```typescript
// scripts/add-projects-permissions.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addProjectsPermissions() {
  console.log('🔐 Adding Projects permissions...');

  const permissions = [
    {
      module: 'projects',
      action: 'view',
      descriptionEn: 'View Projects',
      descriptionAr: 'عرض المشاريع'
    },
    {
      module: 'projects',
      action: 'create',
      descriptionEn: 'Create New Projects',
      descriptionAr: 'إنشاء مشاريع جديدة'
    },
    {
      module: 'projects',
      action: 'edit',
      descriptionEn: 'Edit Projects',
      descriptionAr: 'تعديل المشاريع'
    },
    {
      module: 'projects',
      action: 'delete',
      descriptionEn: 'Delete Projects',
      descriptionAr: 'حذف المشاريع'
    },
    {
      module: 'projects',
      action: 'export',
      descriptionEn: 'Export Projects Data',
      descriptionAr: 'تصدير بيانات المشاريع'
    }
  ];

  for (const perm of permissions) {
    try {
      const existing = await prisma.permission.findFirst({
        where: {
          module: perm.module,
          action: perm.action
        }
      });

      if (!existing) {
        await prisma.permission.create({ data: perm });
        console.log(`✅ Created permission: ${perm.module}.${perm.action}`);
      } else {
        console.log(`⏭️  Permission already exists: ${perm.module}.${perm.action}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create permission ${perm.module}.${perm.action}:`, error);
    }
  }

  console.log('✅ Projects permissions setup complete!');
  await prisma.$disconnect();
}

addProjectsPermissions();
```

## Step 3: Create API Routes with Permission Checks

```typescript
// app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { checkUserPermission } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

// GET - List all projects
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // 2. Check permission
    const hasPermission = await checkUserPermission(
      decoded.userId,
      'projects',
      'view'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // 3. Fetch data
    const projects = await prisma.project.findMany({
      include: {
        owner: true,
        team: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check create permission
    const hasPermission = await checkUserPermission(
      decoded.userId,
      'projects',
      'create'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const project = await prisma.project.create({
      data: {
        ...body,
        ownerId: decoded.userId
      }
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });

  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/projects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { checkUserPermission } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

// PUT - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const hasPermission = await checkUserPermission(
      decoded.userId,
      'projects',
      'edit'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = params;

    const project = await prisma.project.update({
      where: { id },
      data: body
    });

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const hasPermission = await checkUserPermission(
      decoded.userId,
      'projects',
      'delete'
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = params;

    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Step 4: Create Client Component with Permissions

```typescript
// app/dashboard/projects/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { useModulePermissions } from '@/hooks/use-permissions';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { permissions, isLoading: permLoading } = useModulePermissions('projects');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check permissions on mount
  useEffect(() => {
    if (!permLoading && !permissions.canView) {
      toast.error(t('projects.messages.noPermission'));
      router.push('/dashboard/access-denied');
    }
  }, [permissions, permLoading, router, t]);

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      if (!permissions.canView) return;

      try {
        const response = await apiClient.get<Project[]>('/api/projects');
        if (response.success && response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t('projects.messages.loadError')));
      } finally {
        setIsLoading(false);
      }
    }

    if (!permLoading && permissions.canView) {
      fetchProjects();
    }
  }, [permissions, permLoading, t]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('projects.messages.deleteConfirm'))) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/projects/${id}`);
      if (response.success) {
        toast.success(t('projects.messages.deleteSuccess'));
        setProjects(projects.filter(p => p.id !== id));
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Show loading while checking permissions
  if (permLoading || isLoading) {
    return <div>{t('common.loading')}</div>;
  }

  // Don't render if no permission
  if (!permissions.canView) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('projects.title')}</h1>
          <p className="text-muted-foreground">{t('projects.description')}</p>
        </div>

        {/* Only show create button if user has permission */}
        {permissions.canCreate && (
          <Button onClick={() => router.push('/dashboard/projects/new')}>
            {t('projects.create')}
          </Button>
        )}
      </div>

      {/* Projects list */}
      <div className="grid gap-4">
        {projects.map((project) => (
          <div key={project.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                {t('projects.view')}
              </Button>

              {/* Only show edit button if user has permission */}
              {permissions.canEdit && (
                <Button
                  onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                >
                  {t('projects.edit')}
                </Button>
              )}

              {/* Only show delete button if user has permission */}
              {permissions.canDelete && (
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(project.id)}
                >
                  {t('projects.delete')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Step 5: Run the Permission Script

```bash
# Run the script to add permissions to database
npx tsx scripts/add-projects-permissions.ts

# Assign permissions to roles through admin panel
# Go to: /dashboard/roles
# Select a role and assign the new "Projects" permissions
```

## Checklist

- [x] Translations added (EN + AR)
- [x] Permission script created
- [x] API routes protected with permission checks
- [x] Component checks permissions before rendering
- [x] Buttons conditionally shown based on permissions
- [x] Loading state while checking permissions
- [x] User redirected if no access
- [x] Using `t()` for all text
- [x] Using `apiClient` for all API calls
- [x] Error messages handled properly

## Result

✅ Complete feature with:
- Full Arabic and English support
- Granular permission control at API and UI level
- Optimal UX (permissions checked before render)
- Professional access control system
