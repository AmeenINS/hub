'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ListTodo, Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalRoles: number;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        // Fetch users count
        const usersResponse = await fetch('/api/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        let totalUsers = 0;
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          totalUsers = usersData.data?.length || 0;
        }

        // Mock data for now (will be replaced with real API calls)
        setStats({
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.8),
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          totalRoles: 3, // super_admin, manager, employee
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  const statsCards = [
    {
      title: t('dashboard.totalUsers'),
      value: stats?.totalUsers || 0,
      description: `${stats?.activeUsers || 0} ${t('dashboard.activeUsers')}`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: t('dashboard.totalTasks'),
      value: stats?.totalTasks || 0,
      description: `${stats?.completedTasks || 0} ${t('dashboard.completed')}`,
      icon: ListTodo,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: t('dashboard.pendingTasks'),
      value: stats?.pendingTasks || 0,
      description: t('dashboard.needsAttention'),
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: t('dashboard.totalRoles'),
      value: stats?.totalRoles || 0,
      description: t('dashboard.rolesManagement'),
      icon: Shield,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome')}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('dashboard.overview')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('nav.users')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.manageUsers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/dashboard/users"
              className="text-sm text-primary hover:underline"
            >
              {t('common.viewAll')} →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              {t('nav.tasks')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.manageTasks')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/dashboard/tasks"
              className="text-sm text-primary hover:underline"
            >
              {t('common.viewAll')} →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('nav.roles')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.manageRoles')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/dashboard/roles"
              className="text-sm text-primary hover:underline"
            >
              {t('common.viewAll')} →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>
            {t('dashboard.latestUpdates')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('dashboard.noActivity')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
