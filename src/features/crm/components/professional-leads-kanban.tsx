'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Lead, LeadStatus } from '@/shared/types/database';
import { KanbanCard } from '@/features/crm/components/kanban-card';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';

interface ProfessionalLeadsKanbanProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onCardClick: (leadId: string) => void;
  onCreateNew?: (status: LeadStatus) => void;
}

const LEAD_STATUS_COLUMNS = [
  { status: LeadStatus.NEW, color: 'bg-slate-500', label: 'statusNew' },
  { status: LeadStatus.QUALIFIED, color: 'bg-blue-500', label: 'statusQualified' },
  { status: LeadStatus.PROPOSAL, color: 'bg-yellow-500', label: 'statusProposal' },
  { status: LeadStatus.NEGOTIATION, color: 'bg-orange-500', label: 'statusNegotiation' },
  { status: LeadStatus.CLOSED_WON, color: 'bg-green-500', label: 'statusClosedWon' },
  { status: LeadStatus.CLOSED_LOST, color: 'bg-red-500', label: 'statusClosedLost' },
];

export function ProfessionalLeadsKanban({
  leads,
  onStatusChange,
  onCardClick,
  onCreateNew,
}: ProfessionalLeadsKanbanProps) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'OMR',
      maximumFractionDigits: 0,
    }).format(value);

  const priorityLabels: Record<NonNullable<Lead['priority']>, string> = {
    LOW: t('crm.priorityLow'),
    MEDIUM: t('crm.priorityMedium'),
    HIGH: t('crm.priorityHigh'),
    URGENT: t('crm.priorityUrgent'),
  };

  const totalPipelineValue = leads.reduce(
    (sum, lead) => sum + (lead.currentPremium || 0),
    0
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overStatus = event.over?.id as LeadStatus | undefined;
    if (overStatus && Object.values(LeadStatus).includes(overStatus)) {
      setDragOverStatus(overStatus);
    } else {
      setDragOverStatus(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragOverStatus(null);

    if (!over) return;

    const activeLeadId = active.id as string;
    const activeLead = leads.find((lead) => lead.id === activeLeadId);
    if (!activeLead) return;

    // Check if dropped on a column (over.id will be a LeadStatus value)
    const allStatuses = Object.values(LeadStatus);
    const overStatus = allStatuses.includes(over.id as LeadStatus) 
      ? (over.id as LeadStatus)
      : null;

    if (overStatus && overStatus !== activeLead.status) {
      onStatusChange(activeLeadId, overStatus);
    } else if (!overStatus) {
      // Dropped on another card - use its status
      const overLead = leads.find((lead) => lead.id === over.id);
      if (overLead && overLead.status !== activeLead.status) {
        onStatusChange(activeLeadId, overLead.status);
      }
    }
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const calculateTotalValue = (statusLeads: Lead[]) => {
    return statusLeads.reduce((sum, lead) => sum + (lead.currentPremium || 0), 0);
  };

  const activeLead = activeId ? leads.find((lead) => lead.id === activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{t('crm.kanbanView')}</h3>
            <Badge variant="secondary" className="text-xs">
              {leads.length} {t('crm.leads')}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatCurrency(totalPipelineValue)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t('crm.leadsDescription')}</p>
        </div>
        {onCreateNew && (
          <Button
            onClick={() => onCreateNew(LeadStatus.NEW)}
            size="sm"
            className="self-start shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.addLead')}
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 -mx-2 px-2">
          {LEAD_STATUS_COLUMNS.map((column) => {
            const { setNodeRef, isOver } = useDroppable({
              id: column.status,
            });
            const statusLeads = getLeadsByStatus(column.status);
            const totalValue = calculateTotalValue(statusLeads);

            return (
              <motion.div
                key={column.status}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="min-w-[280px] md:min-w-[320px] flex-1"
              >
                <Card
                  ref={setNodeRef}
                  className={`flex flex-col h-full border-muted-foreground/10 transition-all ${
                    isOver || dragOverStatus === column.status ? 'ring-2 ring-primary/30 shadow-lg' : ''
                  }`}
                >
                  <CardHeader className="pb-3 space-y-2 border-b bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                        <CardTitle className="text-sm font-semibold">
                          {t(`crm.${column.label}`)}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {statusLeads.length}
                        </Badge>
                      </div>
                      {onCreateNew && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => onCreateNew(column.status)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {totalValue > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>{formatCurrency(totalValue)}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    <SortableContext
                      id={column.status}
                      items={statusLeads.map((lead) => lead.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        className={`flex-1 space-y-3 min-h-[420px] p-2 rounded-lg border transition-colors ${
                          isOver || dragOverStatus === column.status
                            ? 'bg-primary/5 border-primary/40 shadow-inner'
                            : 'bg-muted/30 border-dashed border-transparent'
                        }`}
                      >
                        <AnimatePresence mode="popLayout">
                          {statusLeads.length === 0 ? (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-col items-center justify-center text-center py-10 text-sm text-muted-foreground gap-2"
                            >
                              {t('crm.noLeadsInColumn')}
                              {onCreateNew && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => onCreateNew(column.status)}
                                >
                                  <Plus className="h-4 w-4" />
                                  {t('crm.addLead')}
                                </Button>
                              )}
                            </motion.div>
                          ) : (
                            statusLeads.map((lead) => (
                              <motion.div
                                key={lead.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.15 }}
                              >
                                <KanbanCard
                                  lead={lead}
                                  onClick={() => onCardClick(lead.id)}
                                />
                              </motion.div>
                            ))
                          )}
                        </AnimatePresence>
                      </div>
                    </SortableContext>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? (
            <Card className="w-80 shadow-2xl border-primary/30 bg-background/95">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm line-clamp-2">{activeLead.title}</div>
                  {activeLead.priority && (
                    <Badge variant="secondary" className="text-xs">
                      {priorityLabels[activeLead.priority]}
                    </Badge>
                  )}
                </div>
                {activeLead.description && (
                  <div className="text-xs text-muted-foreground line-clamp-3">
                    {activeLead.description}
                  </div>
                )}
                {(activeLead.currentPremium || activeLead.expectedCloseDate) && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    {activeLead.currentPremium ? (
                      <span className="font-semibold text-foreground">
                        {formatCurrency(activeLead.currentPremium)}
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                    {activeLead.expectedCloseDate && (
                      <span>
                        {new Date(activeLead.expectedCloseDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
