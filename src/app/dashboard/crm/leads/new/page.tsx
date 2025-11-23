'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewLeadPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const { canWrite, isLoading } = usePermissionLevel('crm_leads');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'NEW',
    source: '',
    insuranceType: '',
    value: '',
    currentPremium: '',
    priority: 'MEDIUM',
    contactId: '',
    companyId: '',
    assignedTo: '',
    renewalDate: '',
    nextFollowUpDate: '',
    expectedCloseDate: '',
  });

  useEffect(() => {
    if (!isLoading && canWrite) {
      fetchContacts();
      fetchCompanies();
      fetchUsers();
    }
  }, [canWrite, isLoading]);

  const fetchContacts = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/crm/contacts');
      if (response.success && response.data) {
        setContacts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/crm/companies');
      if (response.success && response.data) {
        setCompanies(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/users');
      if (response.success && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error(t('validation.titleRequired'));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
        currentPremium: formData.currentPremium ? parseFloat(formData.currentPremium) : undefined,
        renewalDate: formData.renewalDate || undefined,
        nextFollowUpDate: formData.nextFollowUpDate || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
      };

      const response = await apiClient.post('/api/crm/leads', payload);
      if (response.success) {
        toast.success(t('crm.leadCreated'));
        router.push('/dashboard/crm/leads');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.failedToCreate')));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canWrite) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/crm/leads')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('crm.addLead')}</h1>
          <p className="text-muted-foreground">{t('crm.leadsDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('crm.basicInformation')}</CardTitle>
              <CardDescription>{t('crm.requiredFields')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('crm.fullNameEn')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('crm.leadStatus')}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">{t('crm.statusNew')}</SelectItem>
                      <SelectItem value="CONTACTED">{t('crm.statusContacted')}</SelectItem>
                      <SelectItem value="QUALIFIED">{t('crm.statusQualified')}</SelectItem>
                      <SelectItem value="UNQUALIFIED">{t('crm.statusUnqualified')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">{t('crm.leadSource')}</Label>
                  <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('crm.selectSource')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEBSITE">{t('crm.sourceWebsite')}</SelectItem>
                      <SelectItem value="REFERRAL">{t('crm.sourceReferral')}</SelectItem>
                      <SelectItem value="PHONE">{t('crm.sourcePhone')}</SelectItem>
                      <SelectItem value="EMAIL">{t('crm.sourceEmail')}</SelectItem>
                      <SelectItem value="SOCIAL_MEDIA">{t('crm.sourceSocialMedia')}</SelectItem>
                      <SelectItem value="ADVERTISEMENT">{t('crm.sourceAdvertisement')}</SelectItem>
                      <SelectItem value="WALK_IN">{t('crm.sourceWalkIn')}</SelectItem>
                      <SelectItem value="OTHER">{t('crm.sourceOther')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">{t('crm.priority')}</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">{t('crm.priorityLow')}</SelectItem>
                      <SelectItem value="MEDIUM">{t('crm.priorityMedium')}</SelectItem>
                      <SelectItem value="HIGH">{t('crm.priorityHigh')}</SelectItem>
                      <SelectItem value="URGENT">{t('crm.priorityUrgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('crm.notes')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.insuranceType')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceType">{t('crm.insuranceType')}</Label>
                <Select value={formData.insuranceType} onValueChange={(value) => setFormData({ ...formData, insuranceType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.selectInsuranceType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">{t('crm.insuranceAuto')}</SelectItem>
                    <SelectItem value="HEALTH">{t('crm.insuranceHealth')}</SelectItem>
                    <SelectItem value="LIFE">{t('crm.insuranceLife')}</SelectItem>
                    <SelectItem value="PROPERTY">{t('crm.insuranceProperty')}</SelectItem>
                    <SelectItem value="TRAVEL">{t('crm.insuranceTravel')}</SelectItem>
                    <SelectItem value="MARINE">{t('crm.insuranceMarine')}</SelectItem>
                    <SelectItem value="OTHER">{t('crm.insuranceOther')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPremium">{t('crm.currentPremium')}</Label>
                <Input
                  id="currentPremium"
                  type="number"
                  step="0.01"
                  value={formData.currentPremium}
                  onChange={(e) => setFormData({ ...formData, currentPremium: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">{t('crm.dealValue')}</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewalDate">{t('crm.renewalDate')}</Label>
                <Input
                  id="renewalDate"
                  type="date"
                  value={formData.renewalDate}
                  onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Relations */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.assignedTo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">{t('crm.assignedTo')}</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.selectUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactId">{t('crm.contactInfo')}</Label>
                <Select value={formData.contactId} onValueChange={(value) => setFormData({ ...formData, contactId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.fullNameEn || contact.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">{t('crm.company')}</Label>
                <Select value={formData.companyId} onValueChange={(value) => setFormData({ ...formData, companyId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.selectCompany')} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextFollowUpDate">{t('crm.nextFollowUp')}</Label>
                <Input
                  id="nextFollowUpDate"
                  type="date"
                  value={formData.nextFollowUpDate}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/crm/leads')} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('crm.createContact')}
          </Button>
        </div>
      </form>
    </div>
  );
}
