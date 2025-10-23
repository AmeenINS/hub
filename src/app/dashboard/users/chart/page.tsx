'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import OrgChart from '@/components/dashboard/org-chart';
import { useAuthStore } from '@/store/auth-store';
import { useI18n } from '@/lib/i18n/i18n-context';
import { RTLChevron } from '@/components/ui/rtl-icon';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  position?: string;
  department?: string;
  managerId?: string;
  createdAt?: string;
  isActive?: boolean;
}

export default function OrgChartPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { token, isLoading: authLoading } = useAuthStore();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Wait for auth store to hydrate
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = React.useCallback(async () => {
    if (!mounted || authLoading) return;

    try {
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(t('common.error') || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [mounted, token, authLoading, t]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setLoading(true);
    fetchUsers();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8"
            >
              <RTLChevron>
                <ArrowLeft className="h-4 w-4" />
              </RTLChevron>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('dashboard.orgChart') || 'Organizational Chart'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('dashboard.orgChartPageDesc') ||
              'View your organization structure and employee hierarchy'}
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh') || 'Refresh'}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
              <p className="text-muted-foreground">
                {t('common.loading') || 'Loading...'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                {t('common.noData') || 'No users found'}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/users/new')}
              >
                {t('users.createNew') || 'Create New User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <OrgChart users={users} />
      )}
    </div>
  );
}
