'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { InsuranceProduct, InsuranceProductStatus } from '@/shared/types/database';
import { apiClient } from '@/core/api/client';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Loader2 } from 'lucide-react';
import InsuranceProductsClient from './insurance-products-client';

export default function InsuranceProductsPage() {
  const { t } = useI18n();
  const { canView, isLoading: permissionsLoading } = usePermissionLevel('insurance-products');
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleRefresh = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Fetch data function inside useEffect
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsResponse, statsResponse] = await Promise.all([
          apiClient.get('/api/insurance-products'),
          apiClient.get('/api/insurance-products/stats')
        ]);

        if (productsResponse.success) {
          setProducts(productsResponse.data || []);
        }
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch insurance products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (canView) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, refetchTrigger]);

  // Check permissions first
  if (permissionsLoading) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {t('insuranceProducts.totalProducts')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('insuranceProducts.activeProducts')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.popular || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('insuranceProducts.popularProducts')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.onlineAvailable || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('insuranceProducts.onlineProducts')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Client Component for Interactive UI */}
      <InsuranceProductsClient
        initialProducts={products}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
