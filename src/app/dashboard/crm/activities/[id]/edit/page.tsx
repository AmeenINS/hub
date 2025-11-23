'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { ActivityType, ActivityStatus, Activity, User, Lead, Deal, Contact } from '@/shared/types/database';

interface ActivityFormData {
  subject: string;
  description?: string;
  type: ActivityType;
  status: ActivityStatus;
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  location?: string;
  notes?: string;
  leadId?: string;
  dealId?: string;
  contactId?: string;
  assignedToUserId?: string;
}

const ACTIVITY_TYPES: ActivityType[] = [
  ActivityType.CALL,
  ActivityType.MEETING,
  ActivityType.EMAIL,
  ActivityType.TASK,
  ActivityType.NOTE
];

const ACTIVITY_STATUSES: ActivityStatus[] = [
  ActivityStatus.PLANNED,
  ActivityStatus.IN_PROGRESS,
  ActivityStatus.COMPLETED,
  ActivityStatus.CANCELLED
];

export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const { hasAccess, level } = usePermissionLevel('crm_activities');
  const hasFetchedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [formData, setFormData] = useState<ActivityFormData>({
    subject: '',
    type: ActivityType.CALL,
    status: ActivityStatus.PLANNED
  });

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard/access-denied');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [activityRes, usersRes, leadsRes, dealsRes, contactsRes] = await Promise.all([
          apiClient.get(`/api/crm/activities/${resolvedParams.id}`),
          apiClient.get('/api/users'),
          apiClient.get('/api/crm/leads'),
          apiClient.get('/api/crm/deals'),
          apiClient.get('/api/crm/contacts')
        ]);

        if (activityRes.success && activityRes.data) {
          const activityData = activityRes.data;
          setActivity(activityData);
          
          setFormData({
            subject: activityData.subject || '',
            description: activityData.description || undefined,
            type: activityData.type || 'CALL',
            status: activityData.status || 'SCHEDULED',
            scheduledAt: activityData.scheduledAt ? new Date(activityData.scheduledAt).toISOString().slice(0, 16) : undefined,
            completedAt: activityData.completedAt ? new Date(activityData.completedAt).toISOString().slice(0, 16) : undefined,
            duration: activityData.duration || undefined,
            location: activityData.location || undefined,
            notes: activityData.notes || undefined,
            leadId: activityData.leadId || undefined,
            dealId: activityData.dealId || undefined,
            contactId: activityData.contactId || undefined,
            assignedToUserId: activityData.assignedToUserId || undefined
          });
        }

        if (usersRes.success && usersRes.data) {
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        }
        if (leadsRes.success && leadsRes.data) {
          setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
        }
        if (dealsRes.success && dealsRes.data) {
          setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
        }
        if (contactsRes.success && contactsRes.data) {
          setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t('crm.activities.errorLoading')));
      } finally {
        setIsLoading(false);
      }
    };

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [hasAccess, router, resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error(t('crm.activities.subjectRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.put(`/api/crm/activities/${resolvedParams.id}`, formData);
      
      if (response.success) {
        toast.success(t('crm.activities.updateSuccess'));
        router.push(`/dashboard/crm/activities/${resolvedParams.id}`);
      } else {
        toast.error(response.message || t('crm.activities.updateError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.activities.updateError')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ActivityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('crm.activities.edit')}</h1>
            <p className="text-muted-foreground">{activity.subject}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.activities.basicInfo')}</CardTitle>
            <CardDescription>{t('crm.activities.basicInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subject">{t('crm.activities.subject')} *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder={t('crm.activities.subjectPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t('crm.activities.type')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value as ActivityType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`crm.activities.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('crm.activities.status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as ActivityStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>
                        {t(`crm.activities.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">{t('crm.activities.scheduledAt')}</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt || ''}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                />
              </div>

              {formData.status === 'COMPLETED' && (
                <div className="space-y-2">
                  <Label htmlFor="completedAt">{t('crm.activities.completedAt')}</Label>
                  <Input
                    id="completedAt"
                    type="datetime-local"
                    value={formData.completedAt || ''}
                    onChange={(e) => handleInputChange('completedAt', e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="duration">{t('crm.activities.duration')} ({t('crm.activities.minutes')})</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration || ''}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">{t('crm.activities.location')}</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder={t('crm.activities.locationPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('crm.activities.description')}</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('crm.activities.descriptionPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Related Items */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.activities.relatedTo')}</CardTitle>
            <CardDescription>{t('crm.activities.relatedToDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadId">{t('crm.selectLead')}</Label>
                <Select
                  value={formData.leadId}
                  onValueChange={(value) => handleInputChange('leadId', value)}
                >
                  <SelectTrigger id="leadId">
                    <SelectValue placeholder={t('crm.selectLead')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.title || t('crm.unnamed')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dealId">{t('crm.selectDeal')}</Label>
                <Select
                  value={formData.dealId}
                  onValueChange={(value) => handleInputChange('dealId', value)}
                >
                  <SelectTrigger id="dealId">
                    <SelectValue placeholder={t('crm.selectDeal')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {deals.map(deal => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.name || t('crm.unnamed')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactId">{t('crm.selectContact')}</Label>
                <Select
                  value={formData.contactId}
                  onValueChange={(value) => handleInputChange('contactId', value)}
                >
                  <SelectTrigger id="contactId">
                    <SelectValue placeholder={t('crm.selectContact')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.fullNameEn || contact.fullNameAr || t('crm.unnamed')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedToUserId">{t('crm.assignTo')}</Label>
                <Select
                  value={formData.assignedToUserId}
                  onValueChange={(value) => handleInputChange('assignedToUserId', value)}
                >
                  <SelectTrigger id="assignedToUserId">
                    <SelectValue placeholder={t('crm.selectUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullNameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.activities.notes')}</CardTitle>
            <CardDescription>{t('crm.activities.notesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('crm.activities.notesPlaceholder')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('crm.activities.updating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
