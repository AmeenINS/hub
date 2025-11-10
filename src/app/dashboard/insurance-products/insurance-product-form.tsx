'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useToast } from '@/shared/hooks/use-toast';
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
import {
  InsuranceProduct,
  InsuranceProductType,
  InsuranceProductCategory,
  InsuranceProductStatus,
} from '@/shared/types/database';
import { Save, Loader2 } from 'lucide-react';

// Validation schema
const insuranceProductSchema = z.object({
  nameEn: z.string().min(2, 'Product name in English is required'),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  code: z.string().min(1, 'Product code is required'),
  type: z.nativeEnum(InsuranceProductType),
  category: z.nativeEnum(InsuranceProductCategory),
  providerNameEn: z.string().optional(),
  providerNameAr: z.string().optional(),
  coverageDetailsEn: z.string().optional(),
  coverageDetailsAr: z.string().optional(),
  exclusionsEn: z.string().optional(),
  exclusionsAr: z.string().optional(),
  basePremium: z.number().optional(),
  currency: z.string().optional(),
  minCoverage: z.number().optional(),
  maxCoverage: z.number().optional(),
  commissionRate: z.number().optional(),
  commissionType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  fixedCommission: z.number().optional(),
  minDuration: z.number().optional(),
  maxDuration: z.number().optional(),
  defaultDuration: z.number().optional(),
  termsConditionsEn: z.string().optional(),
  termsConditionsAr: z.string().optional(),
  targetAudience: z.string().optional(),
  status: z.nativeEnum(InsuranceProductStatus),
  isAvailableOnline: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  priority: z.number().optional(),
});

type InsuranceProductFormData = z.infer<typeof insuranceProductSchema>;

interface InsuranceProductFormProps {
  initialData?: Partial<InsuranceProduct>;
  isEdit?: boolean;
  productId?: string;
}

export default function InsuranceProductForm({
  initialData,
  isEdit = false,
  productId,
}: InsuranceProductFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InsuranceProductFormData>({
    resolver: zodResolver(insuranceProductSchema),
    defaultValues: {
      nameEn: initialData?.nameEn || '',
      nameAr: initialData?.nameAr || '',
      descriptionEn: initialData?.descriptionEn || '',
      descriptionAr: initialData?.descriptionAr || '',
      code: initialData?.code || '',
      type: initialData?.type || InsuranceProductType.MOTOR,
      category: initialData?.category || InsuranceProductCategory.INDIVIDUAL,
      providerNameEn: initialData?.providerNameEn || '',
      providerNameAr: initialData?.providerNameAr || '',
      coverageDetailsEn: initialData?.coverageDetailsEn || '',
      coverageDetailsAr: initialData?.coverageDetailsAr || '',
      exclusionsEn: initialData?.exclusionsEn || '',
      exclusionsAr: initialData?.exclusionsAr || '',
      basePremium: initialData?.basePremium || undefined,
      currency: initialData?.currency || 'OMR',
      minCoverage: initialData?.minCoverage || undefined,
      maxCoverage: initialData?.maxCoverage || undefined,
      commissionRate: initialData?.commissionRate || undefined,
      commissionType: (initialData?.commissionType as 'PERCENTAGE' | 'FIXED') || 'PERCENTAGE',
      fixedCommission: initialData?.fixedCommission || undefined,
      minDuration: initialData?.minDuration || undefined,
      maxDuration: initialData?.maxDuration || undefined,
      defaultDuration: initialData?.defaultDuration || undefined,
      termsConditionsEn: initialData?.termsConditionsEn || '',
      termsConditionsAr: initialData?.termsConditionsAr || '',
      targetAudience: initialData?.targetAudience || '',
      status: initialData?.status || InsuranceProductStatus.ACTIVE,
      isAvailableOnline: initialData?.isAvailableOnline || false,
      isPopular: initialData?.isPopular || false,
      priority: initialData?.priority || 0,
    },
  });

  const watchType = watch('type');
  const watchCategory = watch('category');
  const watchStatus = watch('status');
  const watchCommissionType = watch('commissionType');

  const onSubmit = async (data: InsuranceProductFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        basePremium: data.basePremium ? Number(data.basePremium) : undefined,
        minCoverage: data.minCoverage ? Number(data.minCoverage) : undefined,
        maxCoverage: data.maxCoverage ? Number(data.maxCoverage) : undefined,
        commissionRate: data.commissionRate ? Number(data.commissionRate) : undefined,
        fixedCommission: data.fixedCommission ? Number(data.fixedCommission) : undefined,
        minDuration: data.minDuration ? Number(data.minDuration) : undefined,
        maxDuration: data.maxDuration ? Number(data.maxDuration) : undefined,
        defaultDuration: data.defaultDuration ? Number(data.defaultDuration) : undefined,
        priority: data.priority ? Number(data.priority) : undefined,
      };

      let response;
      if (isEdit && productId) {
        response = await apiClient.put(`/api/insurance-products/${productId}`, payload);
      } else {
        response = await apiClient.post('/api/insurance-products', payload);
      }

      if (response.success) {
        toast({
          title: t('messages.success'),
          description: isEdit
            ? t('insuranceProducts.updateSuccess')
            : t('insuranceProducts.createSuccess'),
        });
        router.push('/dashboard/insurance-products');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(
          error,
          isEdit ? t('insuranceProducts.updateError') : t('insuranceProducts.createError')
        ),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">{t('insuranceProducts.basicInfo')}</TabsTrigger>
          <TabsTrigger value="coverage">{t('insuranceProducts.coverage')}</TabsTrigger>
          <TabsTrigger value="financial">{t('insuranceProducts.financial')}</TabsTrigger>
          <TabsTrigger value="commission">{t('insuranceProducts.commission')}</TabsTrigger>
          <TabsTrigger value="terms">{t('insuranceProducts.termsConditions')}</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.basicInfo')}</CardTitle>
              <CardDescription>
                {t('insuranceProducts.nameEn')}, {t('insuranceProducts.code')}, {t('insuranceProducts.type')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Name (English) */}
              <div className="space-y-2">
                <Label htmlFor="nameEn">
                  {t('insuranceProducts.nameEn')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nameEn"
                  {...register('nameEn')}
                  placeholder="e.g., Comprehensive Motor Insurance"
                />
                {errors.nameEn && (
                  <p className="text-sm text-destructive">{errors.nameEn.message}</p>
                )}
              </div>

              {/* Product Name (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="nameAr">{t('insuranceProducts.nameAr')}</Label>
                <Input
                  id="nameAr"
                  {...register('nameAr')}
                  placeholder="مثال: تأمين شامل للسيارات"
                  dir="rtl"
                />
              </div>

              {/* Product Code */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  {t('insuranceProducts.code')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  {...register('code')}
                  placeholder={t('insuranceProducts.codePlaceholder')}
                  disabled={isEdit}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              {/* Product Type */}
              <div className="space-y-2">
                <Label htmlFor="type">
                  {t('insuranceProducts.type')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watchType}
                  onValueChange={(value) => setValue('type', value as InsuranceProductType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InsuranceProductType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`insuranceProducts.productTypes.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  {t('insuranceProducts.category')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watchCategory}
                  onValueChange={(value) => setValue('category', value as InsuranceProductCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InsuranceProductCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`insuranceProducts.categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description (English) */}
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{t('insuranceProducts.descriptionEn')}</Label>
                <Textarea
                  id="descriptionEn"
                  {...register('descriptionEn')}
                  rows={3}
                  placeholder="Enter product description in English"
                />
              </div>

              {/* Description (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{t('insuranceProducts.descriptionAr')}</Label>
                <Textarea
                  id="descriptionAr"
                  {...register('descriptionAr')}
                  rows={3}
                  placeholder="أدخل وصف المنتج بالعربية"
                  dir="rtl"
                />
              </div>

              {/* Provider Name (English) */}
              <div className="space-y-2">
                <Label htmlFor="providerNameEn">{t('insuranceProducts.providerNameEn')}</Label>
                <Input
                  id="providerNameEn"
                  {...register('providerNameEn')}
                  placeholder="e.g., Dhofar Insurance"
                />
              </div>

              {/* Provider Name (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="providerNameAr">{t('insuranceProducts.providerNameAr')}</Label>
                <Input
                  id="providerNameAr"
                  {...register('providerNameAr')}
                  placeholder="مثال: شركة ظفار للتأمين"
                  dir="rtl"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">{t('insuranceProducts.status')}</Label>
                <Select
                  value={watchStatus}
                  onValueChange={(value) => setValue('status', value as InsuranceProductStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InsuranceProductStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`insuranceProducts.statuses.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">{t('insuranceProducts.targetAudience')}</Label>
                <Input
                  id="targetAudience"
                  {...register('targetAudience')}
                  placeholder="e.g., Individual car owners, Fleet operators"
                />
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isAvailableOnline">
                    {t('insuranceProducts.isAvailableOnline')}
                  </Label>
                  <Switch
                    id="isAvailableOnline"
                    checked={watch('isAvailableOnline')}
                    onCheckedChange={(checked) => setValue('isAvailableOnline', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isPopular">{t('insuranceProducts.isPopular')}</Label>
                  <Switch
                    id="isPopular"
                    checked={watch('isPopular')}
                    onCheckedChange={(checked) => setValue('isPopular', checked)}
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">{t('insuranceProducts.priority')}</Label>
                <Input
                  id="priority"
                  type="number"
                  {...register('priority', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Tab */}
        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.coverage')}</CardTitle>
              <CardDescription>Coverage details and exclusions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coverage Details (English) */}
              <div className="space-y-2">
                <Label htmlFor="coverageDetailsEn">
                  {t('insuranceProducts.coverageDetailsEn')}
                </Label>
                <Textarea
                  id="coverageDetailsEn"
                  {...register('coverageDetailsEn')}
                  rows={5}
                  placeholder="Enter coverage details in English"
                />
              </div>

              {/* Coverage Details (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="coverageDetailsAr">
                  {t('insuranceProducts.coverageDetailsAr')}
                </Label>
                <Textarea
                  id="coverageDetailsAr"
                  {...register('coverageDetailsAr')}
                  rows={5}
                  placeholder="أدخل تفاصيل التغطية بالعربية"
                  dir="rtl"
                />
              </div>

              {/* Exclusions (English) */}
              <div className="space-y-2">
                <Label htmlFor="exclusionsEn">{t('insuranceProducts.exclusionsEn')}</Label>
                <Textarea
                  id="exclusionsEn"
                  {...register('exclusionsEn')}
                  rows={5}
                  placeholder="Enter exclusions in English"
                />
              </div>

              {/* Exclusions (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="exclusionsAr">{t('insuranceProducts.exclusionsAr')}</Label>
                <Textarea
                  id="exclusionsAr"
                  {...register('exclusionsAr')}
                  rows={5}
                  placeholder="أدخل الاستثناءات بالعربية"
                  dir="rtl"
                />
              </div>

              {/* Min/Max Coverage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minCoverage">{t('insuranceProducts.minCoverage')}</Label>
                  <Input
                    id="minCoverage"
                    type="number"
                    {...register('minCoverage', { valueAsNumber: true })}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCoverage">{t('insuranceProducts.maxCoverage')}</Label>
                  <Input
                    id="maxCoverage"
                    type="number"
                    {...register('maxCoverage', { valueAsNumber: true })}
                    placeholder="100000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.financial')}</CardTitle>
              <CardDescription>Premium and pricing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Base Premium */}
                <div className="space-y-2">
                  <Label htmlFor="basePremium">{t('insuranceProducts.basePremium')}</Label>
                  <Input
                    id="basePremium"
                    type="number"
                    step="0.01"
                    {...register('basePremium', { valueAsNumber: true })}
                    placeholder="100.00"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('insuranceProducts.currency')}</Label>
                  <Input id="currency" {...register('currency')} placeholder="OMR" />
                </div>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minDuration">{t('insuranceProducts.minDuration')}</Label>
                  <Input
                    id="minDuration"
                    type="number"
                    {...register('minDuration', { valueAsNumber: true })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDuration">{t('insuranceProducts.maxDuration')}</Label>
                  <Input
                    id="maxDuration"
                    type="number"
                    {...register('maxDuration', { valueAsNumber: true })}
                    placeholder="12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultDuration">{t('insuranceProducts.defaultDuration')}</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    {...register('defaultDuration', { valueAsNumber: true })}
                    placeholder="12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Tab */}
        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.commission')}</CardTitle>
              <CardDescription>Commission structure and rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Commission Type */}
              <div className="space-y-2">
                <Label htmlFor="commissionType">{t('insuranceProducts.commissionType')}</Label>
                <Select
                  value={watchCommissionType}
                  onValueChange={(value) => setValue('commissionType', value as 'PERCENTAGE' | 'FIXED')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">
                      {t('insuranceProducts.commissionTypes.PERCENTAGE')}
                    </SelectItem>
                    <SelectItem value="FIXED">
                      {t('insuranceProducts.commissionTypes.FIXED')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Rate (if percentage) */}
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

              {/* Fixed Commission (if fixed) */}
              {watchCommissionType === 'FIXED' && (
                <div className="space-y-2">
                  <Label htmlFor="fixedCommission">{t('insuranceProducts.fixedCommission')}</Label>
                  <Input
                    id="fixedCommission"
                    type="number"
                    step="0.01"
                    {...register('fixedCommission', { valueAsNumber: true })}
                    placeholder="50.00"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terms & Conditions Tab */}
        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('insuranceProducts.termsConditions')}</CardTitle>
              <CardDescription>Terms, conditions, and legal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Terms & Conditions (English) */}
              <div className="space-y-2">
                <Label htmlFor="termsConditionsEn">
                  {t('insuranceProducts.termsConditionsEn')}
                </Label>
                <Textarea
                  id="termsConditionsEn"
                  {...register('termsConditionsEn')}
                  rows={8}
                  placeholder="Enter terms and conditions in English"
                />
              </div>

              {/* Terms & Conditions (Arabic) */}
              <div className="space-y-2">
                <Label htmlFor="termsConditionsAr">
                  {t('insuranceProducts.termsConditionsAr')}
                </Label>
                <Textarea
                  id="termsConditionsAr"
                  {...register('termsConditionsAr')}
                  rows={8}
                  placeholder="أدخل الشروط والأحكام بالعربية"
                  dir="rtl"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/insurance-products')}
          disabled={loading}
        >
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
              {t('common.save')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
