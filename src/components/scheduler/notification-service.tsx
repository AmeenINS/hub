'use client';

import { useEffect } from 'react';

export default function SchedulerNotificationService() {
  useEffect(() => {
    const processNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
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
            console.log(`📅 Processed ${result.data.processed} scheduler notifications`);
          }
        }
      } catch (error) {
        console.error('Error processing scheduler notifications:', error);
      }
    };

    // Run immediately on load
    processNotifications();

    // Set interval for periodic checking (every 2 minutes)
    const notificationInterval = setInterval(processNotifications, 120000);

    // Cleanup on unmount
    return () => {
      clearInterval(notificationInterval);
    };
  }, []);

  return null; // This component renders nothing
}

// Hook for use in other components
export function useSchedulerNotifications() {
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch('/api/scheduler/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Immediate check
    checkNotifications();
  }, []);
}