'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Bell, Users, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  ScheduledEvent, 
  SchedulerType, 
  SchedulerStatus,
  NotificationMethod,
  User
} from '@/types/database';

interface SchedulerEventDetailDialogProps {
  event: ScheduledEvent | null;
  open: boolean;
  onClose: () => void;
  onEventUpdated: (event: ScheduledEvent) => void;
  onEventDeleted: (eventId: string) => void;
}

export function SchedulerEventDetailDialog({
  event,
  open,
  onClose,
  onEventUpdated,
  onEventDeleted,
}: SchedulerEventDetailDialogProps) {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);

  // Fetch assigned user info if event is assigned to someone
  React.useEffect(() => {
    const fetchAssignedUser = async () => {
      if (event?.assignedTo && event.assignedTo !== event.createdBy && token) {
        try {
          const response = await fetch(`/api/users/${event.assignedTo}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setAssignedUser(result.data.user);
            }
          }
        } catch (error) {
          console.error('Error fetching assigned user:', error);
        }
      } else {
        setAssignedUser(null);
      }
    };

    if (open && event) {
      fetchAssignedUser();
    }
  }, [event, token, open]);

  if (!event) return null;

  const canEdit = user && (
    event.createdBy === user.id || 
    (event.assignedTo === user.id && event.canBeEditedByAssigned)
  );

  const canDelete = user && event.createdBy === user.id;

  const handleEdit = () => {
    if (!canEdit) {
      toast.error('You do not have permission to edit this event');
      return;
    }
    router.push(`/dashboard/scheduler/${event.id}/edit`);
    onClose();
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You can only delete events you created');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/scheduler/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Event deleted successfully');
        onEventDeleted(event.id);
        setShowDeleteDialog(false);
        onClose();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: SchedulerStatus) => {
    switch (status) {
      case SchedulerStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case SchedulerStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case SchedulerStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case SchedulerStatus.SNOOZED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: SchedulerType) => {
    switch (type) {
      case SchedulerType.REMINDER:
        return '⏰';
      case SchedulerType.MEETING:
        return '👥';
      case SchedulerType.TASK_DEADLINE:
        return '🎯';
      case SchedulerType.FOLLOW_UP:
        return '�';
      case SchedulerType.CUSTOM:
        return '📅';
      case SchedulerType.RECURRING:
        return '🔄';
      default:
        return '📝';
    }
  };

  const formatNotificationMethods = (methods: NotificationMethod[]) => {
    const methodLabels = {
      [NotificationMethod.IN_APP]: 'In-App',
      [NotificationMethod.EMAIL]: 'Email',
      [NotificationMethod.SMS]: 'SMS',
      [NotificationMethod.PUSH]: 'Push',
    };

    return methods.map(method => methodLabels[method]).join(', ');
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(event.type)}</span>
                <div>
                  <DialogTitle className="text-xl">{event.title}</DialogTitle>
                  <DialogDescription>
                    Event Details and Information
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Type */}
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
              <Badge variant="outline">
                {event.type}
              </Badge>
              {event.isPrivate && (
                <Badge variant="secondary">
                  Private
                </Badge>
              )}
              {event.isRecurring && (
                <Badge variant="secondary">
                  Recurring
                </Badge>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Scheduled</span>
                </div>
                <p className="text-muted-foreground">
                  {formatDateTime(event.scheduledDate, event.scheduledTime)}
                </p>
              </div>

              {event.timezone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Timezone</span>
                  </div>
                  <p className="text-muted-foreground">
                    {event.timezone}
                  </p>
                </div>
              )}
            </div>

            {/* Assignment */}
            {assignedUser && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Assigned To</span>
                </div>
                <p className="text-muted-foreground">
                  {assignedUser.firstName} {assignedUser.lastName} ({assignedUser.email})
                </p>
                {event.canBeEditedByAssigned && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Can be edited by assignee
                  </p>
                )}
              </div>
            )}

            {/* Notifications */}
            {event.notificationMethods && event.notificationMethods.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Notifications</span>
                </div>
                <p className="text-muted-foreground">
                  {formatNotificationMethods(event.notificationMethods)}
                  {event.notifyBefore && (
                    <span> • {event.notifyBefore} minutes before</span>
                  )}
                </p>
              </div>
            )}

            {/* Recurrence */}
            {event.isRecurring && event.recurrenceType && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Recurrence</span>
                </div>
                <p className="text-muted-foreground">
                  Repeats {event.recurrenceType.toLowerCase()} 
                  {event.recurrenceInterval && event.recurrenceInterval > 1 && (
                    <span> every {event.recurrenceInterval} {event.recurrenceType.toLowerCase()}s</span>
                  )}
                  {event.recurrenceEnd && (
                    <span> until {new Date(event.recurrenceEnd).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
              <p>Created: {new Date(event.createdAt).toLocaleString()}</p>
              {event.updatedAt !== event.createdAt && (
                <p>Last updated: {new Date(event.updatedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{event.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}