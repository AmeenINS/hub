'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Lead, LeadStatus } from '@/shared/types/database';
import { Calendar, Mail, Phone, TrendingUp, MoreVertical } from 'lucide-react';

interface LeadKanbanCardProps {
  lead: Lead;
  onClick?: () => void;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

export function LeadKanbanCard({ lead, onClick, onStatusChange }: LeadKanbanCardProps) {
  const { t, locale } = useI18n();

  const formatCurrency = (value: number) => {
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    return locale === 'ar' ? `${formatted} ر.ع` : `${formatted} OMR`;
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short'
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const allStatuses: LeadStatus[] = [
    LeadStatus.NEW,
    LeadStatus.QUALIFIED,
    LeadStatus.PROPOSAL,
    LeadStatus.NEGOTIATION,
    LeadStatus.CLOSED_WON,
    LeadStatus.CLOSED_LOST
  ];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0" onClick={onClick}>
            <CardTitle className="text-sm font-semibold line-clamp-1">
              {lead.title}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-1 mt-1">
              {lead.source || '-'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {lead.priority && (
              <Badge variant={getPriorityColor(lead.priority)} className="text-xs shrink-0">
                {t(`crm.priority${lead.priority.charAt(0) + lead.priority.slice(1).toLowerCase()}`)}
              </Badge>
            )}
            {onStatusChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('crm.changeStatus')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(lead.id, status);
                      }}
                    >
                      {t(`crm.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0" onClick={onClick}>
        {/* Insurance Type */}
        {lead.insuranceType && (
          <Badge variant="outline" className="text-xs">
            {t(`crm.insurance${lead.insuranceType.charAt(0) + lead.insuranceType.slice(1).toLowerCase()}`)}
          </Badge>
        )}

        {/* Estimated Value */}
        {lead.currentPremium && (
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <TrendingUp className="h-4 w-4" />
            <span>{formatCurrency(lead.currentPremium)}</span>
          </div>
        )}

        {/* Next Follow-up */}
        {lead.nextFollowUpDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatDate(lead.nextFollowUpDate)}</span>
          </div>
        )}

        {/* Assigned To */}
        {lead.assignedTo && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(lead.assignedTo)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {lead.assignedTo}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
