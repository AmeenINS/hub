'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Loader2, 
  Mail, 
  Phone, 
  Presentation, 
  Trash2, 
  Users 
} from 'lucide-react';
import type { Activity, ActivityType, ActivityStatus } from '@/shared/types/database';

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const { hasAccess, level, canWrite, canFull } = usePermissionLevel('crm_activities');

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [assignedUserName, setAssignedUserName] = useState<string>('');

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard/access-denied');
      return;
    }

    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/api/crm/activities/${resolvedParams.id}`);
        
        if (response.success && response.data) {
          setActivity(response.data);
          
          // Fetch assigned user name if exists
          if (response.data.assignedTo) {
            try {
              const userResponse = await apiClient.get(`/api/users/${response.data.assignedTo}`);
              if (userResponse.success && userResponse.data) {
                // Use fullNameEn or fullNameAr, then fallback to email
                const userName = userResponse.data.fullNameEn?.trim() || userResponse.data.fullNameAr?.trim() || userResponse.data.email || response.data.assignedTo;
                setAssignedUserName(userName);
              }
            } catch (error) {
              console.error('Failed to fetch assigned user:', error);
            }
          }
        } else {
          toast.error(t('crm.activities.notFound'));
          router.push('/dashboard/crm/activities');
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t('crm.activities.errorLoading')));
        router.push('/dashboard/crm/activities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [resolvedParams.id, hasAccess, router, t]);

  const handleDelete = async () => {
    if (!confirm(t('crm.activities.confirmDelete'))) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/api/crm/activities/${resolvedParams.id}`);
      
      if (response.success) {
        toast.success(t('crm.activities.deleteSuccess'));
        router.push('/dashboard/crm/activities');
      } else {
        toast.error(response.message || t('crm.activities.deleteError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.activities.deleteError')));
    } finally {
      setIsDeleting(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-5 w-5" />;
      case 'MEETING': return <Users className="h-5 w-5" />;
      case 'EMAIL': return <Mail className="h-5 w-5" />;
      case 'TASK': return <CheckCircle2 className="h-5 w-5" />;
      case 'NOTE': return <Clock className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const variants: Record<ActivityStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PLANNED: 'default',
      IN_PROGRESS: 'secondary',
      COMPLETED: 'outline',
      CANCELLED: 'destructive'
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
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (activity: Activity) => {
    if (!activity.startDate || activity.status !== 'PLANNED') return false;
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

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">{t('crm.activities.notFound')}</p>
        <Button onClick={() => router.push('/dashboard/crm/activities')}>
          {t('crm.activities.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              {getActivityIcon(activity.type)}
              <h1 className="text-3xl font-bold">{activity.subject}</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(activity.status)}
              {isOverdue(activity) && (
                <Badge variant="destructive">{t('crm.activities.overdue')}</Badge>
              )}
            </div>
          </div>
        </div>
        {(canWrite || canFull) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/crm/activities/${activity.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('common.delete')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.activities.overview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {t('crm.activities.description')}
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{activity.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('crm.activities.type')}
                  </h3>
                  <p className="text-sm">
                    {t(`crm.activities.type${activity.type.charAt(0) + activity.type.slice(1).toLowerCase()}`)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('crm.activities.status')}
                  </h3>
                  <p className="text-sm">
                    {t(`crm.activities.status${activity.status.charAt(0) + activity.status.slice(1).toLowerCase()}`)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t('crm.activities.scheduledAt')}
                  </h3>
                  <p className="text-sm">{formatDate(activity.startDate)}</p>
                </div>

                {activity.completedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('crm.activities.completedAt')}
                    </h3>
                    <p className="text-sm">{formatDate(activity.completedAt)}</p>
                  </div>
                )}

                {activity.duration && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('crm.activities.duration')}
                    </h3>
                    <p className="text-sm">{activity.duration} {t('crm.activities.minutes')}</p>
                  </div>
                )}

                {activity.location && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      {t('crm.activities.location')}
                    </h3>
                    <p className="text-sm">{activity.location}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {activity.description && (
            <Card>
              <CardHeader>
                <CardTitle>{t('crm.activities.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{activity.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.assignment')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('crm.activities.assignedTo')}
                </h3>
                <p className="text-sm">{assignedUserName || activity.assignedTo || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.activities.relatedTo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.leadId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('crm.activities.lead')}</h3>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => router.push(`/dashboard/crm/leads/${activity.leadId}`)}
                  >
                    {t('crm.viewDetails')}
                  </Button>
                </div>
              )}

              {activity.dealId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('crm.activities.deal')}</h3>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => router.push(`/dashboard/crm/deals/${activity.dealId}`)}
                  >
                    {t('crm.viewDetails')}
                  </Button>
                </div>
              )}

              {activity.contactId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('crm.activities.contact')}</h3>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => router.push(`/dashboard/crm/contacts/${activity.contactId}`)}
                  >
                    {t('crm.viewDetails')}
                  </Button>
                </div>
              )}

              {!activity.leadId && !activity.dealId && !activity.contactId && (
                <p className="text-sm text-muted-foreground">{t('crm.activities.noRelatedItems')}</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('crm.createdAt')}
                </h3>
                <p className="text-sm">{formatDate(activity.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t('crm.updatedAt')}
                </h3>
                <p className="text-sm">{formatDate(activity.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
