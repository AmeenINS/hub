'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ListTodo, Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';
import { AnimatedPage } from '@/components/ui/animated-page';
import { motion } from 'motion/react';

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
        // Fetch stats from API
        const statsResponse = await fetch('/api/dashboard/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        } else {
          // Fallback: Fetch users count only
          const usersResponse = await fetch('/api/users', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          let totalUsers = 0;
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            totalUsers = usersData.data?.length || 0;
          }

          // Mock data for now
          setStats({
            totalUsers,
            activeUsers: Math.floor(totalUsers * 0.8),
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            totalRoles: 3,
          });
        }
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
    <AnimatedPage className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
          {t('dashboard.welcome')}, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('dashboard.overview')}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
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
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <Card className="hover:shadow-xl transition-all duration-300 border-blue-100 dark:border-blue-900">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <motion.div 
                    className={`p-2 rounded-lg ${stat.bgColor}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="text-2xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.3
            }
          }
        }}
      >
        {[
          { icon: Users, title: t('nav.users'), desc: t('dashboard.manageUsers'), href: '/dashboard/users' },
          { icon: ListTodo, title: t('nav.tasks'), desc: t('dashboard.manageTasks'), href: '/dashboard/tasks' },
          { icon: Shield, title: t('nav.roles'), desc: t('dashboard.manageRoles'), href: '/dashboard/roles' }
        ].map((action, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <motion.a href={action.href}>
              <Card 
                className="cursor-pointer border-blue-100 dark:border-blue-900 overflow-hidden group"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <CardHeader className="relative">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />
                    <CardTitle className="flex items-center gap-2 relative z-10">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <action.icon className="h-5 w-5 text-blue-500" />
                      </motion.div>
                      {action.title}
                    </CardTitle>
                    <CardDescription className="relative z-10">
                      {action.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:underline inline-flex items-center gap-1">
                      {t('common.viewAll')} 
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  </CardContent>
                </motion.div>
              </Card>
            </motion.a>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-blue-100 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Clock className="h-5 w-5 text-blue-500" />
              </motion.div>
              {t('dashboard.recentActivity')}
            </CardTitle>
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
                <motion.div 
                  className="text-center py-8 text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.7, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-blue-400" />
                  </motion.div>
                  <p>{t('dashboard.noActivity')}</p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatedPage>
  );
}
