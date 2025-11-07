'use client';

import { useI18n } from '@/shared/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Edit, Shield, RefreshCw, Users } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/shared/state/auth-store';
import { toast } from 'sonner';
import { RTLChevron } from '@/shared/components/ui/rtl-icon';
import { PermissionLevel, PermissionLevelNames } from '@/core/auth/permission-levels';
import { apiClient } from '@/core/api/client';
import { Badge } from '@/shared/components/ui/badge';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  moduleLevels?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
}

// Module definitions for display
const MODULES = [
  // Core System
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users Management' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'settings', label: 'System Settings' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'support', label: 'Support' },
  
  // Business Core
  { id: 'tracking', label: 'Live Tracking' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'reports', label: 'Reports' },
  
  // CRM Module
  { id: 'crm_contacts', label: 'CRM - Contacts' },
  { id: 'crm_companies', label: 'CRM - Companies' },
  { id: 'crm_leads', label: 'CRM - Leads' },
  { id: 'crm_deals', label: 'CRM - Deals' },
  { id: 'crm_activities', label: 'CRM - Activities' },
  { id: 'crm_campaigns', label: 'CRM - Campaigns' },
  
  // Insurance Modules
  { id: 'policies', label: 'Policy Management' },
  { id: 'claims', label: 'Claims Management' },
  { id: 'accounting', label: 'Finance & Accounting' },
  { id: 'workflows', label: 'Workflow' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'procurement', label: 'Procurement' },
];

export default function RoleDetailsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const permissions = usePermissionLevel('roles');
  
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleId = params?.id as string;

  // Fetch role data
  const fetchRole = async () => {
    if (!roleId || !token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<Role>(`/api/roles/${roleId}`);
      
      if (response.success && response.data) {
        setRole(response.data);
      } else {
        setError('Failed to load role');
        toast.error(t('roles.fetchError'));
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setError('Failed to load role');
      toast.error(t('roles.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [roleId, token]);

  // Check permissions
  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t('accessDenied.title')}</h3>
          <p className="text-muted-foreground">{t('accessDenied.description')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Role not found</h3>
          <p className="text-muted-foreground">The requested role could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/roles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('roles.details')}</h2>
            <p className="text-muted-foreground">
              {t('roles.roleDetails')}
            </p>
          </div>
        </div>
        
        {permissions.canWrite && (
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push(`/dashboard/roles/${roleId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('roles.editRole')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Role Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('roles.roleDetails')}
              </CardTitle>
              <CardDescription>
                {t('roles.formDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('roles.roleName')}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg font-semibold">{role.name}</p>
                  <Badge variant={role.isSystemRole ? 'default' : 'secondary'}>
                    {role.isSystemRole ? 'System' : 'Custom'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('roles.roleDescription')}
                </label>
                <p className="mt-1 text-sm">{role.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('users.createdAt')}
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('users.updatedAt')}
                  </label>
                  <p className="mt-1 text-sm">
                    {new Date(role.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Role Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Update role information
              </CardTitle>
              <CardDescription>
                Modify role details and permission levels for different modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Edit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to update this role?</h3>
                <p className="text-muted-foreground mb-4">
                  Click the edit button to modify role information, permissions, and module access levels.
                </p>
                {permissions.canWrite ? (
                  <Button onClick={() => router.push(`/dashboard/roles/${roleId}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('roles.editRole')}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to edit roles.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permission Levels */}
          <Card>
            <CardHeader>
              <CardTitle>{t('roles.permissionLevels')}</CardTitle>
              <CardDescription>
                {t('roles.modulePermissions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MODULES.map(module => {
                  const level = role.moduleLevels?.[module.id] ?? PermissionLevel.NONE;
                  const levelName = PermissionLevelNames[level as PermissionLevel];
                  
                  return (
                    <div key={module.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{module.label}</p>
                        <p className="text-sm text-muted-foreground">{module.id}</p>
                      </div>
                      <Badge 
                        variant={level > PermissionLevel.NONE ? 'default' : 'secondary'}
                      >
                        {levelName}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{role._count?.users || 0}</div>
                  <p className="text-sm text-muted-foreground">Users with this role</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Object.values(role.moduleLevels || {}).filter(level => level > 0).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Modules with access</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Type */}
          <Card>
            <CardHeader>
              <CardTitle>Role Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={role.isSystemRole ? 'default' : 'secondary'} className="text-sm">
                  {role.isSystemRole ? 'System Role' : 'Custom Role'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {role.isSystemRole 
                  ? 'Built-in system role with predefined permissions'
                  : 'Custom role created by administrators'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}