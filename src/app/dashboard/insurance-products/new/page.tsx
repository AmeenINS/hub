'use client';

import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import InsuranceProductForm from '../insurance-product-form';

export default function NewInsuranceProductPage() {
  const { t } = useI18n();
  const { canWrite, isLoading: permissionsLoading } = usePermissionLevel('insurance-products');

  // Check permissions first
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
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/insurance-products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('insuranceProducts.createProduct')}
          </h1>
          <p className="text-muted-foreground">
            {t('modules.insuranceProductsDesc')}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('insuranceProducts.productDetails')}</CardTitle>
          <CardDescription>
            Fill in all required information to create a new insurance product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsuranceProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
