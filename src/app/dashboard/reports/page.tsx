'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Download, FileText, BarChart3, Users, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

interface ReportStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalUsers: number;
  activeUsers: number;
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  tasksByStatus: {
    todo: number;
    inProgress: number;
    done: number;
  };
}

export default function ReportsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // Check permissions
  const checkAccess = useCallback(async () => {
    if (!token || !isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/users/me/permissions?modules=reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const permissions = await response.json();
        const hasReadAccess = permissions.reports && permissions.reports.length > 0;
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

  const fetchReportStats = useCallback(async () => {
    if (hasAccess === false) return;
    
    try {
      setLoading(true);
      
      if (!token || !isAuthenticated) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/reports/stats', {
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
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch report stats:', error);
    } finally {
      setLoading(false);
    }
  }, [router, token, isAuthenticated, hasAccess]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    if (hasAccess === true) {
      fetchReportStats();
    }
  }, [fetchReportStats, hasAccess]);

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!token) {
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom.toISOString());
      if (dateTo) params.append('to', dateTo.toISOString());
      params.append('format', format);

      const response = await fetch(`/api/reports/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t('reports.exportSuccess'));
      } else {
        toast.error(t('reports.exportError'));
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('reports.exportError'));
    }
  };

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
      <div>
        <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('reports.reportDescription')}</p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.dateRange')}</CardTitle>
          <CardDescription>
            {t('reports.selectDateRange')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">{t('reports.from')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP') : <span>{t('reports.selectDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">{t('reports.to')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP') : <span>{t('reports.selectDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleExport('pdf')} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                {t('reports.exportPDF')}
              </Button>
              <Button onClick={() => handleExport('excel')} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('reports.exportExcel')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.totalTasks')}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('reports.tasksCompleted')}
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTasks > 0
                    ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`
                    : '0%'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('reports.tasksInProgress')}
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTasks > 0
                    ? `${Math.round((stats.inProgressTasks / stats.totalTasks) * 100)}%`
                    : '0%'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.activeUsers')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.totalUsers')}: {stats.totalUsers}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.tasksByPriority')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.tasksByPriority).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-3 w-3 rounded-full',
                          key === 'urgent' && 'bg-red-500',
                          key === 'high' && 'bg-orange-500',
                          key === 'medium' && 'bg-yellow-500',
                          key === 'low' && 'bg-green-500'
                        )}
                      />
                      <span className="text-sm capitalize">{t(`tasks.priority.${key}`)}</span>
                    </div>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('reports.tasksByStatus')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.tasksByStatus).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-3 w-3 rounded-full',
                          key === 'done' && 'bg-green-500',
                          key === 'inProgress' && 'bg-blue-500',
                          key === 'todo' && 'bg-gray-500'
                        )}
                      />
                      <span className="text-sm capitalize">{t(`tasks.status.${key}`)}</span>
                    </div>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
