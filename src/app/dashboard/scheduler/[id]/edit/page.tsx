'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { ScheduledEvent } from '@/types/database';

interface EditEventFormData {
  title: string;
  description: string;
  type: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  notificationMethods: string[];
  notifyBefore: number;
  isRecurring: boolean;
  recurrenceType?: string;
  recurrenceInterval?: number;
  recurrenceEnd?: string;
  assignedTo: string;
  isPrivate: boolean;
  canBeEditedByAssigned: boolean;
}

const schedulerTypes = [
  { value: 'REMINDER', label: 'Task Reminder' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'TASK_DEADLINE', label: 'Task Deadline' },
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'RECURRING', label: 'Recurring' },
];

const notificationMethods = [
  { value: 'IN_APP', label: 'In-App Notification' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'PUSH', label: 'Push Notification' },
];

const recurrenceTypes = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const notifyBeforeOptions = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function EditSchedulerPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [subordinates, setSubordinates] = useState<Array<{ id: string; name: string }>>([]);
  const eventId = params.id as string;

  const [formData, setFormData] = useState<EditEventFormData>({
    title: '',
    description: '',
    type: '',
    scheduledDate: '',
    scheduledTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notificationMethods: ['IN_APP'],
    notifyBefore: 15,
    isRecurring: false,
    assignedTo: user?.id || '',
    isPrivate: false,
    canBeEditedByAssigned: true,
  });

  // Fetch subordinates
  useEffect(() => {
    const fetchSubordinates = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/users/me/subordinates', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSubordinates(result.data || []);
          } else {
            setSubordinates([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch subordinates:', error);
      }
    };

    fetchSubordinates();
  }, [token]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!token) {
        toast.error('Please login to edit events');
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/scheduler/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const event = data.data as ScheduledEvent;

          // Check if user is the owner or can edit
          if (event.createdBy !== user?.id && !(event.assignedTo === user?.id && event.canBeEditedByAssigned)) {
            toast.error('You do not have permission to edit this event');
            router.push('/dashboard/scheduler');
            return;
          }

          setFormData({
            title: event.title,
            description: event.description || '',
            type: event.type,
            scheduledDate: event.scheduledDate,
            scheduledTime: event.scheduledTime,
            timezone: event.timezone,
            notificationMethods: event.notificationMethods,
            notifyBefore: event.notifyBefore || 15,
            isRecurring: event.isRecurring,
            recurrenceType: event.recurrenceType,
            recurrenceInterval: event.recurrenceInterval,
            recurrenceEnd: event.recurrenceEnd,
            assignedTo: event.assignedTo || user?.id || '',
            isPrivate: event.isPrivate,
            canBeEditedByAssigned: event.canBeEditedByAssigned,
          });

          setSelectedDate(new Date(event.scheduledDate));
        } else {
          toast.error('Failed to fetch event');
          router.push('/dashboard/scheduler');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Error fetching event');
        router.push('/dashboard/scheduler');
      } finally {
        setIsFetching(false);
      }
    };

    fetchEvent();
  }, [token, eventId, user, router]);

  const handleInputChange = (field: keyof EditEventFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificationMethods: checked
        ? [...prev.notificationMethods, method]
        : prev.notificationMethods.filter(m => m !== method)
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({
        ...prev,
        scheduledDate: format(date, 'yyyy-MM-dd')
      }));
      setShowCalendar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    if (!token) {
      toast.error('Please login to update events');
      return;
    }

    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.notificationMethods.length === 0) {
      toast.error('Please select at least one notification method');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/scheduler/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Event updated successfully');
        router.push('/dashboard/scheduler');
      } else {
        toast.error(result.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Event</h1>
          <p className="text-muted-foreground">Update your scheduled event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Update basic information about the event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedulerTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Event description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Tehran">Asia/Tehran</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              How and when you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Notification Methods *</Label>
              {notificationMethods.map(method => (
                <div key={method.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={method.value}
                    checked={formData.notificationMethods.includes(method.value)}
                    onCheckedChange={(checked) => handleNotificationMethodChange(method.value, checked as boolean)}
                  />
                  <Label htmlFor={method.value} className="font-normal cursor-pointer">
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notifyBefore">Notify Before *</Label>
              <Select value={formData.notifyBefore.toString()} onValueChange={(value) => handleInputChange('notifyBefore', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification time" />
                </SelectTrigger>
                <SelectContent>
                  {notifyBeforeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurrence Settings</CardTitle>
            <CardDescription>
              Set up recurring events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => handleInputChange('isRecurring', checked as boolean)}
              />
              <Label htmlFor="isRecurring" className="font-normal cursor-pointer">
                This is a recurring event
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceType">Recurrence Type</Label>
                    <Select value={formData.recurrenceType || ''} onValueChange={(value) => handleInputChange('recurrenceType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence type" />
                      </SelectTrigger>
                      <SelectContent>
                        {recurrenceTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrenceInterval">Every N Days/Weeks/Months</Label>
                    <Input
                      id="recurrenceInterval"
                      type="number"
                      min="1"
                      value={formData.recurrenceInterval || 1}
                      onChange={(e) => handleInputChange('recurrenceInterval', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEnd">Recurrence End Date</Label>
                  <Input
                    id="recurrenceEnd"
                    type="date"
                    value={formData.recurrenceEnd || ''}
                    onChange={(e) => handleInputChange('recurrenceEnd', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign To</CardTitle>
            <CardDescription>
              Assign this event to yourself or a subordinate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Person *</Label>
              <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id || ''}>
                    {user?.firstName} {user?.lastName} (You)
                  </SelectItem>
                  {subordinates.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Control who can access and edit this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => handleInputChange('isPrivate', checked as boolean)}
              />
              <Label htmlFor="isPrivate" className="font-normal cursor-pointer">
                Private event (only visible to you and assigned users)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canBeEditedByAssigned"
                checked={formData.canBeEditedByAssigned}
                onCheckedChange={(checked) => handleInputChange('canBeEditedByAssigned', checked as boolean)}
              />
              <Label htmlFor="canBeEditedByAssigned" className="font-normal cursor-pointer">
                Allow assigned user to edit this event
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Event'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
