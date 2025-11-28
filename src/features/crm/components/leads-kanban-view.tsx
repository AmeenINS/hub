'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Lead, LeadStatus } from '@/shared/types/database';
import { LeadKanbanCard } from '@/features/crm/components/lead-kanban-card';
import { TrendingUp } from 'lucide-react';

interface LeadsKanbanViewProps {
  leads: Lead[];
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
  onCardClick?: (lead: Lead) => void;
}

export function LeadsKanbanView({ leads, onStatusChange, onCardClick }: LeadsKanbanViewProps) {
  const { t } = useI18n();

  const columns: { status: LeadStatus; label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }[] = [
    { status: LeadStatus.NEW, label: t('crm.statusNew'), variant: 'default' },
    { status: LeadStatus.QUALIFIED, label: t('crm.statusQualified'), variant: 'outline' },
    { status: LeadStatus.PROPOSAL, label: t('crm.statusProposal'), variant: 'secondary' },
    { status: LeadStatus.NEGOTIATION, label: t('crm.statusNegotiation'), variant: 'secondary' },
    { status: LeadStatus.CLOSED_WON, label: t('crm.statusClosedWon'), variant: 'default' },
    { status: LeadStatus.CLOSED_LOST, label: t('crm.statusClosedLost'), variant: 'destructive' },
  ];

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'OMR',
    }).format(amount);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnLeads = getLeadsByStatus(column.status);
        const totalValue = columnLeads.reduce((sum, lead) => sum + (lead.currentPremium || 0), 0);

        return (
          <div key={column.status} className="shrink-0 w-[350px]">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Badge variant={column.variant}>{column.label}</Badge>
                      <span className="text-muted-foreground">({columnLeads.length})</span>
                    </CardTitle>
                    {totalValue > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(totalValue)}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 min-h-[200px]">
                  {columnLeads.map((lead) => (
                    <LeadKanbanCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => onCardClick?.(lead)}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                  {columnLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <div className="text-xs">{t('crm.noLeadsInColumn')}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
