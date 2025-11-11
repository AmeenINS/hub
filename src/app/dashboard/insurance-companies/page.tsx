'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { InsuranceCompany, InsuranceCompanyStatus } from '@/shared/types/database';
import { apiClient } from '@/core/api/client';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Loader2, Plus, Search, Building2, Edit, Trash2, Mail, Phone, Globe, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
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

export default function InsuranceCompaniesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { canView, canWrite, canFull, isLoading: permissionsLoading } = usePermissionLevel('insurance-products');
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<InsuranceCompany[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<InsuranceCompany | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    // Fetch data function inside useEffect
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<InsuranceCompany[]>('/api/insurance-companies');

        if (response.success && response.data) {
          setCompanies(response.data);
          setFilteredCompanies(response.data);
          
          // Calculate stats
          const activeCount = response.data.filter(c => c.status === InsuranceCompanyStatus.ACTIVE).length;
          const inactiveCount = response.data.filter(c => c.status === InsuranceCompanyStatus.INACTIVE).length;
          const suspendedCount = response.data.filter(c => c.status === InsuranceCompanyStatus.SUSPENDED).length;
          
          setStats({
            total: response.data.length,
            active: activeCount,
            inactive: inactiveCount,
            suspended: suspendedCount,
          });
        }
      } catch (error) {
        console.error('Failed to fetch insurance companies:', error);
        toast({
          variant: 'destructive',
          title: t('insuranceProducts.companyFetchError'),
          description: t('common.error'),
        });
      } finally {
        setLoading(false);
      }
    };

    if (canView) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, refetchTrigger]);

  // Filter companies based on search and status
  useEffect(() => {
    let filtered = companies;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.nameEn.toLowerCase().includes(query) ||
          company.nameAr?.toLowerCase().includes(query) ||
          company.code.toLowerCase().includes(query) ||
          company.licenseNumber?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((company) => company.status === statusFilter);
    }

    setFilteredCompanies(filtered);
  }, [searchQuery, statusFilter, companies]);

  const handleDelete = async () => {
    if (!companyToDelete || !canFull) return;

    setDeleting(true);
    try {
      const response = await apiClient.delete(`/api/insurance-companies/${companyToDelete.id}`);

      if (response.success) {
        toast({
          title: t('insuranceProducts.companyDeleted'),
        });
        setRefetchTrigger(prev => prev + 1);
      } else {
        toast({
          variant: 'destructive',
          title: t('insuranceProducts.companyDeleteError'),
        });
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast({
        variant: 'destructive',
        title: t('insuranceProducts.companyDeleteError'),
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const getStatusBadge = (status: InsuranceCompanyStatus) => {
    switch (status) {
      case InsuranceCompanyStatus.ACTIVE:
        return <Badge className="bg-green-500">{t('insuranceProducts.companyStatuses.ACTIVE')}</Badge>;
      case InsuranceCompanyStatus.INACTIVE:
        return <Badge variant="secondary">{t('insuranceProducts.companyStatuses.INACTIVE')}</Badge>;
      case InsuranceCompanyStatus.SUSPENDED:
        return <Badge variant="destructive">{t('insuranceProducts.companyStatuses.SUSPENDED')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('insuranceProducts.companies')}</h2>
          <p className="text-muted-foreground">{t('insuranceProducts.companyManagement')}</p>
        </div>
        {canWrite && (
          <Link href="/dashboard/insurance-companies/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('insuranceProducts.addCompany')}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-muted-foreground">{t('insuranceProducts.totalCompanies')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
              <p className="text-xs text-muted-foreground">{t('insuranceProducts.activeCompanies')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive || 0}</div>
              <p className="text-xs text-muted-foreground">{t('insuranceProducts.inactiveCompanies')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.suspended || 0}</div>
              <p className="text-xs text-muted-foreground">{t('insuranceProducts.suspendedCompanies')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('insuranceProducts.searchCompaniesPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t('insuranceProducts.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('insuranceProducts.allStatuses')}</SelectItem>
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
        </CardContent>
      </Card>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('insuranceProducts.noCompanies')}</h3>
            <p className="text-muted-foreground mb-4">{t('insuranceProducts.searchCompanies')}</p>
            {canWrite && (
              <Link href="/dashboard/insurance-companies/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('insuranceProducts.addCompany')}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{company.nameEn}</h3>
                      {company.nameAr && (
                        <p className="text-sm text-muted-foreground">{company.nameAr}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(company.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{t('insuranceProducts.companyCode')}:</span>
                    <span className="text-muted-foreground">{company.code}</span>
                  </div>
                  {company.licenseNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{t('insuranceProducts.licenseNumber')}:</span>
                      <span className="text-muted-foreground">{company.licenseNumber}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.addressEn && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{company.addressEn}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {canWrite && (
                    <Link href={`/dashboard/insurance-companies/${company.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                      </Button>
                    </Link>
                  )}
                  {canFull && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCompanyToDelete(company);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('insuranceProducts.deleteCompany')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.areYouSure')} {companyToDelete?.nameEn}?
              <br />
              {t('common.thisActionCannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
