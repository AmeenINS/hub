'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { CampaignsDataTable } from '@/features/crm/components/campaigns-data-table';
import { toast } from 'sonner';
import { 
  Loader2, 
  Mail, 
  MessageSquare, 
  Plus, 
  Search, 
  Share2,
  Users,
  Target
} from 'lucide-react';
import { Campaign, CampaignType, CampaignStatus } from '@/shared/types/database';

const CAMPAIGN_TYPES: CampaignType[] = [
  CampaignType.EMAIL,
  CampaignType.SMS,
  CampaignType.SOCIAL_MEDIA,
  CampaignType.EVENT,
  CampaignType.WEBINAR,
  CampaignType.ADVERTISING
];

const CAMPAIGN_STATUSES: CampaignStatus[] = [
  CampaignStatus.DRAFT,
  CampaignStatus.SCHEDULED,
  CampaignStatus.ACTIVE,
  CampaignStatus.PAUSED,
  CampaignStatus.COMPLETED,
  CampaignStatus.CANCELLED
];

export default function CampaignsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { hasAccess, level, canWrite } = usePermissionLevel('crm_campaigns');

  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL');

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
        const campaignsRes = await apiClient.get('/api/crm/campaigns');
        
        if (campaignsRes.success && campaignsRes.data) {
          const campaignList = Array.isArray(campaignsRes.data) ? campaignsRes.data : [];
          setCampaigns(campaignList);
          setFilteredCampaigns(campaignList);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load campaigns'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hasAccess, router]);

  useEffect(() => {
    let filtered = [...campaigns];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign => 
        campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, typeFilter, statusFilter]);

  const getCampaignIcon = (type: CampaignType) => {
    switch (type) {
      case CampaignType.EMAIL: return <Mail className="h-4 w-4" />;
      case CampaignType.SMS: return <MessageSquare className="h-4 w-4" />;
      case CampaignType.SOCIAL_MEDIA: return <Share2 className="h-4 w-4" />;
      case CampaignType.EVENT: return <Users className="h-4 w-4" />;
      case CampaignType.WEBINAR: return <Users className="h-4 w-4" />;
      case CampaignType.ADVERTISING: return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
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
    if (!value) return locale === 'ar' ? 'ر.ع 0' : '0 OMR';
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    return locale === 'ar' ? `${formatted} ر.ع` : `${formatted} OMR`;
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calculateROI = (campaign: Campaign) => {
    if (!campaign.actualCost || campaign.actualCost === 0) return 0;
    const revenue = campaign.metrics?.revenue || 0;
    const cost = campaign.actualCost;
    return ((revenue - cost) / cost) * 100;
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('crm.campaigns.title')}</h1>
          <p className="text-muted-foreground">{t('crm.campaigns.description')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => router.push('/dashboard/crm/campaigns/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.campaigns.campaignsCreateNew')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('crm.campaigns.campaignsSearchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as CampaignType | 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder={t('crm.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                {CAMPAIGN_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {t(`crm.campaigns.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CampaignStatus | 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder={t('crm.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                {CAMPAIGN_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {t(`crm.campaigns.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns DataTable (shadcn) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('crm.campaigns.title')}</CardTitle>
          <CardDescription>
            {filteredCampaigns.length} {t('crm.campaigns.campaignsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <CampaignsDataTable data={filteredCampaigns} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
