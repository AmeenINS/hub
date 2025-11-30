'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Edit, 
  Loader2, 
  Mail, 
  MessageSquare, 
  Share2, 
  Target, 
  Trash2, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { Campaign, CampaignType, CampaignStatus, Lead, Deal } from '@/shared/types/database';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t, locale } = useI18n();
  const { hasAccess, level, canWrite, canFull } = usePermissionLevel('crm_campaigns');

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [relatedLeads, setRelatedLeads] = useState<Lead[]>([]);
  const [relatedDeals, setRelatedDeals] = useState<Deal[]>([]);
  
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard/access-denied');
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [campaignRes, leadsRes, dealsRes] = await Promise.all([
          apiClient.get(`/api/crm/campaigns/${resolvedParams.id}`),
          apiClient.get(`/api/crm/leads?campaignId=${resolvedParams.id}`),
          apiClient.get(`/api/crm/deals?campaignId=${resolvedParams.id}`)
        ]);

        if (campaignRes.success && campaignRes.data) {
          setCampaign(campaignRes.data);
        } else {
          toast.error(t('crm.campaigns.notFound'));
          router.push('/dashboard/crm/campaigns');
        }

        if (leadsRes.success && leadsRes.data) {
          setRelatedLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
        }

        if (dealsRes.success && dealsRes.data) {
          setRelatedDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t('crm.campaigns.errorLoading')));
        router.push('/dashboard/crm/campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id, hasAccess]);

  const handleDelete = async () => {
    if (!confirm(t('crm.campaigns.confirmDelete'))) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/api/crm/campaigns/${resolvedParams.id}`);
      
      if (response.success) {
        toast.success(t('crm.campaigns.deleteSuccess'));
        router.push('/dashboard/crm/campaigns');
      } else {
        toast.error(response.message || t('crm.campaigns.deleteError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.campaigns.deleteError')));
    } finally {
      setIsDeleting(false);
    }
  };

  const getCampaignIcon = (type: CampaignType) => {
    switch (type) {
      case CampaignType.EMAIL: return <Mail className="h-5 w-5" />;
      case CampaignType.SMS: return <MessageSquare className="h-5 w-5" />;
      case CampaignType.SOCIAL_MEDIA: return <Share2 className="h-5 w-5" />;
      case CampaignType.EVENT: return <Users className="h-5 w-5" />;
      case CampaignType.WEBINAR: return <Users className="h-5 w-5" />;
      case CampaignType.ADVERTISING: return <Target className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const variants: Record<CampaignStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [CampaignStatus.DRAFT]: 'outline',
      [CampaignStatus.SCHEDULED]: 'secondary',
      [CampaignStatus.ACTIVE]: 'default',
      [CampaignStatus.PAUSED]: 'secondary',
      [CampaignStatus.COMPLETED]: 'outline',
      [CampaignStatus.CANCELLED]: 'destructive'
    };

    return (
      <Badge variant={variants[status]}>
        {t(`crm.campaigns.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
      </Badge>
    );
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return locale === 'ar' ? '0 ر.ع' : 'OMR 0';
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    return locale === 'ar' ? `${formatted} ر.ع` : `${formatted} OMR`;
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const calculateROI = () => {
    if (!campaign?.actualCost || campaign.actualCost === 0) return 0;
    const revenue = campaign.metrics?.revenue || 0;
    const cost = campaign.actualCost;
    return ((revenue - cost) / cost) * 100;
  };

  const calculateConversionRate = () => {
    const leads = campaign?.metrics?.leads || 0;
    if (leads === 0) return 0;
    const deals = campaign?.metrics?.deals || 0;
    return (deals / leads) * 100;
  };

  if (!hasAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">{t('crm.campaigns.notFound')}</p>
        <Button onClick={() => router.push('/dashboard/crm/campaigns')}>
          {t('crm.campaigns.backToList')}
        </Button>
      </div>
    );
  }

  const roi = calculateROI();
  const conversionRate = calculateConversionRate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              {getCampaignIcon(campaign.type)}
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(campaign.status)}
              <Badge variant="outline">
                {t(`crm.campaigns.type${campaign.type.charAt(0) + campaign.type.slice(1).toLowerCase()}`)}
              </Badge>
            </div>
          </div>
        </div>
        {(canWrite || canFull) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/crm/campaigns/${campaign.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('common.delete')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('crm.campaigns.budget')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(campaign.budget)}</div>
                <p className="text-xs text-muted-foreground">
                  {t('crm.campaigns.spent')}: {formatCurrency(campaign.actualCost)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('crm.campaigns.leads')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.metrics?.leads || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {t('crm.campaigns.deals')}: {campaign.metrics?.deals || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('crm.campaigns.roi')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('crm.campaigns.revenue')}: {formatCurrency(campaign.metrics?.revenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('crm.campaigns.conversionRate')}</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {campaign.metrics?.deals || 0}/{campaign.metrics?.leads || 0} {t('crm.campaigns.converted')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.campaigns.overview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaign.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {t('crm.campaigns.description')}
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{campaign.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('crm.campaigns.startDate')}
                  </h3>
                  <p className="text-sm">{formatDate(campaign.startDate)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('crm.campaigns.endDate')}
                  </h3>
                  <p className="text-sm">{formatDate(campaign.endDate)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('crm.campaigns.targetAudience')}
                  </h3>
                  <p className="text-sm">{campaign.targetAudience || '-'}</p>
                </div>

                {campaign.targetLeads && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('crm.campaigns.targetLeads')}
                    </h3>
                    <p className="text-sm">{campaign.targetLeads}</p>
                  </div>
                )}

                {campaign.targetRevenue && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('crm.campaigns.targetRevenue')}
                    </h3>
                    <p className="text-sm">{formatCurrency(campaign.targetRevenue)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          <Tabs defaultValue="leads" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="leads">
                {t('crm.leads.title')} ({relatedLeads.length})
              </TabsTrigger>
              <TabsTrigger value="deals">
                {t('crm.deals.title')} ({relatedDeals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('crm.campaigns.relatedLeads')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedLeads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('crm.campaigns.noRelatedLeads')}</p>
                  ) : (
                    <div className="space-y-2">
                      {relatedLeads.map(lead => (
                        <div key={lead.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{lead.title}</p>
                            <p className="text-sm text-muted-foreground">{lead.source}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/crm/leads/${lead.id}`)}
                          >
                            {t('crm.viewDetails')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('crm.campaigns.relatedDeals')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedDeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('crm.campaigns.noRelatedDeals')}</p>
                  ) : (
                    <div className="space-y-2">
                      {relatedDeals.map(deal => (
                        <div key={deal.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{deal.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(deal.value)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/crm/deals/${deal.id}`)}
                          >
                            {t('crm.viewDetails')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.campaigns.performance')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('crm.campaigns.budgetUtilization')}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ 
                        width: `${campaign.budget ? Math.min(((campaign.actualCost || 0) / campaign.budget) * 100, 100) : 0}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {campaign.budget ? ((campaign.actualCost || 0) / campaign.budget * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>

              {campaign.targetLeads && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('crm.campaigns.leadProgress')}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      {/* eslint-disable-next-line react/forbid-dom-props */}
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ 
                          width: `${Math.min(((campaign.metrics?.leads || 0) / (campaign.targetLeads || 1)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {((campaign.metrics?.leads || 0) / (campaign.targetLeads || 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.assignment')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('crm.campaigns.owner')}
                </h3>
                <p className="text-sm">{campaign.assignedTo || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('crm.createdAt')}
                </h3>
                <p className="text-sm">{formatDate(campaign.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('crm.updatedAt')}
                </h3>
                <p className="text-sm">{formatDate(campaign.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
