'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Loader2, Plus } from 'lucide-react';
import { Activity, ActivityType, ActivityStatus } from '@/shared/types/database';
import { ActivitiesDataTable } from '@/features/crm/components/activities-data-table';

const ACTIVITY_TYPES: ActivityType[] = [
  ActivityType.CALL,
  ActivityType.EMAIL,
  ActivityType.MEETING,
  ActivityType.TASK,
  ActivityType.NOTE
];

const ACTIVITY_STATUSES: ActivityStatus[] = [
  ActivityStatus.PLANNED,
  ActivityStatus.IN_PROGRESS,
  ActivityStatus.COMPLETED,
  ActivityStatus.CANCELLED
];

export default function ActivitiesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { hasAccess, level, canWrite } = usePermissionLevel('crm_activities');

  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'upcoming' | 'overdue' | 'all'>('all');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard/access-denied');
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/crm/activities');
        
        if (response.success && response.data) {
          const activityList = Array.isArray(response.data) ? response.data : [];
          setActivities(activityList);
          setFilteredActivities(activityList);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load activities'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [hasAccess, router]);

  useEffect(() => {
    let filtered = [...activities];

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(activity => {
        if (!activity.startDate) return false;
        const scheduledDate = new Date(activity.startDate);
        return scheduledDate > now && activity.status === ActivityStatus.PLANNED;
      });
    } else if (dateFilter === 'overdue') {
      filtered = filtered.filter(activity => {
        if (!activity.startDate) return false;
        const scheduledDate = new Date(activity.startDate);
        return scheduledDate < now && activity.status === ActivityStatus.PLANNED;
      });
    }

    setFilteredActivities(filtered);
  }, [activities, typeFilter, statusFilter, dateFilter]);

  const handleEdit = (activity: Activity) => {
    router.push(`/dashboard/crm/activities/${activity.id}/edit`);
  };

  const handleDelete = async (activity: Activity) => {
    if (!confirm(t('common.confirm'))) return;
    
    try {
      const response = await apiClient.delete(`/api/crm/activities/${activity.id}`);
      if (response.success) {
        toast.success(t('crm.activities.deleteSuccess'));
        setActivities(prev => prev.filter(a => a.id !== activity.id));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.activities.deleteFailed')));
    }
  };

  if (!hasAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('crm.activities.title')}</h1>
          <p className="text-muted-foreground">{t('crm.activities.description')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => router.push('/dashboard/crm/activities/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.activities.activitiesNew')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('crm.filters')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ActivityType | 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder={t('crm.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                {ACTIVITY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {t(`crm.activities.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ActivityStatus | 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder={t('crm.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('crm.showAll')}</SelectItem>
                {ACTIVITY_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {t(`crm.activities.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as 'upcoming' | 'overdue' | 'all')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('crm.activities.allActivities')}</SelectItem>
                <SelectItem value="upcoming">{t('crm.activities.upcoming')}</SelectItem>
                <SelectItem value="overdue">{t('crm.activities.overdue')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('crm.activities.title')}</CardTitle>
          <CardDescription>
            {filteredActivities.length} {t('crm.activities.activitiesFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">{t('crm.activities.noActivities')}</h3>
                <p className="text-sm text-muted-foreground">{t('crm.activities.noActivitiesDescription')}</p>
              </div>
              {canWrite && (
                <Button onClick={() => router.push('/dashboard/crm/activities/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('crm.activities.activitiesCreateNew')}
                </Button>
              )}
            </div>
          ) : (
            <ActivitiesDataTable 
              data={filteredActivities} 
              onEdit={canWrite ? handleEdit : undefined}
              onDelete={canWrite ? handleDelete : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
