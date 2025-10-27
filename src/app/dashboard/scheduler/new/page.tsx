'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface CreateEventFormData {
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

export default function NewSchedulerPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showCalendar, setShowCalendar] = useState(false);
  const [subordinates, setSubordinates] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState<CreateEventFormData>({
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
  React.useEffect(() => {
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

  const handleInputChange = (field: keyof CreateEventFormData, value: string | number | boolean | string[]) => {
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
      return; // Prevent double submission
    }
    
    if (!token) {
      toast.error('Please login to create events');
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
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Event created successfully');
        router.push('/dashboard/scheduler');
      } else {
        toast.error(result.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">Create New Event</h1>
          <p className="text-muted-foreground">Schedule a new event or reminder</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Basic information about the event
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
                    {schedulerTypes.map((type) => (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              When should this event occur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              How and when to notify about this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Notification Methods *</Label>
              <div className="grid grid-cols-2 gap-2">
                {notificationMethods.map((method) => (
                  <div key={method.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={method.value}
                      checked={formData.notificationMethods.includes(method.value)}
                      onCheckedChange={(checked) => 
                        handleNotificationMethodChange(method.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={method.value} className="text-sm">
                      {method.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notifyBefore">Notify Before</Label>
              <Select 
                value={formData.notifyBefore.toString()} 
                onValueChange={(value) => handleInputChange('notifyBefore', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notifyBeforeOptions.map((option) => (
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
            <CardTitle>Recurrence</CardTitle>
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
              <Label htmlFor="isRecurring">Recurring Event</Label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceType">Recurrence Type</Label>
                  <Select 
                    value={formData.recurrenceType} 
                    onValueChange={(value) => handleInputChange('recurrenceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      {recurrenceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrenceInterval">Interval</Label>
                  <Input
                    id="recurrenceInterval"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.recurrenceInterval || ''}
                    onChange={(e) => handleInputChange('recurrenceInterval', parseInt(e.target.value) || 1)}
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
            <CardTitle>Privacy & Permissions</CardTitle>
            <CardDescription>
              Control who can see and edit this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => handleInputChange('isPrivate', checked as boolean)}
              />
              <Label htmlFor="isPrivate">Private Event</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canBeEditedByAssigned"
                checked={formData.canBeEditedByAssigned}
                onCheckedChange={(checked) => handleInputChange('canBeEditedByAssigned', checked as boolean)}
              />
              <Label htmlFor="canBeEditedByAssigned">Allow assigned user to edit</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
