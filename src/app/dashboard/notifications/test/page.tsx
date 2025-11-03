'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications';
import { Bell, RefreshCw, Send, Activity, Wifi, WifiOff } from 'lucide-react';

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
      const response = await fetch('/api/notifications/test');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test notification sent:', result);
        alert('✅ Notification sent successfully!\nSSE Connections: ' + result.sseConnections);
        
        // Refresh statistics
        await loadStats();
      } else {
        const error = await response.json();
        alert('❌ Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('❌ Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStats();
  }, []);

  // Auto-refresh statistics
  useEffect(() => {
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl" dir="rtl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notification System Test</h1>
            <p className="text-muted-foreground mt-2">
              Test real-time notifications in development mode
            </p>
          </div>
          <Button onClick={loadStats} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="text-sm text-muted-foreground">SSE Status</div>
                  <div className="font-semibold">
                    {isConnected ? (
                      <span className="text-green-600">Connected ✓</span>
                    ) : (
                      <span className="text-red-600">Disconnected ✗</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Bell className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Unread Count</div>
                  <div className="font-semibold text-2xl">{unreadCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Activity className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Delivery Method</div>
                  <div className="font-semibold">
                    {usePolling ? (
                      <Badge variant="outline">Polling (30s)</Badge>
                    ) : (
                      <Badge>SSE Real-time</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>Overall notifications and connections statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.totalNotifications}</div>
                  <div className="text-sm text-muted-foreground">Total Notifications</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.userNotifications}</div>
                  <div className="text-sm text-muted-foreground">Your Notifications</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.sseConnections}</div>
                  <div className="text-sm text-muted-foreground">Your SSE Connections</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.totalSseConnections}</div>
                  <div className="text-sm text-muted-foreground">Total SSE Connections</div>
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
              Create a test notification and observe its broadcast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="Notification title"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                  placeholder="Notification message"
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  title="Notification type"
                  value={testForm.type}
                  onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={sendTestNotification}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Notification
                    </>
                  )}
                </Button>

                <Button
                  onClick={refreshNotifications}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Manual Refresh
                </Button>

                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                >
                  Mark All Read
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        {stats?.recentNotifications && stats.recentNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border rounded-lg flex items-start gap-3 ${
                      notif.isRead ? 'opacity-60' : 'bg-blue-50 dark:bg-blue-950'
                    }`}
                  >
                    <Bell className="h-4 w-4 mt-1" />
                    <div className="flex-1">
                      <div className="font-semibold">{notif.title}</div>
                      <div className="text-sm text-muted-foreground">{notif.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <Badge variant={notif.isRead ? 'outline' : 'default'}>
                      {notif.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Check the connection status above (SSE should be connected)</li>
              <li>Send a test notification</li>
              <li>Unread count should increase immediately (within 1 second)</li>
              <li>Check SSE logs in browser console</li>
              <li>To test Polling, disconnect your internet</li>
              <li>After 3 failed retries, it should switch to Polling</li>
              <li>In Polling mode, updates happen every 30 seconds</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
