'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useToast } from '@/shared/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProductCompanyRelation } from '@/shared/types/database';
import { ProductCompanyDetailForm } from '@/features/insurance/components/product-company-detail-form';

export default function EditCompanyLinkPage({ 
  params 
}: { 
  params: Promise<{ id: string; companyId: string }> 
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const { id: productId, companyId } = use(params);
  const [relation, setRelation] = useState<ProductCompanyRelation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelation = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          `/api/insurance-products/${productId}/companies/${companyId}`
        );
        if (response.success && response.data) {
          setRelation(response.data as ProductCompanyRelation);
        }
      } catch (error) {
        toast({
          title: t('common.error'),
          description: getErrorMessage(error, 'Failed to load company details'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRelation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, companyId]);

  const handleSuccess = () => {
    router.push(`/dashboard/insurance-products/${productId}/edit`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!relation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">{t('common.error')}</h3>
          <p className="text-muted-foreground">Company link not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('insuranceProducts.editCompanyDetails')}
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
            Update company-specific details for this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductCompanyDetailForm
            productId={productId}
            companyId={companyId}
            initialData={relation}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
