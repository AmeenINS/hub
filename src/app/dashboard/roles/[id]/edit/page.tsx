'use client';

import { useI18n } from '@/shared/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { ArrowLeft, Trash2, Save, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/shared/state/auth-store';
import { toast } from 'sonner';
import { RTLChevron } from '@/shared/components/ui/rtl-icon';
import { PermissionLevel, PermissionLevelNames } from '@/core/auth/permission-levels';
import { apiClient } from '@/core/api/client';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  moduleLevels?: Record<string, number>;
}

// Module definitions for permission configuration - Complete list from sidebar
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
  
  // Business Operations
  { id: 'accounting', label: 'Finance & Accounting' },
  { id: 'workflows', label: 'Workflow & Automation' },
  { id: 'inventory', label: 'Inventory Management' },
  { id: 'procurement', label: 'Procurement' },
];

export default function EditRolePage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [formData, setFormData] = useState<Role>({
    id: '',
    name: '',
    description: '',
    isSystemRole: false,
    moduleLevels: {},
  });

  const fetchRole = async () => {
    try {
      setFetchLoading(true);
      const response = await apiClient.get<Role>(`/api/roles/${params.id}`);
      
      if (response.success && response.data) {
        setFormData(response.data);
      } else {
        toast.error(t('roles.fetchError'));
        router.push('/dashboard/roles');
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
      toast.error(t('roles.fetchError'));
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.put(`/api/roles/${params.id}`, {
        name: formData.name,
        description: formData.description,
        moduleLevels: formData.moduleLevels,
      });

      if (response.success) {
        toast.success(t('roles.updateSuccess'));
        
        // Show saved indicator
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
        
        // Refresh the form data to show updated values
        await fetchRole();
        
      } else {
        toast.error(response.message || t('roles.updateError'));
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error(t('roles.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (formData.isSystemRole) {
      toast.error('Cannot delete system roles');
      return;
    }

    if (!confirm(t('messages.deleteConfirm') + ' ' + formData.name + '?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await apiClient.delete(`/api/roles/${params.id}`);

      if (response.success) {
        toast.success(t('messages.deleteSuccess'));
        router.push('/dashboard/roles');
      } else {
        toast.error(response.message || t('messages.deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error(t('messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-2"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/roles">
            <Button variant="ghost" size="sm" className="gap-2">
              <RTLChevron>
                <ArrowLeft className="h-4 w-4" />
              </RTLChevron>
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {t('roles.edit')}
            </h2>
            <p className="text-muted-foreground">
              {t('roles.editDescription')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchRole}
            disabled={fetchLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${fetchLoading ? 'animate-spin' : ''}`} />
            {fetchLoading ? t('common.loading') : t('common.refresh')}
          </Button>
          {!formData.isSystemRole && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? t('common.loading') : t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* System Role Warning */}
      {formData.isSystemRole && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold">{t('roles.systemRole')}</p>
              <p className="text-xs mt-1">{t('roles.systemRoleWarning')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('roles.details')}</CardTitle>
          <CardDescription>{t('roles.formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name and Description */}
            <div className="grid gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('roles.name')}</Label>
                <Input
                  id="name"
                  placeholder={t('roles.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('roles.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('roles.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Permission Levels */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <Label className="text-lg">{t('roles.permissionLevels')}</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULES.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <Label htmlFor={`level-${module.id}`} className="font-medium">
                      {module.label}
                    </Label>
                    <select
                      id={`level-${module.id}`}
                      value={formData.moduleLevels?.[module.id] ?? PermissionLevel.NONE}
                      onChange={(e) => {
                        const level = parseInt(e.target.value);
                        setFormData({
                          ...formData,
                          moduleLevels: {
                            ...(formData.moduleLevels || {}),
                            [module.id]: level,
                          },
                        });
                      }}
                      aria-label={module.label}
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                    >
                      {Object.entries(PermissionLevelNames).map(([levelValue, levelName]) => (
                        <option key={levelValue} value={levelValue}>
                          {levelName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Permission Level Guide */}
              <Card className="bg-muted/50 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('roles.permissionLevelGuide')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold">{PermissionLevelNames[PermissionLevel.NONE]}</span>
                    <p className="text-muted-foreground">No access to this module</p>
                  </div>
                  <div>
                    <span className="font-semibold">{PermissionLevelNames[PermissionLevel.READ]}</span>
                    <p className="text-muted-foreground">View and list data only</p>
                  </div>
                  <div>
                    <span className="font-semibold">{PermissionLevelNames[PermissionLevel.WRITE]}</span>
                    <p className="text-muted-foreground">Create and edit records</p>
                  </div>
                  <div>
                    <span className="font-semibold">{PermissionLevelNames[PermissionLevel.FULL]}</span>
                    <p className="text-muted-foreground">Full module access including delete</p>
                  </div>
                  <div>
                    <span className="font-semibold">{PermissionLevelNames[PermissionLevel.ADMIN]}</span>
                    <p className="text-muted-foreground">Module administration and configuration</p>
                  </div>
                  <div>
                    <span className="font-semibold">{PermissionLevelNames[PermissionLevel.SUPER_ADMIN]}</span>
                    <p className="text-muted-foreground">Complete control and critical operations</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                variant={justSaved ? "default" : "default"}
                className={justSaved ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading 
                  ? t('common.loading') 
                  : justSaved 
                    ? t('common.saved') 
                    : t('common.save')
                }
              </Button>
              <Link href="/dashboard/roles">
                <Button type="button" variant="outline">
                  {t('common.cancel')}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
