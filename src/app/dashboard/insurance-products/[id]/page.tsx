'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Loader2, 
  Package,
  FileText,
  DollarSign,
  Calendar,
  Shield,
  Globe,
  Star,
  TrendingUp,
  Building2
} from 'lucide-react';
import { InsuranceProduct, InsuranceProductStatus } from '@/shared/types/database';

export default function InsuranceProductDetailsPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { toast } = useToast();
  const { canView, canWrite, canFull, isLoading: permissionsLoading } = usePermissionLevel('insurance-products');
  
  const [product, setProduct] = useState<InsuranceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        toast({
          title: t('common.error'),
          description: t('insuranceProducts.fetchError'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (canView) {
      fetchProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, canView]);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/api/insurance-products/${product.id}`);

      if (response.success) {
        toast({
          title: t('messages.success'),
          description: t('insuranceProducts.deleteSuccess'),
        });
        router.push('/dashboard/insurance-products');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('insuranceProducts.deleteError')),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Check permissions
  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canView) {
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

  const getProductName = () => {
    return locale === 'ar' && product.nameAr ? product.nameAr : product.nameEn;
  };

  const getProviderName = () => {
    if (locale === 'ar' && product.providerNameAr) return product.providerNameAr;
    if (product.providerNameEn) return product.providerNameEn;
    return '-';
  };

  const getDescription = () => {
    if (locale === 'ar' && product.descriptionAr) return product.descriptionAr;
    return product.descriptionEn || '-';
  };

  const getStatusBadgeVariant = (status: InsuranceProductStatus) => {
    switch (status) {
      case InsuranceProductStatus.ACTIVE:
        return 'default';
      case InsuranceProductStatus.INACTIVE:
        return 'secondary';
      case InsuranceProductStatus.DISCONTINUED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/insurance-products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{getProductName()}</h1>
              <Badge variant={getStatusBadgeVariant(product.status)}>
                {t(`insuranceProducts.statuses.${product.status}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {t('insuranceProducts.code')}: <span className="font-mono">{product.code}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canWrite && (
            <Button asChild>
              <Link href={`/dashboard/insurance-products/${productId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Link>
            </Button>
          )}
          {canFull && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Info Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          <Package className="h-3 w-3 mr-1" />
          {t(`insuranceProducts.productTypes.${product.type}`)}
        </Badge>
        <Badge variant="outline">
          <Building2 className="h-3 w-3 mr-1" />
          {t(`insuranceProducts.categories.${product.category}`)}
        </Badge>
        {product.isPopular && (
          <Badge variant="default">
            <Star className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'شائع' : 'Popular'}
          </Badge>
        )}
        {product.isAvailableOnline && (
          <Badge variant="secondary">
            <Globe className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'متاح أونلاين' : 'Online'}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('insuranceProducts.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('insuranceProducts.nameEn')}
              </p>
              <p className="text-base">{product.nameEn}</p>
            </div>
            {product.nameAr && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('insuranceProducts.nameAr')}
                </p>
                <p className="text-base" dir="rtl">{product.nameAr}</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('insuranceProducts.description')}
              </p>
              <p className="text-base">{getDescription()}</p>
            </div>
            {product.targetAudience && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('insuranceProducts.targetAudience')}
                  </p>
                  <p className="text-base">{product.targetAudience}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Provider Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('insuranceProducts.provider')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('insuranceProducts.providerNameEn')}
              </p>
              <p className="text-base">{product.providerNameEn || '-'}</p>
            </div>
            {product.providerNameAr && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('insuranceProducts.providerNameAr')}
                </p>
                <p className="text-base" dir="rtl">{product.providerNameAr}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('insuranceProducts.financial')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.basePremium && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('insuranceProducts.basePremium')}
                </p>
                <p className="text-2xl font-bold">
                  {product.basePremium} {product.currency || 'OMR'}
                </p>
              </div>
            )}
            {(product.minCoverage || product.maxCoverage) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  {product.minCoverage && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('insuranceProducts.minCoverage')}
                      </p>
                      <p className="text-base font-semibold">
                        {product.minCoverage.toLocaleString()} {product.currency || 'OMR'}
                      </p>
                    </div>
                  )}
                  {product.maxCoverage && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('insuranceProducts.maxCoverage')}
                      </p>
                      <p className="text-base font-semibold">
                        {product.maxCoverage.toLocaleString()} {product.currency || 'OMR'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Commission Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('insuranceProducts.commission')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.commissionType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('insuranceProducts.commissionType')}
                </p>
                <p className="text-base">
                  {t(`insuranceProducts.commissionTypes.${product.commissionType}`)}
                </p>
              </div>
            )}
            {product.commissionRate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('insuranceProducts.commissionRate')}
                </p>
                <p className="text-2xl font-bold">{product.commissionRate}%</p>
              </div>
            )}
            {product.fixedCommission && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('insuranceProducts.fixedCommission')}
                </p>
                <p className="text-2xl font-bold">
                  {product.fixedCommission} {product.currency || 'OMR'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policy Duration */}
        {(product.minDuration || product.maxDuration || product.defaultDuration) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Policy Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {product.minDuration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('insuranceProducts.minDuration')}
                    </p>
                    <p className="text-base font-semibold">{product.minDuration} {locale === 'ar' ? 'شهر' : 'months'}</p>
                  </div>
                )}
                {product.maxDuration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('insuranceProducts.maxDuration')}
                    </p>
                    <p className="text-base font-semibold">{product.maxDuration} {locale === 'ar' ? 'شهر' : 'months'}</p>
                  </div>
                )}
                {product.defaultDuration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('insuranceProducts.defaultDuration')}
                    </p>
                    <p className="text-base font-semibold">{product.defaultDuration} {locale === 'ar' ? 'شهر' : 'months'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coverage Details */}
      {(product.coverageDetailsEn || product.coverageDetailsAr) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('insuranceProducts.coverage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.coverageDetailsEn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t('insuranceProducts.coverageDetailsEn')}
                </p>
                <p className="text-base whitespace-pre-wrap">{product.coverageDetailsEn}</p>
              </div>
            )}
            {product.coverageDetailsAr && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t('insuranceProducts.coverageDetailsAr')}
                </p>
                <p className="text-base whitespace-pre-wrap" dir="rtl">{product.coverageDetailsAr}</p>
              </div>
            )}
            {(product.exclusionsEn || product.exclusionsAr) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-semibold">{t('insuranceProducts.exclusionsEn')}</h4>
                  {product.exclusionsEn && (
                    <p className="text-base whitespace-pre-wrap">{product.exclusionsEn}</p>
                  )}
                  {product.exclusionsAr && (
                    <p className="text-base whitespace-pre-wrap" dir="rtl">{product.exclusionsAr}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Terms & Conditions */}
      {(product.termsConditionsEn || product.termsConditionsAr) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('insuranceProducts.termsConditions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.termsConditionsEn && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t('insuranceProducts.termsConditionsEn')}
                </p>
                <p className="text-base whitespace-pre-wrap">{product.termsConditionsEn}</p>
              </div>
            )}
            {product.termsConditionsAr && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t('insuranceProducts.termsConditionsAr')}
                </p>
                <p className="text-base whitespace-pre-wrap" dir="rtl">{product.termsConditionsAr}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('insuranceProducts.deleteProduct')}
        description={`${t('insuranceProducts.deleteConfirm')} ${t('insuranceProducts.deleteWarning')}`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
