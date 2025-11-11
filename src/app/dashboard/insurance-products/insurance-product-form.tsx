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
  coverageDetailsEn: z.string().optional(),
  coverageDetailsAr: z.string().optional(),
  exclusionsEn: z.string().optional(),
  exclusionsAr: z.string().optional(),
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
      coverageDetailsEn: initialData?.coverageDetailsEn || '',
      coverageDetailsAr: initialData?.coverageDetailsAr || '',
      exclusionsEn: initialData?.exclusionsEn || '',
      exclusionsAr: initialData?.exclusionsAr || '',
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

  const onSubmit = async (data: InsuranceProductFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">{t('insuranceProducts.basicInfo')}</TabsTrigger>
          <TabsTrigger value="coverage">{t('insuranceProducts.coverage')}</TabsTrigger>
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

              {/* Insurance Companies Info */}
              {!isEdit && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {t('insuranceProducts.companiesLinkInfo')}
                      </h3>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        {t('insuranceProducts.companiesLinkDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
