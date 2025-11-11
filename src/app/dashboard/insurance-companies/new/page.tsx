'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useToast } from '@/shared/hooks/use-toast';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { InsuranceCompanyStatus } from '@/shared/types/database';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Validation schema
const companySchema = z.object({
  nameEn: z.string().min(2, 'Company name in English is required'),
  nameAr: z.string().optional(),
  code: z.string().min(1, 'Company code is required'),
  licenseNumber: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  addressEn: z.string().optional(),
  addressAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  status: z.nativeEnum(InsuranceCompanyStatus),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function NewInsuranceCompanyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const { canWrite, isLoading: permissionsLoading } = usePermissionLevel('insurance-products');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      status: InsuranceCompanyStatus.ACTIVE,
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/insurance-companies', data);

      if (response.success) {
        toast({
          title: t('insuranceProducts.companyCreated'),
        });
        router.push('/dashboard/insurance-companies');
      } else {
        toast({
          variant: 'destructive',
          title: t('insuranceProducts.companyCreateError'),
          description: response.error || response.message,
        });
      }
    } catch (error) {
      console.error('Failed to create company:', error);
      toast({
        variant: 'destructive',
        title: t('insuranceProducts.companyCreateError'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canWrite) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">{t('accessDenied.title')}</h3>
          <p className="text-muted-foreground">{t('accessDenied.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/insurance-companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('insuranceProducts.addCompany')}</h2>
          <p className="text-muted-foreground">{t('insuranceProducts.companyManagement')}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('insuranceProducts.companyInfo')}</CardTitle>
            <CardDescription>{t('insuranceProducts.companyDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEn">
                  {t('insuranceProducts.companyNameEn')} <span className="text-red-500">*</span>
                </Label>
                <Input id="nameEn" {...register('nameEn')} placeholder="Oman Insurance Company" />
                {errors.nameEn && <p className="text-sm text-red-500">{errors.nameEn.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAr">{t('insuranceProducts.companyNameAr')}</Label>
                <Input id="nameAr" {...register('nameAr')} placeholder="شركة عمان للتأمين" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">
                  {t('insuranceProducts.companyCode')} <span className="text-red-500">*</span>
                </Label>
                <Input id="code" {...register('code')} placeholder="OIC-001" />
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">{t('insuranceProducts.licenseNumber')}</Label>
                <Input id="licenseNumber" {...register('licenseNumber')} placeholder="LIC-2024-001" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  {t('insuranceProducts.companyStatus')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as InsuranceCompanyStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={InsuranceCompanyStatus.ACTIVE}>
                      {t('insuranceProducts.companyStatuses.ACTIVE')}
                    </SelectItem>
                    <SelectItem value={InsuranceCompanyStatus.INACTIVE}>
                      {t('insuranceProducts.companyStatuses.INACTIVE')}
                    </SelectItem>
                    <SelectItem value={InsuranceCompanyStatus.SUSPENDED}>
                      {t('insuranceProducts.companyStatuses.SUSPENDED')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{t('insuranceProducts.companyDescriptionEn')}</Label>
                <Textarea id="descriptionEn" {...register('descriptionEn')} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{t('insuranceProducts.companyDescriptionAr')}</Label>
                <Textarea id="descriptionAr" {...register('descriptionAr')} rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('insuranceProducts.contactInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('insuranceProducts.companyEmail')}</Label>
                <Input id="email" type="email" {...register('email')} placeholder="info@company.om" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('insuranceProducts.companyPhone')}</Label>
                <Input id="phone" {...register('phone')} placeholder="+968 1234 5678" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t('insuranceProducts.companyWebsite')}</Label>
                <Input id="website" {...register('website')} placeholder="https://www.company.om" />
                {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressEn">{t('insuranceProducts.companyAddressEn')}</Label>
                <Input id="addressEn" {...register('addressEn')} placeholder="123 Main Street, Muscat" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressAr">{t('insuranceProducts.companyAddressAr')}</Label>
                <Input id="addressAr" {...register('addressAr')} placeholder="شارع الرئيسي، مسقط" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </>
            )}
          </Button>
          <Link href="/dashboard/insurance-companies">
            <Button type="button" variant="outline">
              {t('common.cancel')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
