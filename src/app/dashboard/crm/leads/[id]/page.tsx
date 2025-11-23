'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, ArrowLeft, Edit, Trash2, CheckCircle2, XCircle, Calendar, DollarSign, Building2, User, Phone, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead, Activity } from '@/shared/types/database';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('crm_leads');

  useEffect(() => {
    if (!isLoading && canView) {
      fetchLead();
      fetchActivities();
    }
  }, [resolvedParams.id, canView, isLoading]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Lead>(`/api/crm/leads/${resolvedParams.id}`);
      if (response.success && response.data) {
        setLead(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch lead'));
      router.push('/dashboard/crm/leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await apiClient.get<Activity[]>(`/api/crm/activities?leadId=${resolvedParams.id}`);
      if (response.success && response.data) {
        setActivities(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('crm.deleteContactDescription'))) return;

    try {
      const response = await apiClient.delete(`/api/crm/leads/${resolvedParams.id}`);
      if (response.success) {
        toast.success(t('crm.leadDeleted'));
        router.push('/dashboard/crm/leads');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete lead'));
    }
  };

  const handleConvertToDeal = async () => {
    if (!confirm(t('crm.convertToDeal') + '?')) return;

    try {
      const response = await apiClient.post(`/api/crm/leads/${resolvedParams.id}/convert`);
      if (response.success) {
        toast.success(t('crm.leadConverted'));
        router.push('/dashboard/crm/deals');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to convert lead'));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NEW: 'default',
      QUALIFIED: 'outline',
      PROPOSAL: 'secondary',
      NEGOTIATION: 'secondary',
      CLOSED_WON: 'default',
      CLOSED_LOST: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{t(`crm.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      LOW: 'secondary',
      MEDIUM: 'default',
      HIGH: 'destructive',
      URGENT: 'destructive',
    };
    return <Badge variant={variants[priority]}>{t(`crm.priority${priority.charAt(0) + priority.slice(1).toLowerCase()}`)}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return `${t('crm.omr')} ${value.toLocaleString()}`;
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView || !lead) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/crm/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{lead.title}</h1>
            <p className="text-muted-foreground">{t('crm.leadDetails')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && lead.status === 'QUALIFIED' && (
            <Button onClick={handleConvertToDeal}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('crm.convertToDeal')}
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/crm/leads/${lead.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
          )}
          {canFull && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('crm.overview')}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(lead.status)}
                  {getPriorityBadge(lead.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('crm.notes')}</h3>
                  <p className="text-sm text-muted-foreground">{lead.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('crm.leadSource')}</p>
                  <p className="text-sm text-muted-foreground">{lead.source ? t(`crm.source${lead.source.charAt(0) + lead.source.slice(1).toLowerCase()}`) : '-'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('crm.insuranceType')}</p>
                  <p className="text-sm text-muted-foreground">
                    {lead.insuranceType ? t(`crm.insurance${lead.insuranceType.charAt(0) + lead.insuranceType.slice(1).toLowerCase()}`) : '-'}
                  </p>
                </div>

                {lead.value && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.dealValue')}</p>
                    <p className="text-sm font-semibold">{formatCurrency(lead.value)}</p>
                  </div>
                )}

                {lead.currentPremium && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.currentPremium')}</p>
                    <p className="text-sm font-semibold">{formatCurrency(lead.currentPremium)}</p>
                  </div>
                )}

                {lead.renewalDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.renewalDate')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(lead.renewalDate).toLocaleDateString()}</p>
                  </div>
                )}

                {lead.nextFollowUpDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.nextFollowUp')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(lead.nextFollowUpDate).toLocaleDateString()}</p>
                  </div>
                )}

                {lead.expectedCloseDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.startDate')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(lead.expectedCloseDate).toLocaleDateString()}</p>
                  </div>
                )}

                {lead.probability !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.conversionRate')}</p>
                    <p className="text-sm text-muted-foreground">{lead.probability}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activities Tab */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.activities')}</CardTitle>
              <CardDescription>{activities.length} {t('crm.activities').toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('crm.noActivitiesFound')}</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{activity.subject}</h4>
                          <Badge variant="outline">{activity.type}</Badge>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info Card */}
          {lead.contactId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('crm.contactInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  {t('crm.emailContact')}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  {t('crm.callContact')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Company Info Card */}
          {lead.companyId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t('crm.companyInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('crm.company')}</p>
              </CardContent>
            </Card>
          )}

          {/* Assignment Card */}
          {lead.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('crm.assignedTo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{lead.assignedTo}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('crm.createdAt')}</span>
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('crm.updatedAt')}</span>
                <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
