'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ListTodo, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

export default function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();

  const quickActions = [
    {
      title: t('nav.users'),
      description: t('dashboard.manageUsers'),
      icon: Users,
      href: '/dashboard/users',
      color: 'text-blue-600'
    },
    {
      title: t('nav.tasks'),
      description: t('dashboard.manageTasks'),
      icon: ListTodo,
      href: '/dashboard/tasks',
      color: 'text-green-600'
    },
    {
      title: t('nav.roles'),
      description: t('dashboard.manageRoles'),
      icon: Shield,
      href: '/dashboard/roles',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcome')}, {user?.firstName || 'User'}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          {t('dashboard.overview')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200 dark:hover:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <action.icon className={`h-8 w-8 ${action.color}`} />
                  <span className="text-xl">{action.title}</span>
                </CardTitle>
                <CardDescription className="text-base">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {t('common.viewAll')} →
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
            {t('dashboard.welcomeToSystem')}
          </CardTitle>
          <CardDescription className="text-lg text-blue-700 dark:text-blue-300">
            {t('dashboard.sidebarNavigation')}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
