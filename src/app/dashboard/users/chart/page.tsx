'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import OrgChart from '@/features/dashboard/components/org-chart';
import { useI18n } from '@/shared/i18n/i18n-context';
import { RTLChevron } from '@/shared/components/ui/rtl-icon';
import { apiClient, getErrorMessage } from '@/core/api/client';

interface User {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  position?: string;
  positionId?: string;
  department?: string;
  managerId?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface Position {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
}

export default function OrgChartPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);

      // Fetch users and positions in parallel
      const [usersResponse, positionsResponse] = await Promise.all([
        apiClient.get<{ success: boolean; data: User[] }>('/api/users'),
        apiClient.get<{ success: boolean; data: Position[] }>('/api/positions'),
      ]);

      let fetchedUsers: User[] = [];
      if (usersResponse.success && usersResponse.data) {
        // API returns { success: true, data: User[] } - data is already the array
        fetchedUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      }

      // Process positions if available
      if (positionsResponse.success && positionsResponse.data) {
        const fetchedPositions = Array.isArray(positionsResponse.data) 
          ? positionsResponse.data 
          : [];

        // Map position IDs to names
        const positionMap = new Map<string, Position>(
          fetchedPositions.map((p: Position) => [p.id, p])
        );

        // Replace position IDs with names in users
        const usersWithPositionNames = fetchedUsers.map((user: User) => {
          const positionEntry = user.position ? positionMap.get(user.position) : undefined;
          const positionName = positionEntry
            ? [positionEntry.name, positionEntry.nameAr].filter(Boolean).join(' / ')
            : user.position;
          return {
            ...user,
            position: positionName,
            positionId: user.position, // Keep original ID
          };
        });

        setUsers(usersWithPositionNames);
      } else {
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error('Error fetching org chart data:', error);
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('users.orgChart')}
          </h2>
          <p className="text-muted-foreground">
            {t('users.orgChartDescription')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchUsers}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {users.length > 0 ? (
            <div className="w-full h-[calc(100vh-300px)] min-h-[600px]">
              <OrgChart users={users} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">
                {t('users.noUsersFound')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
