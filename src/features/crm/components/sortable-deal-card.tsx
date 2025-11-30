'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Deal } from '@/shared/types/database';
import { DealCard } from './deals-kanban';

interface SortableDealCardProps {
  deal: Deal;
  onClick: () => void;
  isActive?: boolean;
}

export function SortableDealCard({ deal, onClick, isActive }: SortableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    // eslint-disable-next-line react/forbid-dom-props
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <DealCard
        deal={deal}
        onClick={onClick}
        isDragging={isDragging || isActive}
      />
    </div>
  );
}
