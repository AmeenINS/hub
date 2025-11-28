'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/components/ui/table';
import { toast } from 'sonner';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Mail, 
  Phone, 
  Plus, 
  Presentation, 
  Search, 
  Users 
} from 'lucide-react';
import { Activity, ActivityType, ActivityStatus } from '@/shared/types/database';

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
  const [searchTerm, setSearchTerm] = useState('');
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
  }, [activities, searchTerm, typeFilter, statusFilter, dateFilter]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />;
      case 'MEETING': return <Users className="h-4 w-4" />;
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'TASK': return <CheckCircle2 className="h-4 w-4" />;
      case 'NOTE': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const variants: Record<ActivityStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [ActivityStatus.PLANNED]: 'default',
      [ActivityStatus.IN_PROGRESS]: 'secondary',
      [ActivityStatus.COMPLETED]: 'outline',
      [ActivityStatus.CANCELLED]: 'destructive'
    };

    return (
      <Badge variant={variants[status]}>
        {t(`crm.activities.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
      </Badge>
    );
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (activity: Activity) => {
    if (!activity.startDate || activity.status !== ActivityStatus.PLANNED) return false;
    return new Date(activity.startDate) < new Date();
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('crm.activities.activitiesSearchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

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

      {/* Activities Table */}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('crm.activities.type')}</TableHead>
                    <TableHead>{t('crm.activities.subject')}</TableHead>
                    <TableHead>{t('crm.activities.status')}</TableHead>
                    <TableHead>{t('crm.activities.scheduledAt')}</TableHead>
                    <TableHead>{t('crm.activities.relatedTo')}</TableHead>
                    <TableHead>{t('crm.activities.assignedTo')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow 
                      key={activity.id}
                      className={isOverdue(activity) ? 'bg-destructive/10' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <span className="text-sm">
                            {t(`crm.activities.type${activity.type.charAt(0) + activity.type.slice(1).toLowerCase()}`)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{activity.subject}</div>
                          {activity.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {activity.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(activity.status)}
                        {isOverdue(activity) && (
                          <Badge variant="destructive" className="ml-2">
                            {t('crm.activities.overdue')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(activity.startDate)}
                      </TableCell>
                      <TableCell>
                        {activity.leadId && <Badge variant="outline">{t('crm.activities.lead')}</Badge>}
                        {activity.dealId && <Badge variant="outline">{t('crm.activities.deal')}</Badge>}
                        {activity.contactId && <Badge variant="outline">{t('crm.activities.contact')}</Badge>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {activity.assignedTo || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/crm/activities/${activity.id}`)}
                        >
                          {t('crm.viewDetails')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
