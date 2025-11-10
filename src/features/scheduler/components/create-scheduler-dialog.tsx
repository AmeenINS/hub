'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Clock, Bell, Repeat, Lock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

import { 
  ScheduledEvent, 
  SchedulerType, 
  NotificationMethod,
  RecurrenceType 
} from '@/shared/types/database';
import { toast } from 'sonner';

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(SchedulerType),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().min(1, 'Time is required'),
  timezone: z.string(),
  notificationMethods: z.array(z.nativeEnum(NotificationMethod)).min(1, 'At least one notification method is required'),
  notifyBefore: z.number().min(0).optional(),
  isRecurring: z.boolean(),
  recurrenceType: z.nativeEnum(RecurrenceType).optional(),
  recurrenceInterval: z.number().min(1).optional(),
  recurrenceEnd: z.string().optional(),
  assignedTo: z.string().optional(),
  isPrivate: z.boolean(),
  canBeEditedByAssigned: z.boolean(),
});

type FormData = z.infer<typeof eventFormSchema>;

interface CreateSchedulerDialogProps {
  onEventCreated: (event: ScheduledEvent) => void;
  onClose: () => void;
  initialData?: Partial<ScheduledEvent>;
}

export default function CreateSchedulerDialog({ 
  onEventCreated, 
  onClose,
  initialData 
}: CreateSchedulerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(initialData?.isRecurring || false);

  const form = useForm<FormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      type: initialData?.type || SchedulerType.REMINDER,
      scheduledDate: initialData?.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: initialData?.scheduledTime || '09:00',
      timezone: initialData?.timezone || 'Asia/Tehran',
      notificationMethods: initialData?.notificationMethods || [NotificationMethod.IN_APP],
      notifyBefore: initialData?.notifyBefore || 15,
      isRecurring: initialData?.isRecurring || false,
      recurrenceType: initialData?.recurrenceType,
      recurrenceInterval: initialData?.recurrenceInterval || 1,
      recurrenceEnd: initialData?.recurrenceEnd || '',
      assignedTo: initialData?.assignedTo || '',
      isPrivate: initialData?.isPrivate || false,
      canBeEditedByAssigned: initialData?.canBeEditedByAssigned ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        onEventCreated(result.data);
        form.reset();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error creating event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: SchedulerType) => {
    switch (type) {
      case SchedulerType.REMINDER:
        return 'Reminder';
      case SchedulerType.MEETING:
        return 'Meeting';
      case SchedulerType.TASK_DEADLINE:
        return 'Task Deadline';
      case SchedulerType.FOLLOW_UP:
        return 'Follow Up';
      case SchedulerType.RECURRING:
        return 'Recurring';
      case SchedulerType.CUSTOM:
        return 'Custom';
      default:
        return type;
    }
  };

  const getRecurrenceLabel = (type: RecurrenceType) => {
    switch (type) {
      case RecurrenceType.DAILY:
        return 'Daily';
      case RecurrenceType.WEEKLY:
        return 'Weekly';
      case RecurrenceType.MONTHLY:
        return 'Monthly';
      case RecurrenceType.YEARLY:
        return 'Yearly';
      default:
        return type;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SchedulerType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Asia/Tehran">Tehran (UTC+3:30)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                      <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notificationMethods"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Methods *</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(NotificationMethod).map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <Checkbox
                          id={method}
                          checked={field.value?.includes(method)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, method]);
                            } else {
                              field.onChange(current.filter(m => m !== method));
                            }
                          }}
                        />
                        <Label htmlFor={method} className="text-sm">
                          {method === NotificationMethod.IN_APP && 'In-App Notification'}
                          {method === NotificationMethod.PUSH && 'Push Notification'}
                          {method === NotificationMethod.EMAIL && 'Email'}
                          {method === NotificationMethod.SMS && 'SMS'}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifyBefore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notify Before Event (minutes)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">At the same time</SelectItem>
                      <SelectItem value="5">5 minutes before</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="120">2 hours before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Recurrence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Recurrence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setShowRecurrence(!!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring Event</FormLabel>
                    <FormDescription>
                      This event will repeat periodically
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {showRecurrence && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(RecurrenceType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {getRecurrenceLabel(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrenceInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Interval</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          How often to repeat
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="recurrenceEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence End</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Date when recurrence should stop (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Private Event</FormLabel>
                    <FormDescription>
                      Only you and the assigned person can see this event
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canBeEditedByAssigned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow editing by assigned person</FormLabel>
                    <FormDescription>
                      The assigned person can edit this event
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Form>
  );
}