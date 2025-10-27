'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Bell, 
  Edit, 
  Trash2, 
  User, 
  Eye,
  EyeOff,
  Repeat,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  ScheduledEvent, 
  SchedulerType, 
  SchedulerStatus, 
  NotificationMethod 
} from '@/types/database';
import { toast } from 'sonner';

interface SchedulerEventCardProps {
  event: ScheduledEvent;
  onUpdate: (event: ScheduledEvent) => void;
  onDelete: (eventId: string) => void;
}

export default function SchedulerEventCard({ event, onUpdate, onDelete }: SchedulerEventCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: SchedulerStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/scheduler/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...event,
          status: newStatus,
          completedAt: newStatus === SchedulerStatus.COMPLETED ? new Date().toISOString() : undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate(result.data);
        toast.success('Event status updated successfully');
      } else {
        throw new Error('Error updating status');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/scheduler/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onDelete(event.id);
      } else {
        throw new Error('Error deleting event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error deleting event');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SchedulerStatus) => {
    switch (status) {
      case SchedulerStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case SchedulerStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case SchedulerStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case SchedulerStatus.SNOOZED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: SchedulerType) => {
    switch (type) {
      case SchedulerType.REMINDER:
        return <Bell className="h-4 w-4" />;
      case SchedulerType.MEETING:
        return <User className="h-4 w-4" />;
      case SchedulerType.TASK_DEADLINE:
        return <Clock className="h-4 w-4" />;
      case SchedulerType.FOLLOW_UP:
        return <Zap className="h-4 w-4" />;
      case SchedulerType.RECURRING:
        return <Repeat className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SchedulerType) => {
    switch (type) {
      case SchedulerType.REMINDER:
        return 'Reminder';
      case SchedulerType.MEETING:
        return 'Meeting';
      case SchedulerType.TASK_DEADLINE:
        return 'Deadline';
      case SchedulerType.FOLLOW_UP:
        return 'Follow-up';
      case SchedulerType.RECURRING:
        return 'Recurring';
      case SchedulerType.CUSTOM:
        return 'Custom';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: SchedulerStatus) => {
    switch (status) {
      case SchedulerStatus.ACTIVE:
        return 'Active';
      case SchedulerStatus.COMPLETED:
        return 'Completed';
      case SchedulerStatus.CANCELLED:
        return 'Cancelled';
      case SchedulerStatus.SNOOZED:
        return 'Snoozed';
      default:
        return status;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    return {
      date: eventDate.toLocaleDateString('fa-IR'),
      time: eventDate.toLocaleTimeString('fa-IR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isPast: eventDate < new Date(),
      isToday: eventDate.toDateString() === new Date().toDateString(),
    };
  };

  const { date, time, isPast, isToday } = formatDateTime(event.scheduledDate, event.scheduledTime);

  return (
    <Card className={`transition-all hover:shadow-md ${isPast && event.status === SchedulerStatus.ACTIVE ? 'border-orange-200 bg-orange-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getTypeIcon(event.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{event.title}</h3>
                {event.isPrivate && (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                {event.isRecurring && (
                  <Repeat className="h-4 w-4 text-blue-500" />
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {getTypeLabel(event.type)}
                </Badge>
                <Badge className={getStatusColor(event.status)}>
                  {getStatusLabel(event.status)}
                </Badge>
                {isToday && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Today
                  </Badge>
                )}
                {isPast && event.status === SchedulerStatus.ACTIVE && (
                  <Badge variant="destructive" className="text-xs">
                    Past
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={loading}>
                <Edit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {event.status === SchedulerStatus.ACTIVE && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(SchedulerStatus.COMPLETED)}>
                  Mark as Completed
                </DropdownMenuItem>
              )}
              {event.status === SchedulerStatus.ACTIVE && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(SchedulerStatus.SNOOZED)}>
                  Snooze
                </DropdownMenuItem>
              )}
              {event.status !== SchedulerStatus.CANCELLED && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(SchedulerStatus.CANCELLED)}>
                  Cancel
                </DropdownMenuItem>
              )}
              {event.status !== SchedulerStatus.ACTIVE && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(SchedulerStatus.ACTIVE)}>
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <span className="flex items-center gap-2 w-full">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Event</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this event? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{date}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{time}</span>
          </div>

          {event.notifyBefore && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span>{event.notifyBefore} minutes before</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{event.isPrivate ? 'Private' : 'Public'}</span>
          </div>
        </div>

        {event.notificationMethods && event.notificationMethods.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Notification Methods:</p>
            <div className="flex flex-wrap gap-1">
              {event.notificationMethods.map((method) => (
                <Badge key={method} variant="secondary" className="text-xs">
                  {method === NotificationMethod.IN_APP && 'App'}
                  {method === NotificationMethod.PUSH && 'Push'}
                  {method === NotificationMethod.EMAIL && 'Email'}
                  {method === NotificationMethod.SMS && 'SMS'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {event.isRecurring && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat className="h-4 w-4" />
              <span>
                Every {event.recurrenceInterval || 1} {' '}
                {event.recurrenceType === 'DAILY' && 'day(s)'}
                {event.recurrenceType === 'WEEKLY' && 'week(s)'}
                {event.recurrenceType === 'MONTHLY' && 'month(s)'}
                {event.recurrenceType === 'YEARLY' && 'year(s)'}
                {event.recurrenceEnd && ` until ${new Date(event.recurrenceEnd).toLocaleDateString('en-US')}`}
              </span>
            </div>
          </div>
        )}

        {event.lastNotifiedAt && (
          <div className="mt-2 text-xs text-muted-foreground">
            Last notification: {new Date(event.lastNotifiedAt).toLocaleString('en-US')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}