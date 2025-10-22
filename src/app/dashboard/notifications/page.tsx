'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // Check permissions
  const checkAccess = useCallback(async () => {
    if (!token || !isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/users/me/permissions?modules=notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const permissions = await response.json();
        const hasReadAccess = permissions.notifications && permissions.notifications.length > 0;
        setHasAccess(hasReadAccess);
        
        if (!hasReadAccess) {
          router.push('/dashboard/access-denied');
        }
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setHasAccess(false);
      router.push('/dashboard/access-denied');
    }
  }, [token, isAuthenticated, router]);

  const fetchNotifications = useCallback(async () => {
    if (hasAccess === false) return;
    
    try {
      setLoading(true);
      
      if (!token || !isAuthenticated) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        toast.error('Session expired. Please login again');
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        router.push('/dashboard/access-denied');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        toast.error(t('messages.errorFetchingData'));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error(t('messages.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  }, [router, t, token, isAuthenticated, hasAccess]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (hasAccess === true) {
      fetchNotifications();
    }
  }, [fetchNotifications, hasAccess]);

  const markAsRead = async (notificationId: string) => {
    try {
      if (!token) return;
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!token) return;
      
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        toast.success(t('notifications.markAllSuccess'));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error(t('messages.updateError'));
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      if (!token) return;
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success(t('messages.deleteSuccess'));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error(t('messages.deleteError'));
    }
  };

  const deleteAllNotifications = async () => {
    try {
      if (!token) return;
      
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications([]);
        toast.success(t('messages.deleteSuccess'));
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      toast.error(t('messages.deleteError'));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            {t('notifications.title')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">{t('notifications.description')}</p>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" />
              {t('notifications.markAllAsRead')}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={deleteAllNotifications} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('notifications.deleteAll')}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread' | 'read')}>
        <TabsList>
          <TabsTrigger value="all">
            {t('notifications.all')} ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            {t('notifications.unread')} ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            {t('notifications.read')} ({notifications.length - unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('notifications.noNotifications')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  !notification.isRead ? 'bg-muted/50' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {notification.title}
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            {t('notifications.unread')}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: locale === 'ar' ? ar : enUS,
                        })}
                      </CardDescription>
                    </div>

                    <div className="flex gap-1">
                      {!notification.isRead && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {notification.link && (
                        <Button
                          onClick={() => handleNotificationClick(notification)}
                          variant="ghost"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
