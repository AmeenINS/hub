/**
 * Product-Company Detail Form
 * Form for managing company-specific details for a product
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useToast } from '@/shared/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Loader2, Save } from 'lucide-react';
import { ProductCompanyRelation, InsuranceCompany } from '@/shared/types/database';

const relationSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  commissionType: z.enum(['PERCENTAGE', 'FIXED']),
  commissionRate: z.number().optional(),
  fixedCommission: z.number().optional(),
  minCoverage: z.number().optional(),
  maxCoverage: z.number().optional(),
  basePremium: z.number().optional(),
  limitationsEn: z.string().optional(),
  limitationsAr: z.string().optional(),
  requirementsEn: z.string().optional(),
  requirementsAr: z.string().optional(),
  documentsRequired: z.array(z.string()).optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  processingTimeInDays: z.number().optional(),
  claimProcessDetailsEn: z.string().optional(),
  claimProcessDetailsAr: z.string().optional(),
  isPreferred: z.boolean().optional(),
  priority: z.number().optional(),
  notes: z.string().optional(),
});

type RelationFormData = z.infer<typeof relationSchema>;

interface ProductCompanyDetailFormProps {
  productId: string;
  companyId?: string | null;
  initialData?: ProductCompanyRelation | null;
  availableCompanies?: InsuranceCompany[];
  linkedCompanyIds?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductCompanyDetailForm({
  productId,
  companyId,
  initialData,
  availableCompanies: propAvailableCompanies,
  linkedCompanyIds: propLinkedCompanyIds,
  onSuccess,
  onCancel,
}: ProductCompanyDetailFormProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documentsInput, setDocumentsInput] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState<InsuranceCompany[]>(propAvailableCompanies || []);
  const [linkedCompanyIds, setLinkedCompanyIds] = useState<string[]>(propLinkedCompanyIds || []);

  const isEdit = !!initialData;

  // Fetch companies and linked companies on mount (only once)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all active companies
        const companiesResponse = await apiClient.get('/api/insurance-companies?status=ACTIVE');
        if (companiesResponse.success && companiesResponse.data) {
          setAvailableCompanies(companiesResponse.data as InsuranceCompany[]);
        }

        // Fetch linked companies
        const relationsResponse = await apiClient.get(`/api/insurance-products/${productId}/companies`);
        if (relationsResponse.success && relationsResponse.data) {
          const relations = relationsResponse.data as ProductCompanyRelation[];
          setLinkedCompanyIds(relations.map((r: ProductCompanyRelation) => r.companyId));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (!propAvailableCompanies || !propLinkedCompanyIds) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RelationFormData>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      companyId: companyId || initialData?.companyId || '',
      commissionType: initialData?.commissionType || 'PERCENTAGE',
      commissionRate: initialData?.commissionRate,
      fixedCommission: initialData?.fixedCommission,
      minCoverage: initialData?.minCoverage,
      maxCoverage: initialData?.maxCoverage,
      basePremium: initialData?.basePremium,
      limitationsEn: initialData?.limitationsEn || '',
      limitationsAr: initialData?.limitationsAr || '',
      requirementsEn: initialData?.requirementsEn || '',
      requirementsAr: initialData?.requirementsAr || '',
      documentsRequired: initialData?.documentsRequired || [],
      minDuration: initialData?.minDuration,
      maxDuration: initialData?.maxDuration,
      processingTimeInDays: initialData?.processingTimeInDays,
      claimProcessDetailsEn: initialData?.claimProcessDetailsEn || '',
      claimProcessDetailsAr: initialData?.claimProcessDetailsAr || '',
      isPreferred: initialData?.isPreferred || false,
      priority: initialData?.priority || 0,
      notes: initialData?.notes || '',
    },
  });

  const watchCommissionType = watch('commissionType');
  const watchIsPreferred = watch('isPreferred');
  const watchDocuments = watch('documentsRequired');

  useEffect(() => {
    if (initialData?.documentsRequired) {
      setDocumentsInput(initialData.documentsRequired.join(', '));
    }
  }, [initialData]);

  const handleAddDocument = () => {
    if (documentsInput.trim()) {
      const docs = documentsInput.split(',').map((d) => d.trim()).filter(Boolean);
      setValue('documentsRequired', docs);
    }
  };

  const onSubmit = async (data: RelationFormData) => {
    setLoading(true);
    try {
      const payload = {
        companyId: data.companyId,
        commissionType: data.commissionType,
        commissionRate: data.commissionRate ? Number(data.commissionRate) : undefined,
        fixedCommission: data.fixedCommission ? Number(data.fixedCommission) : undefined,
        minCoverage: data.minCoverage ? Number(data.minCoverage) : undefined,
        maxCoverage: data.maxCoverage ? Number(data.maxCoverage) : undefined,
        basePremium: data.basePremium ? Number(data.basePremium) : undefined,
        limitationsEn: data.limitationsEn,
        limitationsAr: data.limitationsAr,
        requirementsEn: data.requirementsEn,
        requirementsAr: data.requirementsAr,
        documentsRequired: watchDocuments,
        minDuration: data.minDuration ? Number(data.minDuration) : undefined,
        maxDuration: data.maxDuration ? Number(data.maxDuration) : undefined,
        processingTimeInDays: data.processingTimeInDays ? Number(data.processingTimeInDays) : undefined,
        claimProcessDetailsEn: data.claimProcessDetailsEn,
        claimProcessDetailsAr: data.claimProcessDetailsAr,
        isPreferred: data.isPreferred || false,
        priority: data.priority ? Number(data.priority) : 0,
        notes: data.notes,
      };

      let response;
      if (isEdit && initialData) {
        response = await apiClient.put(
          `/api/insurance-products/${productId}/companies/${initialData.companyId}`,
          payload
        );
      } else {
        response = await apiClient.post(
          `/api/insurance-products/${productId}/companies`,
          payload
        );
      }

      if (response.success) {
        toast({
          title: t('messages.success'),
          description: isEdit
            ? t('insuranceProducts.companyDetailsUpdated')
            : t('insuranceProducts.companyLinkedSuccess'),
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(
          error,
          isEdit ? t('insuranceProducts.updateCompanyError') : t('insuranceProducts.linkCompanyError')
        ),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = availableCompanies.filter(
    (company) => !linkedCompanyIds.includes(company.id) || company.id === companyId
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">{t('insuranceProducts.basicInfo')}</TabsTrigger>
          <TabsTrigger value="financial">{t('insuranceProducts.financial')}</TabsTrigger>
          <TabsTrigger value="requirements">{t('insuranceProducts.requirements')}</TabsTrigger>
          <TabsTrigger value="processing">{t('insuranceProducts.processing')}</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.companySelection')}</CardTitle>
              <CardDescription>{t('insuranceProducts.selectCompanyDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Selection */}
              <div className="space-y-2">
                <Label htmlFor="companyId">
                  {t('insuranceProducts.selectCompany')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('companyId')}
                  onValueChange={(value) => setValue('companyId', value)}
                  disabled={isEdit}
                >
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder={t('insuranceProducts.selectCompany')} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.nameEn} ({company.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyId && (
                  <p className="text-sm text-destructive">{errors.companyId.message}</p>
                )}
              </div>

              {/* Is Preferred */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="isPreferred">{t('insuranceProducts.isPreferred')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('insuranceProducts.preferredDescription')}
                  </p>
                </div>
                <Switch
                  id="isPreferred"
                  checked={watchIsPreferred}
                  onCheckedChange={(checked) => setValue('isPreferred', checked)}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">{t('common.priority')}</Label>
                <Input
                  id="priority"
                  type="number"
                  {...register('priority', { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  {t('insuranceProducts.priorityDescription')}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('common.notes')}</Label>
                <Textarea id="notes" {...register('notes')} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.commissionStructure')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Commission Type */}
              <div className="space-y-2">
                <Label htmlFor="commissionType">{t('insuranceProducts.commissionType')}</Label>
                <Select
                  value={watchCommissionType}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                    setValue('commissionType', value)
                  }
                >
                  <SelectTrigger id="commissionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">{t('insuranceProducts.percentage')}</SelectItem>
                    <SelectItem value="FIXED">{t('insuranceProducts.fixedAmount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Rate (Percentage) */}
              {watchCommissionType === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">{t('insuranceProducts.commissionRate')}</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    {...register('commissionRate', { valueAsNumber: true })}
                    placeholder="5.00"
                  />
                </div>
              )}

              {/* Fixed Commission */}
              {watchCommissionType === 'FIXED' && (
                <div className="space-y-2">
                  <Label htmlFor="fixedCommission">{t('insuranceProducts.fixedCommission')}</Label>
                  <Input
                    id="fixedCommission"
                    type="number"
                    step="0.01"
                    {...register('fixedCommission', { valueAsNumber: true })}
                    placeholder="100.00"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.coverageLimits')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Min Coverage */}
              <div className="space-y-2">
                <Label htmlFor="minCoverage">{t('insuranceProducts.minCoverage')}</Label>
                <Input
                  id="minCoverage"
                  type="number"
                  step="0.01"
                  {...register('minCoverage', { valueAsNumber: true })}
                  placeholder="1000"
                />
              </div>

              {/* Max Coverage */}
              <div className="space-y-2">
                <Label htmlFor="maxCoverage">{t('insuranceProducts.maxCoverage')}</Label>
                <Input
                  id="maxCoverage"
                  type="number"
                  step="0.01"
                  {...register('maxCoverage', { valueAsNumber: true })}
                  placeholder="100000"
                />
              </div>

              {/* Base Premium */}
              <div className="space-y-2">
                <Label htmlFor="basePremium">{t('insuranceProducts.basePremium')}</Label>
                <Input
                  id="basePremium"
                  type="number"
                  step="0.01"
                  {...register('basePremium', { valueAsNumber: true })}
                  placeholder="500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.durationLimits')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Min Duration */}
              <div className="space-y-2">
                <Label htmlFor="minDuration">{t('insuranceProducts.minDuration')}</Label>
                <Input
                  id="minDuration"
                  type="number"
                  {...register('minDuration', { valueAsNumber: true })}
                  placeholder="30"
                />
                <p className="text-sm text-muted-foreground">{t('insuranceProducts.daysUnit')}</p>
              </div>

              {/* Max Duration */}
              <div className="space-y-2">
                <Label htmlFor="maxDuration">{t('insuranceProducts.maxDuration')}</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  {...register('maxDuration', { valueAsNumber: true })}
                  placeholder="365"
                />
                <p className="text-sm text-muted-foreground">{t('insuranceProducts.daysUnit')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.limitations')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Limitations English */}
              <div className="space-y-2">
                <Label htmlFor="limitationsEn">{t('insuranceProducts.limitationsEn')}</Label>
                <Textarea id="limitationsEn" {...register('limitationsEn')} rows={4} />
              </div>

              {/* Limitations Arabic */}
              <div className="space-y-2">
                <Label htmlFor="limitationsAr">{t('insuranceProducts.limitationsAr')}</Label>
                <Textarea id="limitationsAr" {...register('limitationsAr')} rows={4} dir="rtl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.requirements')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Requirements English */}
              <div className="space-y-2">
                <Label htmlFor="requirementsEn">{t('insuranceProducts.requirementsEn')}</Label>
                <Textarea id="requirementsEn" {...register('requirementsEn')} rows={4} />
              </div>

              {/* Requirements Arabic */}
              <div className="space-y-2">
                <Label htmlFor="requirementsAr">{t('insuranceProducts.requirementsAr')}</Label>
                <Textarea id="requirementsAr" {...register('requirementsAr')} rows={4} dir="rtl" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.documentsRequired')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentsRequired">{t('insuranceProducts.documentsRequiredLabel')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="documentsRequired"
                    value={documentsInput}
                    onChange={(e) => setDocumentsInput(e.target.value)}
                    placeholder={t('insuranceProducts.documentsPlaceholder')}
                  />
                  <Button type="button" onClick={handleAddDocument} variant="outline">
                    {t('common.add')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('insuranceProducts.documentsHelp')}
                </p>
                {watchDocuments && watchDocuments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">{t('insuranceProducts.documentsCount')}: {watchDocuments.length}</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {watchDocuments.map((doc, index) => (
                        <li key={index}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.processingTime')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="processingTimeInDays">{t('insuranceProducts.processingTimeInDays')}</Label>
                <Input
                  id="processingTimeInDays"
                  type="number"
                  {...register('processingTimeInDays', { valueAsNumber: true })}
                  placeholder="3"
                />
                <p className="text-sm text-muted-foreground">
                  {t('insuranceProducts.processingTimeHelp')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.claimProcess')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Claim Process English */}
              <div className="space-y-2">
                <Label htmlFor="claimProcessDetailsEn">{t('insuranceProducts.claimProcessDetailsEn')}</Label>
                <Textarea id="claimProcessDetailsEn" {...register('claimProcessDetailsEn')} rows={5} />
              </div>

              {/* Claim Process Arabic */}
              <div className="space-y-2">
                <Label htmlFor="claimProcessDetailsAr">{t('insuranceProducts.claimProcessDetailsAr')}</Label>
                <Textarea id="claimProcessDetailsAr" {...register('claimProcessDetailsAr')} rows={5} dir="rtl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? t('common.update') : t('common.save')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
