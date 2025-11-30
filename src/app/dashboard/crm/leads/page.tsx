'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, Plus, Search, Users, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead, LeadStatus } from '@/shared/types/database';
import { LeadsDataTable } from '@/features/crm/components/leads-data-table';
import LeadsKanban from '@/features/crm/components/leads-kanban';
import { useViewPreference } from '@/shared/hooks/use-view-preference';

export default function LeadsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [insuranceTypeFilter, setInsuranceTypeFilter] = useState<string>('ALL');
  const [activeView, setActiveView] = useViewPreference({ key: 'leads-view', defaultView: 'table' });
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('crm_leads');
  const hasFetchedRef = useRef(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (insuranceTypeFilter !== 'ALL') params.append('insuranceType', insuranceTypeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiClient.get<Lead[]>(`/api/crm/leads?${params.toString()}`);
      if (response.success && response.data) {
        setLeads(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch leads'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, insuranceTypeFilter, searchQuery]);

  useEffect(() => {
    if (!isLoading && canView && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchLeads();
    }
  }, [canView, isLoading, fetchLeads]);

  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchLeads();
    }
  }, [fetchLeads]);

  const handleEdit = (lead: Lead) => {
    router.push(`/dashboard/crm/leads/${lead.id}/edit`);
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(t('common.confirm'))) return;
    
    // Optimistic delete - remove from UI immediately
    const previousLeads = [...leads];
    setLeads(prevLeads => prevLeads.filter(l => l.id !== lead.id));
    
    try {
      const response = await apiClient.delete(`/api/crm/leads/${lead.id}`);
      if (response.success) {
        toast.success(t('crm.deleteSuccess'));
      } else {
        // Revert on failure
        setLeads(previousLeads);
        toast.error(t('crm.deleteFailed'));
      }
    } catch (error) {
      // Revert on error
      setLeads(previousLeads);
      toast.error(getErrorMessage(error, t('crm.deleteFailed')));
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    // Optimistic update - update UI immediately
    const previousLeads = [...leads];
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: newStatus }
          : lead
      )
    );

    try {
      const response = await apiClient.patch(`/api/crm/leads/${leadId}`, { status: newStatus });
      if (response.success) {
        toast.success(t('crm.statusUpdated'));
        // No need to refetch - already updated optimistically
      } else {
        // Revert on failure
        setLeads(previousLeads);
        toast.error(t('crm.statusUpdateFailed'));
      }
    } catch (error) {
      // Revert on error
      setLeads(previousLeads);
      toast.error(getErrorMessage(error, t('crm.statusUpdateFailed')));
    }
  };

  const handleReorder = async (leadId: string, newIndex: number, status: LeadStatus) => {
    // Get leads with this status, sorted by displayOrder or createdAt
    const columnLeads = leads
      .filter(lead => lead.status === status)
      .sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    
    // Find current position of dragged lead
    const draggedLead = columnLeads.find(lead => lead.id === leadId);
    if (!draggedLead) return;

    const currentIndex = columnLeads.findIndex(lead => lead.id === leadId);
    
    // Clamp newIndex to valid range
    const targetIndex = Math.max(0, Math.min(newIndex, columnLeads.length - 1));
    
    // If no actual change, return early
    if (currentIndex === targetIndex) return;

    // Optimistic reorder - swap positions
    const previousLeads = [...leads];
    const reorderedColumnLeads = [...columnLeads];
    
    // Remove the dragged lead from its current position
    const [draggedItem] = reorderedColumnLeads.splice(currentIndex, 1);
    
    // Insert it at the target position (this will shift other items)
    reorderedColumnLeads.splice(targetIndex, 0, draggedItem);

    // Update displayOrder for all leads in this column
    const updatedColumnLeads = reorderedColumnLeads.map((lead, index) => ({
      ...lead,
      displayOrder: index
    }));

    // Build new leads array with reordered column and updated displayOrders
    const reorderedLeads = leads.map(lead => {
      if (lead.status !== status) return lead;
      const updatedLead = updatedColumnLeads.find(l => l.id === lead.id);
      return updatedLead || lead;
    });

    setLeads(reorderedLeads);

    try {
      // Call API to persist the new order if backend supports it
      // Note: This endpoint might not exist yet, but we handle it gracefully
      const response = await apiClient.patch(`/api/crm/leads/${leadId}`, { 
        displayOrder: newIndex
      });
      
      if (response.success) {
        toast.success(t('crm.leadReordered'));
      } else {
        // Revert on failure
        setLeads(previousLeads);
        toast.error(t('crm.reorderFailed'));
      }
    } catch (error) {
      // Revert on error
      setLeads(previousLeads);
      toast.error(getErrorMessage(error, t('crm.reorderFailed')));
    }
  };

  const handleCreateNew = (status: LeadStatus) => {
    router.push(`/dashboard/crm/leads/new?status=${status}`);
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
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('crm.leads')}</h1>
          <p className="text-muted-foreground">{t('crm.leadsDescription')}</p>
        </div>
        {canCreate && (
          <Button onClick={() => router.push('/dashboard/crm/leads/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.addLead')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.search')}</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crm.leadStatus')}</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                  <SelectItem value="NEW">{t('crm.statusNew')}</SelectItem>
                  <SelectItem value="CONTACTED">{t('crm.statusContacted')}</SelectItem>
                  <SelectItem value="QUALIFIED">{t('crm.statusQualified')}</SelectItem>
                  <SelectItem value="UNQUALIFIED">{t('crm.statusUnqualified')}</SelectItem>
                  <SelectItem value="CONVERTED">{t('crm.statusConverted')}</SelectItem>
                  <SelectItem value="LOST">{t('crm.statusLost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crm.insuranceType')}</label>
              <Select value={insuranceTypeFilter} onValueChange={(value) => setInsuranceTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                  <SelectItem value="AUTO">{t('crm.insuranceAuto')}</SelectItem>
                  <SelectItem value="HEALTH">{t('crm.insuranceHealth')}</SelectItem>
                  <SelectItem value="LIFE">{t('crm.insuranceLife')}</SelectItem>
                  <SelectItem value="PROPERTY">{t('crm.insuranceProperty')}</SelectItem>
                  <SelectItem value="TRAVEL">{t('crm.insuranceTravel')}</SelectItem>
                  <SelectItem value="MARINE">{t('crm.insuranceMarine')}</SelectItem>
                  <SelectItem value="OTHER">{t('crm.insuranceOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Views */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'table' | 'kanban')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <TableIcon className="h-4 w-4" />
            {t('crm.tableView')}
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            {t('crm.kanbanView')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.allLeads')}</CardTitle>
              <CardDescription>
                {leads.length} {t('crm.leads').toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">{t('crm.noLeadsFound')}</h3>
                  <p className="text-muted-foreground">{t('crm.getStarted')}</p>
                  {canCreate && (
                    <Button className="mt-4" onClick={() => router.push('/dashboard/crm/leads/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('crm.addLead')}
                    </Button>
                  )}
                </div>
              ) : (
                <LeadsDataTable 
                  data={leads}
                  onEdit={canWrite ? handleEdit : undefined}
                  onDelete={canFull ? handleDelete : undefined}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          {leads.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">{t('crm.noLeadsFound')}</h3>
                  <p className="text-muted-foreground">{t('crm.getStarted')}</p>
                  {canCreate && (
                    <Button className="mt-4" onClick={() => router.push('/dashboard/crm/leads/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('crm.addLead')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <LeadsKanban
              leads={leads}
              onStatusChange={handleStatusChange}
              onReorder={handleReorder}
              onLeadClick={(lead: Lead) => router.push(`/dashboard/crm/leads/${lead.id}`)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
