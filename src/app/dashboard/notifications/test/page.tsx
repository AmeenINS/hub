'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications';
import { Bell, RefreshCw, Send, Activity, Wifi, WifiOff } from 'lucide-react';

export default function NotificationTestPage() {
  const {
    unreadCount,
    isConnected,
    usePolling,
    refreshNotifications,
    markAllAsRead
  } = useRealTimeNotifications();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    title: 'تست اعلان',
    message: 'این یک پیام تستی است',
    type: 'info'
  });

  // بارگذاری آمار
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

  // ارسال notification تستی
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
        alert('✅ Notification ارسال شد!\nSSE Connections: ' + result.sseConnections);
        
        // رفرش آمار
        await loadStats();
      } else {
        const error = await response.json();
        alert('❌ خطا: ' + error.error);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('❌ خطا در ارسال notification');
    } finally {
      setLoading(false);
    }
  };

  // بارگذاری اولیه
  useEffect(() => {
    loadStats();
  }, []);

  // رفرش خودکار آمار
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
            <h1 className="text-3xl font-bold">تست سیستم Notifications</h1>
            <p className="text-muted-foreground mt-2">
              برای تست real-time notifications در حالت development
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
              وضعیت اتصال
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
                  <div className="text-sm text-muted-foreground">وضعیت SSE</div>
                  <div className="font-semibold">
                    {isConnected ? (
                      <span className="text-green-600">متصل ✓</span>
                    ) : (
                      <span className="text-red-600">قطع ✗</span>
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
                  <div className="text-sm text-muted-foreground">روش دریافت</div>
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
              <CardTitle>آمار سیستم</CardTitle>
              <CardDescription>آمار کلی notifications و اتصالات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.totalNotifications}</div>
                  <div className="text-sm text-muted-foreground">کل Notifications</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.userNotifications}</div>
                  <div className="text-sm text-muted-foreground">Notifications شما</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.sseConnections}</div>
                  <div className="text-sm text-muted-foreground">اتصالات SSE شما</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.stats.totalSseConnections}</div>
                  <div className="text-sm text-muted-foreground">کل اتصالات SSE</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>ارسال Notification تستی</CardTitle>
            <CardDescription>
              یک notification تستی ایجاد کنید و broadcast آن را مشاهده کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان</Label>
                <Input
                  id="title"
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="عنوان notification"
                />
              </div>

              <div>
                <Label htmlFor="message">پیام</Label>
                <Input
                  id="message"
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                  placeholder="متن notification"
                />
              </div>

              <div>
                <Label htmlFor="type">نوع</Label>
                <select
                  id="type"
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
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      ارسال Notification تستی
                    </>
                  )}
                </Button>

                <Button
                  onClick={refreshNotifications}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  رفرش دستی
                </Button>

                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                >
                  خواندن همه
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        {stats?.recentNotifications && stats.recentNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>آخرین Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentNotifications.map((notif: any) => (
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
            <CardTitle>راهنمای تست</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>وضعیت اتصال را در بالا بررسی کنید (باید SSE متصل باشد)</li>
              <li>یک notification تستی ارسال کنید</li>
              <li>باید فوراً unread count بالا برود (در 1 ثانیه)</li>
              <li>در console browser لاگ‌های SSE را مشاهده کنید</li>
              <li>برای تست Polling، اتصال اینترنت را قطع کنید</li>
              <li>بعد از 3 retry شکست، باید به Polling سوییچ کند</li>
              <li>در حالت Polling هر 30 ثانیه یکبار update می‌شود</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
