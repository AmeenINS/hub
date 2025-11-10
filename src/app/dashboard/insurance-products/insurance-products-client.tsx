'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  InsuranceProduct, 
  InsuranceProductStatus, 
  InsuranceProductType, 
  InsuranceProductCategory 
} from '@/shared/types/database';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

interface InsuranceProductsClientProps {
  initialProducts: InsuranceProduct[];
  onRefresh: () => void;
}

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

const getStatusIcon = (status: InsuranceProductStatus) => {
  switch (status) {
    case InsuranceProductStatus.ACTIVE:
      return CheckCircle2;
    case InsuranceProductStatus.INACTIVE:
      return Clock;
    case InsuranceProductStatus.DISCONTINUED:
      return XCircle;
    default:
      return Package;
  }
};

export default function InsuranceProductsClient({ 
  initialProducts, 
  onRefresh 
}: InsuranceProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InsuranceProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('insurance-products');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!canView) {
    return null;
  }

  const canCreate = canWrite;
  const canEdit = canWrite;
  const canDelete = canFull;

  // Filter products
  const filteredProducts = products.filter(product => {
    const nameEn = product.nameEn?.toLowerCase() || '';
    const nameAr = product.nameAr?.toLowerCase() || '';
    const code = product.code?.toLowerCase() || '';
    const providerEn = product.providerNameEn?.toLowerCase() || '';
    const providerAr = product.providerNameAr?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      nameEn.includes(query) ||
      nameAr.includes(query) ||
      code.includes(query) ||
      providerEn.includes(query) ||
      providerAr.includes(query);

    const matchesType = typeFilter === 'all' || product.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const openDeleteDialog = (product: InsuranceProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/api/insurance-products/${productToDelete.id}`);

      if (response.success) {
        setProducts(products.filter(p => p.id !== productToDelete.id));
        toast({
          title: t('messages.success'),
          description: t('insuranceProducts.deleteSuccess'),
        });
        setDeleteDialogOpen(false);
        setProductToDelete(null);
        onRefresh();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('insuranceProducts.deleteError')),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getProductName = (product: InsuranceProduct) => {
    return locale === 'ar' && product.nameAr ? product.nameAr : product.nameEn;
  };

  const getProviderName = (product: InsuranceProduct) => {
    if (locale === 'ar' && product.providerNameAr) return product.providerNameAr;
    if (product.providerNameEn) return product.providerNameEn;
    return '-';
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('insuranceProducts.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('modules.insuranceProductsDesc')}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/insurance-products/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('insuranceProducts.createProduct')}
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('insuranceProducts.searchPlaceholder')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('insuranceProducts.filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('insuranceProducts.allTypes')}</SelectItem>
                  {Object.values(InsuranceProductType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`insuranceProducts.productTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('insuranceProducts.filterByCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('insuranceProducts.allCategories')}</SelectItem>
                  {Object.values(InsuranceProductCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`insuranceProducts.categories.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('insuranceProducts.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('insuranceProducts.allStatuses')}</SelectItem>
                  {Object.values(InsuranceProductStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`insuranceProducts.statuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? t('insuranceProducts.noResults')
                  : t('insuranceProducts.noProducts')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            const StatusIcon = getStatusIcon(product.status);
            return (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{getProductName(product)}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="font-mono text-xs">{product.code}</span>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/insurance-products/${product.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('common.view')}
                          </Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/insurance-products/${product.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('common.edit')}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(product)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getStatusBadgeVariant(product.status)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {t(`insuranceProducts.statuses.${product.status}`)}
                      </Badge>
                      <Badge variant="outline">
                        {t(`insuranceProducts.productTypes.${product.type}`)}
                      </Badge>
                      <Badge variant="secondary">
                        {t(`insuranceProducts.categories.${product.category}`)}
                      </Badge>
                    </div>
                    
                    {product.providerNameEn || product.providerNameAr ? (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{t('insuranceProducts.provider')}:</span>{' '}
                        {getProviderName(product)}
                      </div>
                    ) : null}
                    
                    {product.basePremium && (
                      <div className="text-sm">
                        <span className="font-medium">{t('insuranceProducts.basePremium')}:</span>{' '}
                        {product.basePremium} {product.currency || 'OMR'}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      {product.isPopular && (
                        <Badge variant="default" className="text-xs">
                          ⭐ {locale === 'ar' ? 'شائع' : 'Popular'}
                        </Badge>
                      )}
                      {product.isAvailableOnline && (
                        <Badge variant="secondary" className="text-xs">
                          🌐 {locale === 'ar' ? 'متاح أونلاين' : 'Online'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
    </>
  );
}
