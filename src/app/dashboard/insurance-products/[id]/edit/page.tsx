'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient } from '@/core/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { InsuranceProduct } from '@/shared/types/database';
import InsuranceProductForm from '../../insurance-product-form';

export default function EditInsuranceProductPage() {
  const { t } = useI18n();
  const params = useParams();
  const productId = params.id as string;
  const { canWrite, isLoading: permissionsLoading } = usePermissionLevel('insurance-products');
  const [product, setProduct] = useState<InsuranceProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/insurance-products/${productId}`);
        if (response.success && response.data) {
          setProduct(response.data as InsuranceProduct);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (canWrite) {
      fetchProduct();
    }
  }, [productId, canWrite]);

  // Check permissions first
  if (permissionsLoading || loading) {
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

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">{t('common.error')}</h3>
          <p className="text-muted-foreground">Product not found</p>
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
            {t('insuranceProducts.editProduct')}
          </h1>
          <p className="text-muted-foreground">
            {product.nameEn} ({product.code})
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('insuranceProducts.productDetails')}</CardTitle>
          <CardDescription>
            Update the insurance product information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsuranceProductForm
            initialData={product}
            isEdit={true}
            productId={productId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
