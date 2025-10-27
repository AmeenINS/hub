'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  ScheduledEvent, 
  SchedulerType, 
  SchedulerStatus 
} from '@/types/database';

interface SchedulerCalendarViewProps {
  events: ScheduledEvent[];
  onEventClick: (event: ScheduledEvent) => void;
  onEventUpdate: (event: ScheduledEvent) => void;
}

export default function SchedulerCalendarView({ 
  events, 
  onEventClick 
}: SchedulerCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.scheduledDate === dateString);
  };

  const getEventColor = (type: SchedulerType, status: SchedulerStatus) => {
    if (status === SchedulerStatus.COMPLETED) return 'bg-green-500';
    if (status === SchedulerStatus.CANCELLED) return 'bg-red-500';
    if (status === SchedulerStatus.SNOOZED) return 'bg-yellow-500';
    
    switch (type) {
      case SchedulerType.REMINDER:
        return 'bg-blue-500';
      case SchedulerType.MEETING:
        return 'bg-purple-500';
      case SchedulerType.TASK_DEADLINE:
        return 'bg-orange-500';
      case SchedulerType.FOLLOW_UP:
        return 'bg-cyan-500';
      case SchedulerType.RECURRING:
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar View
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="px-4 py-2 text-sm font-medium min-w-[120px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map((day) => (
            <div 
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day && 
              day.getDate() === today.getDate() &&
              day.getMonth() === today.getMonth() &&
              day.getFullYear() === today.getFullYear();

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border border-border rounded-lg
                  ${day ? 'cursor-pointer hover:bg-muted/50' : 'bg-muted/20'}
                  ${isToday ? 'bg-primary/10 border-primary' : ''}
                `}
              >
                {day && (
                  <>
                    <div className={`
                      text-sm font-medium mb-1
                      ${isToday ? 'text-primary font-bold' : 'text-foreground'}
                    `}>
                      {day.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`
                            px-1 py-0.5 rounded text-xs text-white truncate cursor-pointer
                            ${getEventColor(event.type, event.status)}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          title={`${event.title} - ${event.scheduledTime}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Color Guide:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Reminder</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span>Meeting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span>Deadline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan-500"></div>
              <span>Follow-up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Postponed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-pink-500"></div>
              <span>Recurring</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}