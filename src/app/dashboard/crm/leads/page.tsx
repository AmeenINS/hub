'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Loader2, Plus, Search, TrendingUp, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead, LeadStatus } from '@/shared/types/database';

interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byInsuranceType: Record<string, number>;
  totalValue: number;
  averageValue: number;
}

export default function LeadsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [insuranceTypeFilter, setInsuranceTypeFilter] = useState<string>('ALL');
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('crm_leads');

  useEffect(() => {
    if (!isLoading && canView) {
      fetchLeads();
      fetchStats();
    }
  }, [statusFilter, insuranceTypeFilter, searchQuery, canView, isLoading]);

  const fetchLeads = async () => {
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
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<LeadStats>('/api/crm/leads/stats');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    const variants: Record<LeadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NEW: 'default',
      QUALIFIED: 'outline',
      PROPOSAL: 'secondary',
      NEGOTIATION: 'secondary',
      CLOSED_WON: 'default',
      CLOSED_LOST: 'destructive',
    };

    const labels: Record<LeadStatus, string> = {
      NEW: t('crm.statusNew'),
      QUALIFIED: t('crm.statusQualified'),
      PROPOSAL: t('crm.statusProposal'),
      NEGOTIATION: t('crm.statusNegotiation'),
      CLOSED_WON: t('crm.statusClosedWon'),
      CLOSED_LOST: t('crm.statusClosedLost'),
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      LOW: 'secondary',
      MEDIUM: 'default',
      HIGH: 'destructive',
      URGENT: 'destructive',
    };

    const labels: Record<string, string> = {
      LOW: t('crm.priorityLow'),
      MEDIUM: t('crm.priorityMedium'),
      HIGH: t('crm.priorityHigh'),
      URGENT: t('crm.priorityUrgent'),
    };

    return (
      <Badge variant={variants[priority] || 'default'}>
        {labels[priority] || priority}
      </Badge>
    );
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

  if (!canView) {
    return null;
  }

  const canCreate = canWrite;

  return (
    <div className="space-y-6">
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

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('crm.totalLeads')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('crm.statusQualified')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.QUALIFIED || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('crm.totalRevenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('crm.averageValue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageValue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
          <CardDescription>{t('crm.filterByStatus')}</CardDescription>
        </CardHeader>
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

      {/* Leads Table */}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('crm.fullNameEn')}</TableHead>
                  <TableHead>{t('crm.leadStatus')}</TableHead>
                  <TableHead>{t('crm.insuranceType')}</TableHead>
                  <TableHead>{t('crm.priority')}</TableHead>
                  <TableHead>{t('crm.currentPremium')}</TableHead>
                  <TableHead>{t('crm.nextFollowUp')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow 
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/crm/leads/${lead.id}`)}
                  >
                    <TableCell className="font-medium">{lead.title}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      {lead.insuranceType ? t(`crm.insurance${lead.insuranceType.charAt(0) + lead.insuranceType.slice(1).toLowerCase()}`) : '-'}
                    </TableCell>
                    <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                    <TableCell>{lead.currentPremium ? formatCurrency(lead.currentPremium) : '-'}</TableCell>
                    <TableCell>
                      {lead.nextFollowUpDate 
                        ? new Date(lead.nextFollowUpDate).toLocaleDateString() 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/leads/${lead.id}`);
                        }}
                      >
                        {t('crm.viewDetails')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
