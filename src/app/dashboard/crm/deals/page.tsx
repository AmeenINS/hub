'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Loader2, Plus, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Deal, DealStage } from '@/shared/types/database';
import { useViewPreference } from '@/shared/hooks/use-view-preference';

export default function DealsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<DealStage | 'ALL'>('ALL');
  const [view, setView] = useViewPreference({ key: 'deals-view', defaultView: 'kanban' });
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('crm_deals');
  const hasFetchedRef = useRef(false);

  const stages: { name: DealStage; label: string; color: string }[] = [
    { name: DealStage.PROSPECTING, label: t('crm.stageProspecting'), color: 'bg-slate-500' },
    { name: DealStage.QUALIFICATION, label: t('crm.stageQualification'), color: 'bg-blue-500' },
    { name: DealStage.PROPOSAL, label: t('crm.stageProposal'), color: 'bg-yellow-500' },
    { name: DealStage.NEGOTIATION, label: t('crm.stageNegotiation'), color: 'bg-orange-500' },
    { name: DealStage.CLOSED_WON, label: t('crm.stageClosed'), color: 'bg-green-500' },
  ];

  useEffect(() => {
    if (!isLoading && canView && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDeals();
    }
  }, [canView, isLoading]);

  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchDeals();
    }
  }, [stageFilter, searchQuery]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stageFilter !== 'ALL') params.append('stage', stageFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get<Deal[]>(`/api/crm/deals?${params.toString()}`);
      if (response.success && response.data) {
        setDeals(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch deals'));
    } finally {
      setLoading(false);
    }
  };
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    
    if (!canWrite) {
      toast.error(t('messages.noPermission'));
      return;
    }

    try {
      const response = await apiClient.patch(`/api/crm/deals/${dealId}`, { stage: newStage });
      if (response.success) {
        toast.success(t('crm.dealUpdated'));
        fetchDeals();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update deal'));
    }
  };

  const getDealsByStage = (stage: DealStage) => {
    return deals.filter(deal => deal.stage === stage);
  };

  const formatCurrency = (value: number) => {
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    return locale === 'ar' ? `${formatted} ر.ع` : `${formatted} OMR`;
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return null;
  }

  const canCreate = canWrite;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('crm.deals')}</h1>
          <p className="text-muted-foreground">{t('crm.dealsDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')}>
            {view === 'kanban' ? 'List View' : 'Kanban View'}
          </Button>
          {canCreate && (
            <Button onClick={() => router.push('/dashboard/crm/deals/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.addDeal')}
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as DealStage | 'ALL')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.name} value={stage.name}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stages.map((stage) => {
            const stageDeals = getDealsByStage(stage.name);
            const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

            return (
              <div
                key={stage.name}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.name)}
                className="flex flex-col"
              >
                <Card className="flex-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          {stage.label}
                        </CardTitle>
                        <CardDescription>{stageDeals.length} {t('crm.deals').toLowerCase()}</CardDescription>
                      </div>
                      <Badge variant="outline">{formatCurrency(stageValue)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stageDeals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {t('crm.noDealsFound')}
                      </p>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          draggable={canWrite}
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          className="bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(`/dashboard/crm/deals/${deal.id}`)}
                        >
                          <h4 className="font-medium mb-2 line-clamp-1">{deal.name}</h4>
                          {deal.value && (
                            <p className="text-sm font-semibold text-green-600 mb-2">
                              {formatCurrency(deal.value)}
                            </p>
                          )}
                          {deal.premium && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {t('crm.premium')}: {formatCurrency(deal.premium)}
                            </div>
                          )}
                          {deal.policyEndDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(deal.policyEndDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.allDeals')}</CardTitle>
            <CardDescription>{deals.length} {t('crm.deals').toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/crm/deals/${deal.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{deal.name}</h3>
                    {deal.description && (
                      <p className="text-sm text-muted-foreground mt-1">{deal.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <Badge>{stages.find(s => s.name === deal.stage)?.label}</Badge>
                      {deal.value && (
                        <span className="font-semibold text-green-600">{formatCurrency(deal.value)}</span>
                      )}
                      {deal.premium && (
                        <span className="text-muted-foreground">
                          {t('crm.premium')}: {formatCurrency(deal.premium)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {t('crm.viewDetails')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
