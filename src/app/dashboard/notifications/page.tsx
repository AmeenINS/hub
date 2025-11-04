'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useModulePermissions } from '@/hooks/use-permissions';

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
  const { permissions, isLoading: permissionsLoading } = useModulePermissions('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!permissions.canView) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get<Notification[]>('/api/notifications');
      
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        toast.error(response.message || t('messages.errorFetchingData'));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    } finally {
      setLoading(false);
    }
  }, [permissions.canView, t]);

  useEffect(() => {
    if (permissions.canView) {
      fetchNotifications();
    }
  }, [permissions.canView, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.put(`/api/notifications/${notificationId}/read`);

      if (response.success) {
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
      const response = await apiClient.put('/api/notifications/mark-all-read');

      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        toast.success(t('notifications.markAllSuccess'));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error(getErrorMessage(error, t('messages.updateError')));
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!permissions.canDelete) {
      toast.error(t('messages.noPermission'));
      return;
    }

    try {
      setDeletingId(notificationId);
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);

      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        toast.success(response.message || t('messages.deleteSuccess'));
      } else {
        toast.error(response.message || t('messages.deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error(getErrorMessage(error, t('messages.deleteError')));
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllNotifications = async () => {
    if (!permissions.canDelete) {
      toast.error(t('messages.noPermission'));
      return;
    }

    try {
      const response = await apiClient.delete('/api/notifications');

      if (response.success) {
        setNotifications([]);
        toast.success(response.message || t('messages.deleteSuccess'));
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      toast.error(getErrorMessage(error, t('messages.deleteError')));
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

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!permissions.canView) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
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
          <p className="text-muted-foreground mt-1">
            {t('notifications.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              {t('notifications.markAllRead')}
            </Button>
          )}
          {permissions.canDelete && notifications.length > 0 && (
            <Button onClick={deleteAllNotifications} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
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

        <TabsContent value={filter} className="space-y-4 mt-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {filter === 'unread'
                    ? t('notifications.noUnread')
                    : filter === 'read'
                    ? t('notifications.noRead')
                    : t('notifications.noNotifications')}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  !notification.isRead ? 'border-l-4 border-l-primary bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {notification.title}
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            {t('notifications.new')}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: locale === 'ar' ? ar : enUS,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.link && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                      {permissions.canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          disabled={deletingId === notification.id}
                        >
                          {deletingId === notification.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{notification.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
