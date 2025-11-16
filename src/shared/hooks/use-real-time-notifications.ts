import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/shared/state/auth-store';
import { apiClient, ApiClientError } from '@/core/api/client';

interface NotificationUpdate {
  type: 'notification_update';
  unreadCount: number;
  timestamp: string;
}

interface Notification {
  id: string;
  isRead: boolean;
}

const POLLING_INTERVAL = 30000; // 30 seconds
const SSE_RETRY_DELAY = 5000; // 5 seconds

export function useRealTimeNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [usePolling, setUsePolling] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { token, logout, isLoading } = useAuthStore();

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    try {
      // Check if user is authenticated
      // Note: auth-token is HttpOnly cookie, so we rely on store token
      if (!token) return;
      
      const response = await apiClient.get<Notification[]>('/api/notifications');
      
      if (response.success && response.data) {
        const unreadNotifications = response.data.filter((n: Notification) => !n.isRead);
        setUnreadCount(unreadNotifications.length);
      }
    } catch (error) {
      // Handle 401 - token expired or invalid, logout user
      if (error instanceof ApiClientError && error.statusCode === 401) {
        console.warn('Authentication failed, logging out user');
        logout();
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching notifications:', error);
      }
    }
  }, [token, logout]);

  // Initial fetch - wait for auth store to finish loading
  useEffect(() => {
    // Don't fetch while auth store is still rehydrating from localStorage
    if (isLoading) return;
    
    if (token) {
      fetchNotifications();
    }
  }, [token, isLoading, fetchNotifications]);

  // Setup polling as fallback
  useEffect(() => {
    if (!token || !usePolling || isLoading) {
      // Clear polling if exists
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Start polling
    fetchNotifications();
    pollingIntervalRef.current = setInterval(fetchNotifications, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [token, usePolling, isLoading, fetchNotifications]);

  // Setup SSE connection
  useEffect(() => {
    // Wait for auth store to finish loading
    if (isLoading) return;
    
    if (!token) {
      setUnreadCount(0);
      setIsConnected(false);
      setUsePolling(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;

    const connectSSE = () => {
      try {
        // Close existing connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // SSE will use cookies automatically - no need to pass token in URL
        const eventSource = new EventSource(`/api/notifications/sse`);

        eventSource.onopen = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ SSE connection established');
          }
          setIsConnected(true);
          setUsePolling(false); // Stop polling when SSE is connected
          retryCount = 0; // Reset retry count on successful connection
        };

        eventSource.onmessage = (event) => {
          try {
            const data: NotificationUpdate = JSON.parse(event.data);
            if (data.type === 'notification_update') {
              setUnreadCount(data.unreadCount);
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error parsing SSE message:', error);
            }
          }
        };

        eventSource.onerror = () => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ SSE connection error, will retry or use polling');
          }
          setIsConnected(false);
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          
          // Retry or fallback to polling
          if (retryCount < maxRetries) {
            retryCount++;
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔄 Retrying SSE connection (${retryCount}/${maxRetries})...`);
            }
            retryTimeoutRef.current = setTimeout(connectSSE, SSE_RETRY_DELAY);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('📊 Switching to polling mode');
            }
            setUsePolling(true); // Fallback to polling after max retries
          }
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating SSE connection:', error);
        }
        setIsConnected(false);
        setUsePolling(true); // Fallback to polling on error
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [token, isLoading]); // Added isLoading to dependencies

  // Mark as read function that updates count immediately
  const markAsRead = async (notificationId: string) => {
    try {
      if (!token) return;
      
      const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
      
      if (response.success) {
        // Optimistically update the count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // Handle 401 - token expired or invalid, logout user
      if (error instanceof ApiClientError && error.statusCode === 401) {
        console.warn('Authentication failed, logging out user');
        logout();
        return;
      }
      
      // Silent error handling
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  // Mark all as read function
  const markAllAsRead = async () => {
    try {
      if (!token) return;
      
      const response = await apiClient.put('/api/notifications/mark-all-read');
      
      if (response.success) {
        setUnreadCount(0);
      }
    } catch (error) {
      // Handle 401 - token expired or invalid, logout user
      if (error instanceof ApiClientError && error.statusCode === 401) {
        console.warn('Authentication failed, logging out user');
        logout();
        return;
      }
      
      // Silent error handling
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  return {
    unreadCount,
    isConnected,
    usePolling,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}