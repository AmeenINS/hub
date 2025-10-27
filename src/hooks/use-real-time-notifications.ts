import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface NotificationUpdate {
  type: 'notification_update';
  unreadCount: number;
  timestamp: string;
}

export function useRealTimeNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      // Reset state when no token
      const resetState = () => {
        setUnreadCount(0);
        setIsConnected(false);
      };
      resetState();
      return;
    }

    // Create SSE connection
    const connectSSE = () => {
      try {
        const eventSource = new EventSource(
          `/api/notifications/sse?token=${encodeURIComponent(token)}`
        );

        eventSource.onopen = () => {
          console.log('SSE connection opened');
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data: NotificationUpdate = JSON.parse(event.data);
            if (data.type === 'notification_update') {
              setUnreadCount(data.unreadCount);
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          setIsConnected(false);
          
          // Retry connection after 3 seconds
          setTimeout(() => {
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              connectSSE();
            }
          }, 3000);
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('Error creating SSE connection:', error);
        setIsConnected(false);
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [token]);

  // Manual refresh function
  const refreshNotifications = async () => {
    try {
      if (!token) return;
      
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const notifications = await response.json();
        const unreadNotifications = notifications.filter((n: { isRead: boolean }) => !n.isRead);
        setUnreadCount(unreadNotifications.length);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  // Mark as read function that updates count immediately
  const markAsRead = async (notificationId: string) => {
    try {
      if (!token) return;
      
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Optimistically update the count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read function
  const markAllAsRead = async () => {
    try {
      if (!token) return;
      
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    unreadCount,
    isConnected,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  };
}