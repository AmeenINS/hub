'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/shared/types/database';
import { LeadCard } from './leads-kanban';

interface SortableLeadCardProps {
  lead: Lead;
  onClick: () => void;
  isActive?: boolean;
}

export function SortableLeadCard({ lead, onClick, isActive }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
    >
      <LeadCard
        lead={lead}
        onClick={onClick}
        isDragging={isDragging || isActive}
      />
    </div>
  );
}
