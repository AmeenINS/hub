'use client';

import { useMemo, useState } from 'react';
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
import { motion } from 'motion/react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Calendar, DollarSign, User, TrendingUp, FileText } from 'lucide-react';
import { Deal, DealStage } from '@/shared/types/database';
import { SortableDealCard } from './sortable-deal-card';

interface DealsKanbanProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onStageChange: (dealId: string, newStage: DealStage) => void;
  onReorder?: (dealId: string, newIndex: number, stage: DealStage) => void;
}

const stageConfig = {
  [DealStage.PROSPECTING]: { label: 'crm.stageProspecting', color: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' },
  [DealStage.QUALIFICATION]: { label: 'crm.stageQualification', color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
  [DealStage.PROPOSAL]: { label: 'crm.stageProposal', color: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' },
  [DealStage.NEGOTIATION]: { label: 'crm.stageNegotiation', color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800' },
  [DealStage.CLOSED_WON]: { label: 'crm.stageClosed', color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700' },
  [DealStage.CLOSED_LOST]: { label: 'crm.stageLost', color: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' },
};

export default function DealsKanban({ deals, onDealClick, onStageChange, onReorder }: DealsKanbanProps) {
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

  const stageColumns = useMemo(() => [
    { stage: DealStage.PROSPECTING, label: t('crm.stageProspecting') },
    { stage: DealStage.QUALIFICATION, label: t('crm.stageQualification') },
    { stage: DealStage.PROPOSAL, label: t('crm.stageProposal') },
    { stage: DealStage.NEGOTIATION, label: t('crm.stageNegotiation') },
    { stage: DealStage.CLOSED_WON, label: t('crm.stageClosed') },
  ], [t]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, Deal[]> = {
      [DealStage.PROSPECTING]: [],
      [DealStage.QUALIFICATION]: [],
      [DealStage.PROPOSAL]: [],
      [DealStage.NEGOTIATION]: [],
      [DealStage.CLOSED_WON]: [],
      [DealStage.CLOSED_LOST]: [],
    };

    deals.forEach((deal) => {
      if (grouped[deal.stage]) {
        grouped[deal.stage].push(deal);
      }
    });

    // Sort each column by displayOrder or createdAt
    Object.keys(grouped).forEach((stage) => {
      grouped[stage as DealStage].sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return grouped;
  }, [deals]);

  const calculateColumnValue = (stage: DealStage) => {
    return dealsByStage[stage].reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  const activeDeal = useMemo(
    () => deals.find((deal) => deal.id === activeId),
    [activeId, deals]
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

    const activeDeal = deals.find((d) => d.id === activeId);
    if (!activeDeal) return;

    // Check if dropping on a column droppable area
    if (overId.startsWith('column-')) {
      const newStage = overId.replace('column-', '') as DealStage;
      if (activeDeal.stage !== newStage) {
        onStageChange(activeId, newStage);
      }
      return;
    }

    // Check if dropping on another deal
    const overDeal = deals.find((d) => d.id === overId);
    if (!overDeal) return;

    // If different stage, change stage
    if (activeDeal.stage !== overDeal.stage) {
      onStageChange(activeId, overDeal.stage);
    }
    // If same stage and reorder is enabled, reorder
    else if (onReorder) {
      const columnDeals = dealsByStage[activeDeal.stage];
      const oldIndex = columnDeals.findIndex((d) => d.id === activeId);
      const newIndex = columnDeals.findIndex((d) => d.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        onReorder(activeId, newIndex, activeDeal.stage);
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
      <div className="relative overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-1">
        {stageColumns.map((column) => {
          const columnDeals = dealsByStage[column.stage];
          const columnValue = calculateColumnValue(column.stage);

          return (
            <Card key={column.stage} className="flex flex-col overflow-hidden w-[340px] shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
              >
              {/* Column Header */}
              <div className={`p-4 border-b ${stageConfig[column.stage].color} border-b-2`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground">{column.label}</h3>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {columnDeals.length}
                    </Badge>
                  </div>
                  {columnValue > 0 && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'OMR',
                        minimumFractionDigits: 0,
                      }).format(columnValue)}
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Cards Container */}
              <SortableContext
                id={`column-${column.stage}`}
                items={columnDeals.map((deal) => deal.id)}
                strategy={verticalListSortingStrategy}
              >
                <ColumnDroppable id={`column-${column.stage}`} stage={column.stage}>
                  {columnDeals.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      <p>{t('crm.noDealsInColumn')}</p>
                    </div>
                  ) : (
                    columnDeals.map((deal) => (
                      <SortableDealCard
                        key={deal.id}
                        deal={deal}
                        onClick={() => onDealClick(deal)}
                        isActive={activeId === deal.id}
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
      </div>
      
      {/* Drag Overlay for visual feedback */}
      <DragOverlay>
        {activeId ? (
          <div className="opacity-50 rotate-3 cursor-grabbing">
            <DealCard
              deal={deals.find((d) => d.id === activeId)!}
              onClick={() => {}}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface DealCardProps {
  deal: Deal;
  onClick: () => void;
  isDragging?: boolean;
}

function ColumnDroppable({ id, stage, children }: { id: string; stage: DealStage; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      stage,
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

export function DealCard({ deal, onClick, isDragging = false }: DealCardProps) {
  const { t } = useI18n();
  
  const stageColors = {
    PROSPECTING: 'bg-slate-500',
    QUALIFICATION: 'bg-blue-500',
    PROPOSAL: 'bg-yellow-500',
    NEGOTIATION: 'bg-orange-500',
    CLOSED_WON: 'bg-green-500',
    CLOSED_LOST: 'bg-red-500',
  };

  const isOverdue = deal.policyEndDate && new Date(deal.policyEndDate) < new Date();

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
        className={`cursor-pointer transition-all ${isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'}`}
      >
        <div className="p-3 space-y-3">
          {/* Title with stage dot */}
          <div className="flex items-start gap-2">
            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${stageColors[deal.stage]}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-2">{deal.name}</h4>
              {deal.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{deal.description}</p>
              )}
            </div>
          </div>

          {/* Value */}
          {deal.value && deal.value > 0 && (
            <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
              <DollarSign className="h-4 w-4" />
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'OMR',
                minimumFractionDigits: 0,
              }).format(deal.value)}
            </div>
          )}

          {/* Premium */}
          {deal.premium && deal.premium > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {t('crm.premium')}: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'OMR',
                minimumFractionDigits: 0,
              }).format(deal.premium)}
            </div>
          )}

          {/* Insurance Type */}
          {deal.insuranceType && (
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="outline" className="text-xs">
                {deal.insuranceType}
              </Badge>
            </div>
          )}

          {/* Policy End Date */}
          {deal.policyEndDate && (
            <div className={`flex items-center gap-1 text-xs p-2 rounded ${
              isOverdue ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(deal.policyEndDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Assigned To */}
          {deal.assignedTo && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{t('crm.assigned')}</span>
            </div>
          )}

          {/* Policy Number if available */}
          {deal.policyNumber && (
            <div className="flex items-start gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{deal.policyNumber}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
