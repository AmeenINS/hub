'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ProductCompanyDetailForm } from '@/features/insurance/components/product-company-detail-form';

export default function LinkCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n();
  const router = useRouter();
  const { id: productId } = use(params);

  const handleSuccess = () => {
    router.push(`/dashboard/insurance-products/${productId}/edit`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/insurance-products/${productId}/edit`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('insuranceProducts.linkCompany')}
          </h1>
          <p className="text-muted-foreground">
            {t('insuranceProducts.companyDetailsDescription')}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('insuranceProducts.companySpecificDetails')}</CardTitle>
          <CardDescription>
            Configure company-specific details for this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductCompanyDetailForm
            productId={productId}
            companyId={null}
            initialData={null}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
