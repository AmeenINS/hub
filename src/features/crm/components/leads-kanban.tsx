'use client';

import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Calendar, DollarSign, User, MapPin } from 'lucide-react';
import { Lead, LeadStatus } from '@/shared/types/database';
import { SortableLeadCard } from './sortable-lead-card';
import { useState } from 'react';

interface LeadsKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onReorder?: (leadId: string, newIndex: number, status: LeadStatus) => void;
}

const statusConfig = {
  [LeadStatus.NEW]: { label: 'crm.statusNew', color: 'bg-slate-100 dark:bg-slate-900' },
  [LeadStatus.QUALIFIED]: { label: 'crm.statusQualified', color: 'bg-blue-100 dark:bg-blue-900' },
  [LeadStatus.PROPOSAL]: { label: 'crm.statusProposal', color: 'bg-yellow-100 dark:bg-yellow-900' },
  [LeadStatus.NEGOTIATION]: { label: 'crm.statusNegotiation', color: 'bg-orange-100 dark:bg-orange-900' },
  [LeadStatus.CLOSED_WON]: { label: 'crm.statusClosedWon', color: 'bg-green-100 dark:bg-green-900' },
  [LeadStatus.CLOSED_LOST]: { label: 'crm.statusClosedLost', color: 'bg-red-100 dark:bg-red-900' },
};

const priorityConfig = {
  LOW: { variant: 'secondary' as const, color: 'border-l-blue-500' },
  MEDIUM: { variant: 'default' as const, color: 'border-l-yellow-500' },
  HIGH: { variant: 'default' as const, color: 'border-l-orange-500' },
  URGENT: { variant: 'destructive' as const, color: 'border-l-red-500' },
};

export default function LeadsKanban({ leads, onLeadClick, onStatusChange, onReorder }: LeadsKanbanProps) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const statusColumns = useMemo(() => [
    { status: LeadStatus.NEW, label: t('crm.statusNew') },
    { status: LeadStatus.QUALIFIED, label: t('crm.statusQualified') },
    { status: LeadStatus.PROPOSAL, label: t('crm.statusProposal') },
    { status: LeadStatus.NEGOTIATION, label: t('crm.statusNegotiation') },
    { status: LeadStatus.CLOSED_WON, label: t('crm.statusClosedWon') },
    { status: LeadStatus.CLOSED_LOST, label: t('crm.statusClosedLost') },
  ], [t]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      [LeadStatus.NEW]: [],
      [LeadStatus.QUALIFIED]: [],
      [LeadStatus.PROPOSAL]: [],
      [LeadStatus.NEGOTIATION]: [],
      [LeadStatus.CLOSED_WON]: [],
      [LeadStatus.CLOSED_LOST]: [],
    };

    leads.forEach((lead) => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    // Sort each column by displayOrder or createdAt
    Object.keys(grouped).forEach((status) => {
      grouped[status as LeadStatus].sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return grouped;
  }, [leads]);

  const calculateColumnValue = (status: LeadStatus) => {
    return leadsByStatus[status].reduce((sum, lead) => sum + (lead.currentPremium || 0), 0);
  };

  const activeLead = useMemo(
    () => leads.find((lead) => lead.id === activeId),
    [activeId, leads]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Just for visual feedback during drag
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead) return;

    // Check if dropping on a column droppable area
    if (overId.startsWith('column-')) {
      const newStatus = overId.replace('column-', '') as LeadStatus;
      if (activeLead.status !== newStatus) {
        onStatusChange(activeId, newStatus);
      }
      return;
    }

    // Check if dropping on another lead
    const overLead = leads.find((l) => l.id === overId);
    if (!overLead) return;

    // If different status, change status
    if (activeLead.status !== overLead.status) {
      onStatusChange(activeId, overLead.status);
    }
    // If same status and reorder is enabled, reorder
    else if (onReorder) {
      const columnLeads = leadsByStatus[activeLead.status];
      const oldIndex = columnLeads.findIndex((l) => l.id === activeId);
      const newIndex = columnLeads.findIndex((l) => l.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        onReorder(activeId, newIndex, activeLead.status);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-max px-1">
        {statusColumns.map((column) => {
          const columnLeads = leadsByStatus[column.status];
          const columnValue = calculateColumnValue(column.status);

          return (
            <Card key={column.status} className="flex flex-col overflow-hidden w-[340px] shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
              {/* Column Header */}
              <div className={`p-4 border-b ${statusConfig[column.status].color} border-b-2`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{column.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnLeads.length}
                    </Badge>
                  </div>
                  {columnValue > 0 && (
                    <div className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'OMR',
                        minimumFractionDigits: 0,
                      }).format(columnValue)}
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Cards Container */}
              <SortableContext
                id={`column-${column.status}`}
                items={columnLeads.map((lead) => lead.id)}
                strategy={verticalListSortingStrategy}
              >
                <ColumnDroppable id={`column-${column.status}`} status={column.status}>
                  {columnLeads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      <p>{t('crm.noLeadsInColumn')}</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <SortableLeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => onLeadClick(lead)}
                        isActive={activeId === lead.id}
                      />
                    ))
                  )}
                </ColumnDroppable>
                </SortableContext>
              </motion.div>
            </Card>
          );
        })}
        </div>
      </div>    {/* Drag Overlay for visual feedback */}
    <DragOverlay>
      {activeId ? (
        <div className="opacity-50 rotate-3 cursor-grabbing">
          <LeadCard
            lead={leads.find((l) => l.id === activeId)!}
            onClick={() => {}}
            isDragging={true}
          />
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
  );
}

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
}

function ColumnDroppable({ id, status, children }: { id: string; status: LeadStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-3 space-y-3 min-h-[500px] overflow-y-auto transition-colors ${
        isOver ? 'bg-muted/30' : ''
      }`}
    >
      {children}
    </div>
  );
}

export function LeadCard({ lead, onClick, isDragging = false }: LeadCardProps) {
  const { t } = useI18n();
  const priorityInfo = priorityConfig[lead.priority || 'MEDIUM'];
  
  const priorityLabels = {
    LOW: t('crm.priorityLow'),
    MEDIUM: t('crm.priorityMedium'),
    HIGH: t('crm.priorityHigh'),
    URGENT: t('crm.priorityUrgent'),
  };

  const isOverdue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        className={`cursor-pointer transition-all border-l-4 ${
          priorityInfo.color
        } ${isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'}`}
      >
        <div className="p-3 space-y-3">
          {/* Title */}
          <div>
            <h4 className="font-semibold text-sm line-clamp-2">{lead.title}</h4>
            {lead.source && (
              <p className="text-xs text-muted-foreground mt-1">{lead.source}</p>
            )}
          </div>

          {/* Priority */}
          <Badge variant={priorityInfo.variant} className="text-xs w-fit">
            {priorityLabels[lead.priority || 'MEDIUM']}
          </Badge>

          {/* Description */}
          {lead.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {lead.description}
            </p>
          )}

          {/* Insurance Type */}
          {lead.insuranceType && (
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="outline" className="text-xs">
                {lead.insuranceType}
              </Badge>
            </div>
          )}

          {/* Value */}
          {lead.currentPremium && lead.currentPremium > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
              <DollarSign className="h-3 w-3" />
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'OMR',
                minimumFractionDigits: 0,
              }).format(lead.currentPremium)}
            </div>
          )}

          {/* Follow-up Date */}
          {lead.nextFollowUpDate && (
            <div className={`flex items-center gap-1 text-xs p-2 rounded ${
              isOverdue ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(lead.nextFollowUpDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Assigned To */}
          {lead.assignedTo && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{t('crm.assigned')}</span>
            </div>
          )}

          {/* Location if available */}
          {lead.notes && (
            <div className="flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{lead.notes}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
