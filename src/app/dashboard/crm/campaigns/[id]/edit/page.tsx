'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { CampaignType, CampaignStatus, Campaign, User } from '@/shared/types/database';

interface CampaignFormData {
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  actualRevenue?: number;
  targetAudience?: string;
  targetLeads?: number;
  targetRevenue?: number;
  leadsGenerated?: number;
  dealsGenerated?: number;
  ownerId?: string;
}

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

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const { hasAccess, level } = usePermissionLevel('crm_campaigns');
  const hasFetchedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: CampaignType.EMAIL,
    status: CampaignStatus.DRAFT
  });

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard/access-denied');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [campaignRes, usersRes] = await Promise.all([
          apiClient.get(`/api/crm/campaigns/${resolvedParams.id}`),
          apiClient.get('/api/users')
        ]);

        if (campaignRes.success && campaignRes.data) {
          const campaignData = campaignRes.data;
          setCampaign(campaignData);
          
          setFormData({
            name: campaignData.name || '',
            description: campaignData.description || undefined,
            type: campaignData.type || 'EMAIL',
            status: campaignData.status || 'PLANNING',
            startDate: campaignData.startDate ? new Date(campaignData.startDate).toISOString().split('T')[0] : undefined,
            endDate: campaignData.endDate ? new Date(campaignData.endDate).toISOString().split('T')[0] : undefined,
            budget: campaignData.budget || undefined,
            actualCost: campaignData.actualCost || undefined,
            actualRevenue: campaignData.actualRevenue || undefined,
            targetAudience: campaignData.targetAudience || undefined,
            targetLeads: campaignData.targetLeads || undefined,
            targetRevenue: campaignData.targetRevenue || undefined,
            leadsGenerated: campaignData.leadsGenerated || undefined,
            dealsGenerated: campaignData.dealsGenerated || undefined,
            ownerId: campaignData.ownerId || undefined
          });
        }

        if (usersRes.success && usersRes.data) {
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t('crm.campaigns.errorLoading')));
      } finally {
        setIsLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [hasAccess, router, resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(t('crm.campaigns.nameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.put(`/api/crm/campaigns/${resolvedParams.id}`, formData);
      
      if (response.success) {
        toast.success(t('crm.campaigns.updateSuccess'));
        router.push(`/dashboard/crm/campaigns/${resolvedParams.id}`);
      } else {
        toast.error(response.message || t('crm.campaigns.updateError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.campaigns.updateError')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('crm.campaigns.edit')}</h1>
            <p className="text-muted-foreground">{campaign.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.campaigns.basicInfo')}</CardTitle>
            <CardDescription>{t('crm.campaigns.basicInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">{t('crm.campaigns.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('crm.campaigns.namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t('crm.campaigns.type')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value as CampaignType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`crm.campaigns.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('crm.campaigns.status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as CampaignStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {t(`crm.campaigns.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">{t('crm.campaigns.startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">{t('crm.campaigns.endDate')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('crm.campaigns.description')}</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('crm.campaigns.descriptionPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget & Targets */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.campaigns.budgetAndTargets')}</CardTitle>
            <CardDescription>{t('crm.campaigns.budgetAndTargetsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">{t('crm.campaigns.budget')} (OMR)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget || ''}
                  onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetLeads">{t('crm.campaigns.targetLeads')}</Label>
                <Input
                  id="targetLeads"
                  type="number"
                  min="0"
                  value={formData.targetLeads || ''}
                  onChange={(e) => handleInputChange('targetLeads', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetRevenue">{t('crm.campaigns.targetRevenue')} (OMR)</Label>
                <Input
                  id="targetRevenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.targetRevenue || ''}
                  onChange={(e) => handleInputChange('targetRevenue', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">{t('crm.campaigns.targetAudience')}</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience || ''}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder={t('crm.campaigns.targetAudiencePlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actual Performance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.campaigns.actualPerformance')}</CardTitle>
            <CardDescription>{t('crm.campaigns.actualPerformanceDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actualCost">{t('crm.campaigns.actualCost')} (OMR)</Label>
                <Input
                  id="actualCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.actualCost || ''}
                  onChange={(e) => handleInputChange('actualCost', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualRevenue">{t('crm.campaigns.actualRevenue')} (OMR)</Label>
                <Input
                  id="actualRevenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.actualRevenue || ''}
                  onChange={(e) => handleInputChange('actualRevenue', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadsGenerated">{t('crm.campaigns.leadsGenerated')}</Label>
                <Input
                  id="leadsGenerated"
                  type="number"
                  min="0"
                  value={formData.leadsGenerated || ''}
                  onChange={(e) => handleInputChange('leadsGenerated', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dealsGenerated">{t('crm.campaigns.dealsGenerated')}</Label>
                <Input
                  id="dealsGenerated"
                  type="number"
                  min="0"
                  value={formData.dealsGenerated || ''}
                  onChange={(e) => handleInputChange('dealsGenerated', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.assignment')}</CardTitle>
            <CardDescription>{t('crm.assignmentDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ownerId">{t('crm.campaigns.owner')}</Label>
              <Select
                value={formData.ownerId}
                onValueChange={(value) => handleInputChange('ownerId', value)}
              >
                <SelectTrigger id="ownerId">
                  <SelectValue placeholder={t('crm.selectUser')} />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullNameEn || user.fullNameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('crm.campaigns.updating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
