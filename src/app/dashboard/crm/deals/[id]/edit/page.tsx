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
import { DealStage, Deal, Contact, Company, User, Lead } from '@/shared/types/database';

interface DealFormData {
  title: string;
  leadId?: string;
  contactId?: string;
  companyId?: string;
  insuranceType: string;
  stage: DealStage;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  description?: string;
  assignedToUserId?: string;
  policyNumber?: string;
  premium?: number;
  paymentFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'ANNUALLY' | 'ONE_TIME';
  policyStartDate?: string;
  policyEndDate?: string;
  coverageAmount?: number;
  deductible?: number;
  commissionRate?: number;
  commissionAmount?: number;
  policyDetails?: string;
}

const INSURANCE_TYPES = [
  'AUTO',
  'HEALTH',
  'LIFE',
  'PROPERTY',
  'TRAVEL',
  'MARINE',
  'OTHER'
];

const DEAL_STAGES: DealStage[] = [
  DealStage.PROSPECTING,
  DealStage.QUALIFICATION,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.CLOSED_WON,
  DealStage.CLOSED_LOST
];

const PAYMENT_FREQUENCIES = [
  'MONTHLY',
  'QUARTERLY',
  'SEMI_ANNUALLY',
  'ANNUALLY',
  'ONE_TIME'
];

export default function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const { hasAccess, level } = usePermissionLevel('crm_deals');
  const hasFetchedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    insuranceType: 'AUTO',
    stage: DealStage.PROSPECTING,
    value: 0,
    probability: 10,
    paymentFrequency: 'ANNUALLY'
  });

  useEffect(() => {
    if (!hasAccess) {
      router.push('/dashboard/access-denied');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [dealRes, leadsRes, contactsRes, companiesRes, usersRes] = await Promise.all([
          apiClient.get(`/api/crm/deals/${resolvedParams.id}`),
          apiClient.get('/api/crm/leads'),
          apiClient.get('/api/crm/contacts'),
          apiClient.get('/api/crm/companies'),
          apiClient.get('/api/users')
        ]);

        if (dealRes.success && dealRes.data) {
          const dealData = dealRes.data;
          setDeal(dealData);
          
          // Populate form with existing data
          setFormData({
            title: dealData.title || '',
            leadId: dealData.leadId || undefined,
            contactId: dealData.contactId || undefined,
            companyId: dealData.companyId || undefined,
            insuranceType: dealData.insuranceType || 'AUTO',
            stage: dealData.stage || 'PROSPECTING',
            value: dealData.value || 0,
            probability: dealData.probability || 10,
            expectedCloseDate: dealData.expectedCloseDate ? new Date(dealData.expectedCloseDate).toISOString().split('T')[0] : undefined,
            description: dealData.description || undefined,
            assignedToUserId: dealData.assignedToUserId || undefined,
            policyNumber: dealData.policyNumber || undefined,
            premium: dealData.premium || undefined,
            paymentFrequency: dealData.paymentFrequency || 'ANNUALLY',
            policyStartDate: dealData.policyStartDate ? new Date(dealData.policyStartDate).toISOString().split('T')[0] : undefined,
            policyEndDate: dealData.policyEndDate ? new Date(dealData.policyEndDate).toISOString().split('T')[0] : undefined,
            coverageAmount: dealData.coverageAmount || undefined,
            deductible: dealData.deductible || undefined,
            commissionRate: dealData.commissionRate || undefined,
            commissionAmount: dealData.commissionAmount || undefined,
            policyDetails: dealData.policyDetails || undefined
          });
        }

        if (leadsRes.success && leadsRes.data) {
          const qualifiedLeads = Array.isArray(leadsRes.data)
            ? leadsRes.data.filter((l: Lead) => l.status === 'QUALIFIED')
            : [];
          setLeads(qualifiedLeads);
        }
        if (contactsRes.success && contactsRes.data) {
          setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
        }
        if (companiesRes.success && companiesRes.data) {
          setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
        }
        if (usersRes.success && usersRes.data) {
          setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, t('crm.dealErrorLoadingDeal')));
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
    
    if (!formData.title.trim()) {
      toast.error(t('crm.dealTitleRequired'));
      return;
    }

    if (formData.value <= 0) {
      toast.error(t('crm.dealValueRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.put(`/api/crm/deals/${resolvedParams.id}`, formData);
      
      if (response.success) {
        toast.success(t('crm.dealUpdateSuccess'));
        router.push(`/dashboard/crm/deals/${resolvedParams.id}`);
      } else {
        toast.error(response.message || t('crm.dealUpdateError'));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.dealUpdateError')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof DealFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-calculate commission amount if rate changes
    if (field === 'commissionRate' && formData.premium) {
      const rate = parseFloat(value) || 0;
      const commissionAmount = (formData.premium * rate) / 100;
      setFormData(prev => ({ ...prev, commissionRate: rate, commissionAmount }));
    }

    // Auto-calculate commission amount if premium changes
    if (field === 'premium' && formData.commissionRate) {
      const premium = parseFloat(value) || 0;
      const commissionAmount = (premium * formData.commissionRate) / 100;
      setFormData(prev => ({ ...prev, premium, commissionAmount }));
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

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-muted-foreground">{t('crm.dealNotFound')}</p>
        <Button onClick={() => router.push('/dashboard/crm/deals')}>
          {t('crm.dealBackToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('crm.dealEdit')}</h1>
          <p className="text-muted-foreground">{deal?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.dealsBasicInfo')}</CardTitle>
            <CardDescription>{t('crm.dealsBasicInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('crm.dealTitle')} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={t('crm.dealTitlePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceType">{t('crm.selectInsuranceType')}</Label>
                <Select
                  value={formData.insuranceType}
                  onValueChange={(value) => handleInputChange('insuranceType', value)}
                >
                  <SelectTrigger id="insuranceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURANCE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`crm.insurance${type.charAt(0) + type.slice(1).toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">{t('crm.dealStage')}</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => handleInputChange('stage', value as DealStage)}
                >
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {t(`crm.stage${stage.charAt(0) + stage.slice(1).toLowerCase().replace(/_/g, '')}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">{t('crm.dealValue')} (OMR) *</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="probability">{t('crm.dealProbability')} (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => handleInputChange('probability', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">{t('crm.dealExpectedCloseDate')}</Label>
                <Input
                  id="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate || ''}
                  onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('crm.dealDescription')}</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('crm.dealDescriptionPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Policy Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.dealPolicyDetails')}</CardTitle>
            <CardDescription>{t('crm.dealPolicyDetailsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policyNumber">{t('crm.dealPolicyNumber')}</Label>
                <Input
                  id="policyNumber"
                  value={formData.policyNumber || ''}
                  onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                  placeholder={t('crm.dealPolicyNumberPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="premium">{t('crm.premium')} (OMR)</Label>
                <Input
                  id="premium"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.premium || ''}
                  onChange={(e) => handleInputChange('premium', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentFrequency">{t('crm.premiumFrequency')}</Label>
                <Select
                  value={formData.paymentFrequency}
                  onValueChange={(value) => handleInputChange('paymentFrequency', value)}
                >
                  <SelectTrigger id="paymentFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_FREQUENCIES.map(freq => (
                      <SelectItem key={freq} value={freq}>
                        {t(`crm.frequency${freq.charAt(0) + freq.slice(1).toLowerCase().replace(/_/g, '')}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverageAmount">{t('crm.coverageAmount')} (OMR)</Label>
                <Input
                  id="coverageAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.coverageAmount || ''}
                  onChange={(e) => handleInputChange('coverageAmount', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyStartDate">{t('crm.policyStartDate')}</Label>
                <Input
                  id="policyStartDate"
                  type="date"
                  value={formData.policyStartDate || ''}
                  onChange={(e) => handleInputChange('policyStartDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyEndDate">{t('crm.policyEndDate')}</Label>
                <Input
                  id="policyEndDate"
                  type="date"
                  value={formData.policyEndDate || ''}
                  onChange={(e) => handleInputChange('policyEndDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductible">{t('crm.deductible')} (OMR)</Label>
                <Input
                  id="deductible"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deductible || ''}
                  onChange={(e) => handleInputChange('deductible', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissionRate">{t('crm.commission')} (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commissionRate || ''}
                  onChange={(e) => handleInputChange('commissionRate', parseFloat(e.target.value) || 0)}
                />
              </div>

              {formData.commissionAmount !== undefined && formData.commissionAmount > 0 && (
                <div className="space-y-2">
                  <Label>{t('crm.commission')} (OMR)</Label>
                  <Input
                    value={formData.commissionAmount.toFixed(3)}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyDetails">{t('crm.dealAdditionalPolicyDetails')}</Label>
              <Textarea
                id="policyDetails"
                rows={3}
                value={formData.policyDetails || ''}
                onChange={(e) => handleInputChange('policyDetails', e.target.value)}
                placeholder={t('crm.dealAdditionalPolicyDetailsPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment & Relations */}
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.assignment')}</CardTitle>
            <CardDescription>{t('crm.assignmentDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {user.fullNameEn || user.fullNameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.title}
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
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.fullNameEn || contact.fullNameAr || t('crm.unnamed')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">{t('crm.selectCompany')}</Label>
                <Select
                  value={formData.companyId}
                  onValueChange={(value) => handleInputChange('companyId', value)}
                >
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder={t('crm.selectCompany')} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                {t('crm.updating')}
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
