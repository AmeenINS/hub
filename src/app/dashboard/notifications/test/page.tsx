'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications';
import { Bell, RefreshCw, Send, Activity, Wifi, WifiOff } from 'lucide-react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationStats {
  stats: {
    totalNotifications: number;
    userNotifications: number;
    unreadCount: number;
    sseConnections: number;
    totalSseConnections: number;
  };
  recentNotifications: Notification[];
}

export default function NotificationTestPage() {
  const {
    unreadCount,
    isConnected,
    usePolling,
    refreshNotifications,
    markAllAsRead
  } = useRealTimeNotifications();

  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    title: 'Test Notification',
    message: 'This is a test notification message',
    type: 'info'
  });

  // Load statistics
  const loadStats = async () => {
    try {
      const response = await apiClient.get<NotificationStats>('/api/notifications/test');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ sseConnections: number }>('/api/notifications/test', testForm);

      if (response.success && response.data) {
        console.log('✅ Test notification sent:', response.data);
        toast.success(
          `✅ Notification sent successfully!\nSSE Connections: ${response.data.sseConnections}`
        );
        
        // Refresh statistics
        await loadStats();
      } else {
        toast.error(response.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(getErrorMessage(error, 'Failed to send notification'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Notification System Test
          </h1>
          <p className="text-muted-foreground mt-1">
            Test and monitor the real-time notification system
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Connection Status
          </CardTitle>
          <CardDescription>
            Real-time notification connection status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Mode:</span>
            <Badge variant="outline">
              {usePolling ? 'Polling Fallback' : 'SSE'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Unread Count:</span>
            <Badge variant="secondary">{unreadCount}</Badge>
          </div>
          {stats && (
            <>
              <div className="flex items-center justify-between">
                <span>Active SSE Connections:</span>
                <Badge variant="secondary">{stats.stats.sseConnections}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Total SSE Connections:</span>
                <Badge variant="outline">{stats.stats.totalSseConnections}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Current notification statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.stats.totalNotifications}</div>
                <div className="text-sm text-muted-foreground">Total Notifications</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.stats.userNotifications}</div>
                <div className="text-sm text-muted-foreground">Your Notifications</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.stats.unreadCount}</div>
                <div className="text-sm text-muted-foreground">Unread</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>
            Create and send a test notification to yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={testForm.title}
              onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
              placeholder="Notification title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              value={testForm.message}
              onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
              placeholder="Notification message"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              value={testForm.type}
              onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
              placeholder="info, success, warning, error"
            />
          </div>
          <Button 
            onClick={sendTestNotification} 
            disabled={loading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {stats && stats.recentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
            <CardDescription>Latest 5 notifications from the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{notif.title}</span>
                      {!notif.isRead && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {notif.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Test various notification actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={refreshNotifications}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Notifications
          </Button>
          <Button 
            onClick={markAllAsRead}
            variant="outline"
            className="w-full"
          >
            Mark All as Read
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
