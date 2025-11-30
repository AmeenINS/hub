'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, Plus, Search, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Deal, DealStage } from '@/shared/types/database';
import { useViewPreference } from '@/shared/hooks/use-view-preference';
import DealsKanban from '@/features/crm/components/deals-kanban';
import { DealsDataTable } from '@/features/crm/components/deals-data-table';

type ViewType = 'table' | 'kanban';

export default function DealsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<DealStage | 'ALL'>('ALL');
  const [activeView, setActiveView] = useViewPreference({ key: 'deals-view', defaultView: 'table' });
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('crm_deals');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && canView && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDeals();
    }
  }, [canView, isLoading]);

  const fetchDeals = useCallback(async () => {
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
  }, [stageFilter, searchQuery]);

  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchDeals();
    }
  }, [fetchDeals]);

  const handleDealClick = (deal: Deal) => {
    router.push(`/dashboard/crm/deals/${deal.id}`);
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    // Optimistic update
    const previousDeals = [...deals];
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.id === dealId 
          ? { ...deal, stage: newStage }
          : deal
      )
    );

    try {
      const response = await apiClient.patch(`/api/crm/deals/${dealId}`, { stage: newStage });
      if (response.success) {
        toast.success(t('crm.stageUpdated'));
      } else {
        setDeals(previousDeals);
        toast.error(t('crm.stageUpdateFailed'));
      }
    } catch (error) {
      setDeals(previousDeals);
      toast.error(getErrorMessage(error, t('crm.stageUpdateFailed')));
    }
  };

  const handleReorder = async (dealId: string, newIndex: number, stage: DealStage) => {
    const columnDeals = deals
      .filter(deal => deal.stage === stage)
      .sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    
    const draggedDeal = columnDeals.find(deal => deal.id === dealId);
    if (!draggedDeal) return;

    const currentIndex = columnDeals.findIndex(deal => deal.id === dealId);
    const targetIndex = Math.max(0, Math.min(newIndex, columnDeals.length - 1));
    
    if (currentIndex === targetIndex) return;

    const previousDeals = [...deals];
    const reorderedColumnDeals = [...columnDeals];
    
    const [draggedItem] = reorderedColumnDeals.splice(currentIndex, 1);
    reorderedColumnDeals.splice(targetIndex, 0, draggedItem);

    const updatedColumnDeals = reorderedColumnDeals.map((deal, index) => ({
      ...deal,
      displayOrder: index
    }));

    const reorderedDeals = deals.map(deal => {
      if (deal.stage !== stage) return deal;
      const updatedDeal = updatedColumnDeals.find(d => d.id === deal.id);
      return updatedDeal || deal;
    });

    setDeals(reorderedDeals);

    try {
      const response = await apiClient.patch(`/api/crm/deals/${dealId}`, { 
        displayOrder: newIndex
      });
      
      if (response.success) {
        toast.success(t('crm.dealReordered'));
      } else {
        setDeals(previousDeals);
        toast.error(t('crm.reorderFailed'));
      }
    } catch (error) {
      setDeals(previousDeals);
      toast.error(getErrorMessage(error, t('crm.reorderFailed')));
    }
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

  // Filter deals based on search and stage
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !searchQuery || 
      deal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'ALL' || deal.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('crm.deals')}</h1>
          <p className="text-muted-foreground">{t('crm.dealsDescription')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => router.push('/dashboard/crm/deals/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.addDeal')}
          </Button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('crm.dealsSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as DealStage | 'ALL')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('crm.dealStage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                <SelectItem value={DealStage.PROSPECTING}>{t('crm.stageProspecting')}</SelectItem>
                <SelectItem value={DealStage.QUALIFICATION}>{t('crm.stageQualification')}</SelectItem>
                <SelectItem value={DealStage.PROPOSAL}>{t('crm.stageProposal')}</SelectItem>
                <SelectItem value={DealStage.NEGOTIATION}>{t('crm.stageNegotiation')}</SelectItem>
                <SelectItem value={DealStage.CLOSED_WON}>{t('crm.stageClosed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deals View - Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as ViewType)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            {t('crm.tableView')}
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            {t('crm.kanbanView')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <DealsDataTable data={filteredDeals} />
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <DealsKanban
            deals={filteredDeals}
            onDealClick={handleDealClick}
            onStageChange={handleStageChange}
            onReorder={handleReorder}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
