/**
 * Product Companies Management Component
 * Manages insurance companies linked to a product
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useToast } from '@/shared/hooks/use-toast';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Building2, Plus, Edit, Trash2, Loader2, Star, AlertCircle } from 'lucide-react';
import { ProductCompanyRelation, InsuranceCompany } from '@/shared/types/database';

interface ProductCompaniesProps {
  productId: string;
  canEdit: boolean;
}

export function ProductCompanies({ productId, canEdit }: ProductCompaniesProps) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [relations, setRelations] = useState<(ProductCompanyRelation & { company?: InsuranceCompany })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [relationToDelete, setRelationToDelete] = useState<ProductCompanyRelation | null>(null);

  const fetchRelations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/api/insurance-products/${productId}/companies`
      );

      if (response.success && response.data) {
        const relationsList = response.data as ProductCompanyRelation[];
        // Fetch company details for each relation
        const relationsWithCompanies = await Promise.all(
          relationsList.map(async (relation: ProductCompanyRelation) => {
            try {
              const companyResponse = await apiClient.get(
                `/api/insurance-companies/${relation.companyId}`
              );
              return {
                ...relation,
                company: companyResponse.success && companyResponse.data ? (companyResponse.data as InsuranceCompany) : undefined,
              };
            } catch {
              return relation;
            }
          })
        );
        setRelations(relationsWithCompanies);
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('insuranceProducts.fetchCompaniesError')),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleAddCompany = () => {
    router.push(`/dashboard/insurance-products/${productId}/link-company`);
  };

  const handleEditRelation = (companyId: string) => {
    router.push(`/dashboard/insurance-products/${productId}/edit-company/${companyId}`);
  };

  const handleDeleteClick = (relation: ProductCompanyRelation) => {
    setRelationToDelete(relation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!relationToDelete) return;

    try {
      const response = await apiClient.delete(
        `/api/insurance-products/${productId}/companies/${relationToDelete.companyId}`
      );

      if (response.success) {
        toast({
          title: t('messages.success'),
          description: t('insuranceProducts.companyUnlinkedSuccess'),
        });
        fetchRelations();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('insuranceProducts.companyUnlinkError')),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setRelationToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('insuranceProducts.linkedCompanies')}
              </CardTitle>
              <CardDescription>
                {t('insuranceProducts.linkedCompaniesDescription')}
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={handleAddCompany}>
                <Plus className="h-4 w-4 mr-2" />
                {t('insuranceProducts.linkCompany')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {relations.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('insuranceProducts.noLinkedCompanies')}</p>
              {canEdit && (
                <Button onClick={handleAddCompany} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('insuranceProducts.linkFirstCompany')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {relations.map((relation) => (
                <Card key={relation.id} className="relative">
                  {relation.isPreferred && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {t('insuranceProducts.preferred')}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {relation.company
                        ? locale === 'ar'
                          ? relation.company.nameAr || relation.company.nameEn
                          : relation.company.nameEn
                        : relation.companyId}
                    </CardTitle>
                    {relation.company && (
                      <CardDescription>
                        {t('insuranceProducts.companyCode')}: {relation.company.code}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Commission */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('insuranceProducts.commission')}:</span>
                      <span className="font-medium">
                        {relation.commissionType === 'PERCENTAGE'
                          ? `${relation.commissionRate}%`
                          : `${relation.fixedCommission} OMR`}
                      </span>
                    </div>

                    {/* Coverage Range */}
                    {(relation.minCoverage || relation.maxCoverage) && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('insuranceProducts.coverageRange')}:</span>
                        <span className="font-medium">
                          {relation.minCoverage} - {relation.maxCoverage}
                        </span>
                      </div>
                    )}

                    {/* Base Premium */}
                    {relation.basePremium && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('insuranceProducts.basePremium')}:</span>
                        <span className="font-medium">{relation.basePremium}</span>
                      </div>
                    )}

                    {/* Processing Time */}
                    {relation.processingTimeInDays && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('insuranceProducts.processingTime')}:</span>
                        <span className="font-medium">
                          {relation.processingTimeInDays} {t('common.days')}
                        </span>
                      </div>
                    )}

                    {/* Priority */}
                    {relation.priority !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('common.priority')}:</span>
                        <span className="font-medium">{relation.priority}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRelation(relation.companyId)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(relation)}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('insuranceProducts.unlinkCompany')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('insuranceProducts.unlinkCompanyConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
