'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n/i18n-context';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  position?: string;
  department?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface OrgChartProps {
  users: User[];
}

// Group users by position/department
const groupUsersByPosition = (users: User[]) => {
  const grouped: Record<string, User[]> = {};
  
  users.forEach(user => {
    const position = user.position || user.role || 'Employee';
    if (!grouped[position]) {
      grouped[position] = [];
    }
    grouped[position].push(user);
  });

  return Object.entries(grouped).sort((a, b) => {
    // Sort by hierarchy (CEO/Manager -> Team Lead -> Employee)
    const hierarchy: Record<string, number> = {
      'CEO': 1,
      'Manager': 2,
      'Team Lead': 3,
      'Employee': 4,
    };
    return (hierarchy[a[0]] || 5) - (hierarchy[b[0]] || 5);
  });
};

const getPositionColor = (position: string): string => {
  const colorMap: Record<string, string> = {
    'CEO': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'Manager': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Team Lead': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Employee': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  
  return colorMap[position] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function OrgChart({ users }: OrgChartProps) {
  const { t, locale } = useI18n();
  const grouped = groupUsersByPosition(users);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('dashboard.orgChart') || 'Organizational Chart'}</CardTitle>
        <CardDescription>
          {t('dashboard.orgChartDesc') || `${users.length} users organized by position`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`space-y-6 overflow-x-auto pb-4 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
          {grouped.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noData') || 'No users found'}
            </div>
          ) : (
            grouped.map(([position, positionUsers]) => (
              <div key={position} className="space-y-3">
                {/* Position Header */}
                <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/20">
                  <Badge variant="secondary" className={getPositionColor(position)}>
                    {position}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {positionUsers.length} {positionUsers.length === 1 ? 'user' : 'users'}
                  </span>
                </div>

                {/* Users Grid for this position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {positionUsers.map((user) => (
                    <div
                      key={user.id}
                      className="relative group"
                    >
                      <div className="rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors">
                        {/* Avatar */}
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {user.name}
                            </p>
                            {user.department && (
                              <p className="text-xs text-muted-foreground truncate">
                                {user.department}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Email */}
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>

                        {/* Status and Role Badge */}
                        <div className="flex gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={
                              user.isActive
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-200'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-200'
                            }
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {user.role && (
                            <Badge variant="secondary" className="text-xs">
                              {user.role}
                            </Badge>
                          )}
                        </div>

                        {/* Hover overlay with more info */}
                        <div className="absolute inset-0 rounded-lg bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-center text-white text-sm pointer-events-none">
                          <p className="font-semibold mb-2">{user.name}</p>
                          <p className="text-xs opacity-90 mb-2">{user.email}</p>
                          {user.position && (
                            <p className="text-xs opacity-90 mb-1">
                              <span className="font-semibold">{t('users.position') || 'Position'}:</span> {user.position}
                            </p>
                          )}
                          {user.department && (
                            <p className="text-xs opacity-90">
                              <span className="font-semibold">{t('users.department') || 'Department'}:</span> {user.department}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Statistics */}
        {users.length > 0 && (
          <div className="mt-8 pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {users.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.totalUsers') || 'Total Users'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('common.active') || 'Active'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(users.map(u => u.position || u.role || 'N/A')).size}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.positions') || 'Positions'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(users.map(u => u.department || 'N/A')).size}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.departments') || 'Departments'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
