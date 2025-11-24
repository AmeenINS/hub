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
import { Loader2, ArrowLeft, Edit, Trash2, Calendar, DollarSign, FileText, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import type { Deal, Activity } from '@/shared/types/database';

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { t, locale } = useI18n();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('crm_deals');

  useEffect(() => {
    if (!isLoading && canView) {
      fetchDeal();
      fetchActivities();
    }
  }, [resolvedParams.id, canView, isLoading]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Deal>(`/api/crm/deals/${resolvedParams.id}`);
      if (response.success && response.data) {
        setDeal(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch deal'));
      router.push('/dashboard/crm/deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await apiClient.get<Activity[]>(`/api/crm/activities?dealId=${resolvedParams.id}`);
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
      const response = await apiClient.delete(`/api/crm/deals/${resolvedParams.id}`);
      if (response.success) {
        toast.success(t('crm.dealDeleted'));
        router.push('/dashboard/crm/deals');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete deal'));
    }
  };

  const formatCurrency = (value: number) => {
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    return locale === 'ar' ? `${formatted} ر.ع` : `${formatted} OMR`;
  };

  const getStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      PROSPECTING: t('crm.stageProspecting'),
      QUALIFICATION: t('crm.stageQualification'),
      PROPOSAL: t('crm.stageProposal'),
      NEGOTIATION: t('crm.stageNegotiation'),
      CLOSED: t('crm.stageClosed'),
    };
    return stages[stage] || stage;
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView || !deal) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/crm/deals')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{deal.value ? formatCurrency(deal.value) : t('crm.dealDetails')}</h1>
            <p className="text-muted-foreground">{t('crm.dealDetails')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/crm/deals/${deal.id}/edit`)}>
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
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('crm.overview')}</CardTitle>
                <Badge>{getStageLabel(deal.stage)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {deal.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{t('crm.notes')}</h3>
                  <p className="text-sm text-muted-foreground">{deal.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                {deal.value && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.dealValue')}</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(deal.value)}</p>
                  </div>
                )}

                {deal.premium && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.premium')}</p>
                    <p className="text-xl font-semibold">{formatCurrency(deal.premium)}</p>
                  </div>
                )}

                {deal.commission && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.commission')}</p>
                    <p className="text-xl font-semibold">{formatCurrency(deal.commission)}</p>
                  </div>
                )}

                {deal.coverageAmount && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.coverageAmount')}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(deal.coverageAmount)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('crm.policyDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {deal.policyNumber && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.policyNumber')}</p>
                    <p className="text-sm text-muted-foreground">{deal.policyNumber}</p>
                  </div>
                )}

                {deal.premiumFrequency && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.premiumFrequency')}</p>
                    <p className="text-sm text-muted-foreground">
                      {deal.premiumFrequency === 'MONTHLY' && t('crm.frequencyMonthly')}
                      {deal.premiumFrequency === 'QUARTERLY' && t('crm.frequencyQuarterly')}
                      {deal.premiumFrequency === 'SEMI_ANNUAL' && t('crm.frequencySemiAnnually')}
                      {deal.premiumFrequency === 'ANNUAL' && t('crm.frequencyAnnually')}
                    </p>
                  </div>
                )}

                {deal.policyStartDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.policyStartDate')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(deal.policyStartDate).toLocaleDateString()}</p>
                  </div>
                )}

                {deal.policyEndDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.policyEndDate')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(deal.policyEndDate).toLocaleDateString()}</p>
                  </div>
                )}

                {deal.deductible && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.deductible')}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(deal.deductible)}</p>
                  </div>
                )}
              </div>

              {deal.policyDetails && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('crm.notes')}</p>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(deal.policyDetails, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

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
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.startDate).toLocaleDateString()}
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => router.push(`/dashboard/crm/activities/${activity.id}`)}
                          >
                            {t('crm.viewDetails')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {deal.insuranceType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('crm.insuranceType')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {deal.insuranceType === 'AUTO' && t('crm.insuranceAuto')}
                  {deal.insuranceType === 'HEALTH' && t('crm.insuranceHealth')}
                  {deal.insuranceType === 'LIFE' && t('crm.insuranceLife')}
                  {deal.insuranceType === 'PROPERTY' && t('crm.insuranceProperty')}
                  {deal.insuranceType === 'TRAVEL' && t('crm.insuranceTravel')}
                  {deal.insuranceType === 'MARINE' && t('crm.insuranceMarine')}
                  {deal.insuranceType === 'OTHER' && t('crm.insuranceOther')}
                </p>
              </CardContent>
            </Card>
          )}

          {deal.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('crm.assignedTo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{deal.assignedTo}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t('crm.metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('crm.createdAt')}</span>
                <span>{new Date(deal.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('crm.updatedAt')}</span>
                <span>{new Date(deal.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
