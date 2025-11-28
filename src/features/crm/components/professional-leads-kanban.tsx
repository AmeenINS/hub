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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
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
            >
              <Card
                ref={setNodeRef}
                className={`flex flex-col h-full transition-all ${
                  isOver || dragOverStatus === column.status ? 'ring-2 ring-primary/30 shadow-lg' : ''
                }`}
              >
                <CardHeader className="pb-3 space-y-2 border-b">
                  <div className="flex items-center justify-between">
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
                      <span>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'OMR',
                        }).format(totalValue)}
                      </span>
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
                      className={`flex-1 space-y-3 min-h-[400px] p-2 rounded-lg border transition-colors ${
                        isOver || dragOverStatus === column.status
                          ? 'bg-muted/70 border-primary/50'
                          : 'bg-muted/30 border-transparent'
                      }`}
                    >
                      <AnimatePresence mode="popLayout">
                        {statusLeads.length === 0 ? (
                          <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12 text-sm text-muted-foreground"
                          >
                            {t('crm.noLeadsInColumn')}
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
          <Card className="w-80 opacity-80 rotate-3 shadow-2xl">
            <CardContent className="p-4">
              <div className="font-semibold">{activeLead.title}</div>
              <div className="text-sm text-muted-foreground">{activeLead.description}</div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
