'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Lead } from '@/shared/types/database';
import { useI18n } from '@/shared/i18n/i18n-context';
import {
  Calendar,
  DollarSign,
  Shield,
  User,
  Grip,
} from 'lucide-react';

interface KanbanCardProps {
  lead: Lead;
  onClick: () => void;
}

const PRIORITY_CONFIG = {
  LOW: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'low' },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'medium' },
  HIGH: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'high' },
  URGENT: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'urgent' },
};

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const priorityConfig = lead.priority ? PRIORITY_CONFIG[lead.priority] : PRIORITY_CONFIG.MEDIUM;

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={`group relative ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
          lead.priority === 'URGENT'
            ? 'border-l-red-500'
            : lead.priority === 'HIGH'
            ? 'border-l-orange-500'
            : lead.priority === 'MEDIUM'
            ? 'border-l-yellow-500'
            : 'border-l-blue-500'
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <Grip className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Header - Title & Priority */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2 pr-6">
              <h4 className="font-semibold text-sm line-clamp-1">
                {lead.title}
              </h4>
              <Badge className={`text-xs ${priorityConfig.color}`}>
                {t(`crm.${priorityConfig.label}`)}
              </Badge>
            </div>
            {lead.source && (
              <p className="text-xs text-muted-foreground">{lead.source}</p>
            )}
          </div>

          {/* Description */}
          {lead.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {lead.description}
            </div>
          )}

          {/* Insurance Type */}
          {lead.insuranceType && (
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              {lead.insuranceType}
            </Badge>
          )}

          {/* Value & Date */}
          <div className="flex items-center justify-between text-xs">
            {lead.currentPremium && lead.currentPremium > 0 ? (
              <div className="flex items-center gap-1 font-semibold text-green-600">
                <DollarSign className="h-3 w-3" />
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'OMR',
                  minimumFractionDigits: 0,
                }).format(lead.currentPremium)}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}

            {lead.expectedCloseDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(lead.expectedCloseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>

          {/* Assigned To */}
          {lead.assignedTo && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {t('crm.assigned')}
              </span>
            </div>
          )}

          {/* Next Follow-up */}
          {lead.nextFollowUpDate && (
            <div
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                new Date(lead.nextFollowUpDate) < new Date()
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span className="font-medium">
                {t('crm.followUp')}:{' '}
                {new Date(lead.nextFollowUpDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
