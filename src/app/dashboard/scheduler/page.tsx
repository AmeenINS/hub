'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Clock, Bell, Search, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { ScheduledEvent, SchedulerType, SchedulerStatus } from '@/types/database';
// import CreateSchedulerDialog from '@/components/scheduler/create-scheduler-dialog';
// import SchedulerEventCard from '@/components/scheduler/scheduler-event-card';  
import SchedulerCalendarView from '@/components/scheduler/scheduler-calendar-view';

export default function SchedulerPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<SchedulerStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<SchedulerType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  useEffect(() => {
    // Define functions inline to avoid dependency issues
    const fetchEvents = async () => {
      try {
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const response = await fetch('/api/scheduler', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setEvents(result.data.events || []);
          } else {
            throw new Error(result.error || 'Failed to fetch events');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error(`Error loading events: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    const processNotifications = async () => {
      try {
        if (!token) return;

        const response = await fetch('/api/scheduler/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data.processed > 0) {
            console.log(`Processed ${result.data.processed} scheduler notifications`);
          }
        }
      } catch (error) {
        console.error('Error processing notifications:', error);
      }
    };

    fetchEvents();
    // Process notifications on page load
    processNotifications();
    
    // Set up periodic notification checking
    const interval = setInterval(processNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [token]);

  // Delete event handler
  const handleDeleteEvent = async (eventId: string) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) {
      toast.error('Event not found');
      return;
    }

    // Check if user is the owner
    if (eventToDelete.createdBy !== user.id) {
      toast.error('You can only delete events you created');
      return;
    }

    try {
      setDeletingEventId(eventId);
      const response = await fetch(`/api/scheduler/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setSelectedEvent(null);
        toast.success('Event deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error deleting event');
    } finally {
      setDeletingEventId(null);
    }
  };

  // Edit event handler
  const handleEditEvent = (event: ScheduledEvent) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    // Check if user is the owner or assigned user
    if (event.createdBy !== user.id && event.assignedTo !== user.id) {
      toast.error('You can only edit events you created or are assigned to');
      return;
    }

    // Check if assigned user has edit permission
    if (event.assignedTo === user.id && event.createdBy !== user.id && !event.canBeEditedByAssigned) {
      toast.error('You do not have permission to edit this event');
      return;
    }

    // Navigate to edit page
    router.push(`/dashboard/scheduler/${event.id}/edit`);
  };

  // Event handlers will be implemented when components are available

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesType = filterType === 'all' || event.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const upcomingEvents = filteredEvents.filter(event => {
    const eventDateTime = new Date(`${event.scheduledDate}T${event.scheduledTime}`);
    return eventDateTime > new Date() && event.status === SchedulerStatus.ACTIVE;
  }).slice(0, 3);

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
        return '📋';
      case SchedulerType.FOLLOW_UP:
        return '📞';
      case SchedulerType.RECURRING:
        return '🔄';
      case SchedulerType.CUSTOM:
        return '📝';
      default:
        return '📅';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scheduler & Reminders</h1>
          <p className="text-muted-foreground">Manage your events and personal reminders</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          
          <Button onClick={() => router.push('/dashboard/scheduler/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Events</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.scheduledDate === new Date().toISOString().split('T')[0]).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.status === SchedulerStatus.ACTIVE).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => {
                    const eventDate = new Date(e.scheduledDate);
                    const now = new Date();
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return eventDate >= weekStart && eventDate <= weekEnd;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Recurring</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.isRecurring).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as SchedulerStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={SchedulerStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={SchedulerStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={SchedulerStatus.CANCELLED}>Cancelled</SelectItem>
                <SelectItem value={SchedulerStatus.SNOOZED}>Snoozed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={(value) => setFilterType(value as SchedulerType | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={SchedulerType.REMINDER}>Reminder</SelectItem>
                <SelectItem value={SchedulerType.MEETING}>Meeting</SelectItem>
                <SelectItem value={SchedulerType.TASK_DEADLINE}>Deadline</SelectItem>
                <SelectItem value={SchedulerType.FOLLOW_UP}>Follow Up</SelectItem>
                <SelectItem value={SchedulerType.RECURRING}>Recurring</SelectItem>
                <SelectItem value={SchedulerType.CUSTOM}>Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getTypeIcon(event.type)}</span>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(`${event.scheduledDate}T${event.scheduledTime}`).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new event or change your filters
                </p>
                <Button onClick={() => router.push('/dashboard/scheduler/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first event
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedEvent(event)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                      <p className="text-sm">
                        {new Date(`${event.scheduledDate}T${event.scheduledTime}`).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      {(event.createdBy === user?.id || event.assignedTo === user?.id) && (
                        <div className="flex gap-1">
                          {(event.createdBy === user?.id || (event.assignedTo === user?.id && event.canBeEditedByAssigned)) && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {event.createdBy === user?.id && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={deletingEventId === event.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <SchedulerCalendarView
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event);
          }}
          onEventUpdate={(event) => {
            // Handle event update
            setEvents(prev => prev.map(e => e.id === event.id ? event : e));
          }}
        />
      )}

      {/* Event Detail Modal */}
      <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {new Date(`${selectedEvent?.scheduledDate}T${selectedEvent?.scheduledTime}`).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedEvent.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={`${getStatusColor(selectedEvent.status)} mt-1`}>
                    {selectedEvent.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEvent.type}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notification</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedEvent.notifyBefore} minutes before
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                {(selectedEvent.createdBy === user?.id || selectedEvent.assignedTo === user?.id) && (
                  <>
                    {(selectedEvent.createdBy === user?.id || (selectedEvent.assignedTo === user?.id && selectedEvent.canBeEditedByAssigned)) && (
                      <Button
                        onClick={() => {
                          setSelectedEvent(null);
                          handleEditEvent(selectedEvent);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    
                    {selectedEvent.createdBy === user?.id && (
                      <Button
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        variant="destructive"
                        size="sm"
                        disabled={deletingEventId === selectedEvent.id}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}