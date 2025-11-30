'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Phone, Mail, Users, CheckCircle2, Calendar, Clock, MapPin, User as UserIcon, Building2, TrendingUp, Info } from 'lucide-react';
import { ActivityType, ActivityStatus, User, Lead, Deal, Contact } from '@/shared/types/database';

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

export default function NewActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const { hasAccess, level } = usePermissionLevel('crm_activities');
  const hasFetchedRef = useRef(false);

  // Get pre-filled data from URL params
  const leadIdParam = searchParams.get('leadId');
  const dealIdParam = searchParams.get('dealId');
  const contactIdParam = searchParams.get('contactId');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Pre-filled related entity details
  const [relatedLead, setRelatedLead] = useState<Lead | null>(null);
  const [relatedDeal, setRelatedDeal] = useState<Deal | null>(null);
  const [relatedContact, setRelatedContact] = useState<Contact | null>(null);

  const [formData, setFormData] = useState<ActivityFormData>({
    subject: '',
    type: ActivityType.CALL,
    status: ActivityStatus.PLANNED,
    leadId: leadIdParam || undefined,
    dealId: dealIdParam || undefined,
    contactId: contactIdParam || undefined
  });

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard/access-denied');
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, leadsRes, dealsRes, contactsRes] = await Promise.all([
          apiClient.get('/api/users'),
          apiClient.get('/api/crm/leads'),
          apiClient.get('/api/crm/deals'),
          apiClient.get('/api/crm/contacts')
        ]);

        if (usersRes.success && usersRes.data) {
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        }
        if (leadsRes.success && leadsRes.data) {
          const leadsData = Array.isArray(leadsRes.data) ? leadsRes.data : [];
          setLeads(leadsData);
          
          // If leadId is provided in URL, find and set the related lead
          if (leadIdParam) {
            const lead = leadsData.find(l => l.id === leadIdParam);
            if (lead) {
              setRelatedLead(lead);
              // Auto-fill subject with lead title
              setFormData(prev => ({
                ...prev,
                subject: prev.subject || `${t('crm.followUp')}: ${lead.title}`
              }));
            }
          }
        }
        if (dealsRes.success && dealsRes.data) {
          const dealsData = Array.isArray(dealsRes.data) ? dealsRes.data : [];
          setDeals(dealsData);
          
          // If dealId is provided in URL, find and set the related deal
          if (dealIdParam) {
            const deal = dealsData.find(d => d.id === dealIdParam);
            if (deal) {
              setRelatedDeal(deal);
              setFormData(prev => ({
                ...prev,
                subject: prev.subject || `${t('crm.followUp')}: ${deal.name}`
              }));
            }
          }
        }
        if (contactsRes.success && contactsRes.data) {
          const contactsData = Array.isArray(contactsRes.data) ? contactsRes.data : [];
          setContacts(contactsData);
          
          // If contactId is provided in URL, find and set the related contact
          if (contactIdParam) {
            const contact = contactsData.find(c => c.id === contactIdParam);
            if (contact) {
              setRelatedContact(contact);
            }
          }
        }
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hasAccess, router, leadIdParam, dealIdParam, contactIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error(t('crm.activities.subjectRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.post('/api/crm/activities', formData);
      
      if (response.success) {
        toast.success(t('crm.activities.createSuccess'));
        router.push('/dashboard/crm/activities');
      } else {
        toast.error(response.message || t('crm.activities.createError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.activities.createError')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ActivityFormData, value: any) => {
    // Convert 'none' to undefined for optional fields
    const finalValue = value === 'none' ? undefined : value;
    setFormData(prev => ({ ...prev, [field]: finalValue }));
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

  // Get icon for activity type
  const getActivityIcon = () => {
    switch (formData.type) {
      case ActivityType.CALL: return <Phone className="h-5 w-5" />;
      case ActivityType.EMAIL: return <Mail className="h-5 w-5" />;
      case ActivityType.MEETING: return <Users className="h-5 w-5" />;
      case ActivityType.TASK: return <CheckCircle2 className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getActivityTypeIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.CALL: return <Phone className="h-4 w-4" />;
      case ActivityType.MEETING: return <Users className="h-4 w-4" />;
      case ActivityType.EMAIL: return <Mail className="h-4 w-4" />;
      case ActivityType.TASK: return <CheckCircle2 className="h-4 w-4" />;
      case ActivityType.NOTE: return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('crm.newActivity')}</h1>
          <p className="text-muted-foreground">{t('crm.activities.createDescription')}</p>
        </div>
      </div>

      {/* Context Alert - Show what this activity is related to */}
      {(relatedLead || relatedDeal || relatedContact) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {relatedLead && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{t('crm.activityForLead')}: <strong>{relatedLead.title}</strong></span>
              </div>
            )}
            {relatedDeal && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{t('crm.activityForDeal')}: <strong>{relatedDeal.name}</strong></span>
              </div>
            )}
            {relatedContact && (
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>{t('crm.activityForContact')}: <strong>{relatedContact.fullNameEn}</strong></span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getActivityIcon()}
              {t('crm.activityType')}
            </CardTitle>
            <CardDescription>{t('crm.selectActivityType')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ACTIVITY_TYPES.map(type => {
                const isSelected = formData.type === type;
                const Icon = type === 'CALL' ? Phone : type === 'EMAIL' ? Mail : type === 'MEETING' ? Users : type === 'TASK' ? CheckCircle2 : Calendar;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('type', type)}
                    className={`p-4 rounded-lg border-2 transition-all hover:border-primary ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {t(`crm.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.basicInfo')}</CardTitle>
            <CardDescription>{t('crm.enterActivityDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t('crm.subject')} *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder={t('crm.subjectPlaceholder')}
                required
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('crm.activities.descriptionLabel')}</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('crm.activities.descriptionPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('crm.status')}
                </Label>
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
                        {t(`crm.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('crm.scheduledDate')}
                </Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt || ''}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('crm.duration')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    step="15"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                    placeholder="30"
                  />
                  <span className="flex items-center text-sm text-muted-foreground">{t('crm.minutes')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('crm.location')}
              </Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder={t('crm.locationPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Related Items - Only show if not pre-filled */}
        {!leadIdParam && !dealIdParam && (
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.relatedTo')}</CardTitle>
              <CardDescription>{t('crm.linkToLeadOrDeal')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadId" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('crm.lead')}
                  </Label>
                  <Select
                    value={formData.leadId}
                    onValueChange={(value) => handleInputChange('leadId', value)}
                  >
                    <SelectTrigger id="leadId">
                      <SelectValue placeholder={t('crm.selectLead')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('crm.none')}</SelectItem>
                      {leads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dealId" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('crm.deal')}
                  </Label>
                  <Select
                    value={formData.dealId}
                    onValueChange={(value) => handleInputChange('dealId', value)}
                  >
                    <SelectTrigger id="dealId">
                      <SelectValue placeholder={t('crm.selectDeal')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('crm.none')}</SelectItem>
                      {deals.map(deal => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment & Contact */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.assignmentContact')}</CardTitle>
            <CardDescription>{t('crm.assignmentContactDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedToUserId" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {t('crm.assignTo')}
                </Label>
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
                        {locale === 'ar' && user.fullNameAr ? user.fullNameAr : user.fullNameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactId" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {t('crm.contact')}
                </Label>
                <Select
                  value={formData.contactId}
                  onValueChange={(value) => handleInputChange('contactId', value)}
                >
                  <SelectTrigger id="contactId">
                    <SelectValue placeholder={t('crm.selectContact')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('crm.none')}</SelectItem>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {locale === 'ar' && contact.fullNameAr ? contact.fullNameAr : contact.fullNameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.notes')}</CardTitle>
            <CardDescription>{t('crm.notesOptional')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('crm.notesPlaceholder')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 sticky bottom-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 p-4 border-t -mx-4 -mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('crm.createActivity')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
