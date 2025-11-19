/**
 * Company Deals Page
 * Display all deals associated with a specific company
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, Loader2, DollarSign, Calendar, User, Briefcase } from 'lucide-react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { toast } from 'sonner';

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  status: string;
  probability: number;
  expectedCloseDate?: string;
  owner?: {
    id: string;
    fullNameEn: string;
  };
  contact?: {
    id: string;
    fullNameEn: string;
  };
}

interface Company {
  id: string;
  name: string;
  industry?: string;
}

const statusColors = {
  OPEN: 'bg-blue-100 text-blue-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
};

export default function CompanyDealsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const companyId = params?.id as string;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load company details
      const companyResponse = await apiClient.get(`/api/crm/companies/${companyId}`);
      if (companyResponse.success) {
        setCompany(companyResponse.data);
      }

      // Load deals for this company
      const dealsResponse = await apiClient.get(`/api/crm/deals?companyId=${companyId}`);
      if (dealsResponse.success) {
        setDeals(dealsResponse.data || []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {company?.name || 'Company Deals'}
          </h1>
          <p className="text-muted-foreground">
            {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
          </p>
        </div>
        {deals.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalValue, deals[0]?.currency || 'USD')}
            </p>
          </div>
        )}
      </div>

      {/* Deals Grid */}
      {deals.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No deals found</h3>
              <p className="text-sm text-muted-foreground">
                This company doesn't have any deals yet.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Card
              key={deal.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/crm/deals/${deal.id}`)}
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold line-clamp-1">
                    {deal.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={statusColors[deal.status as keyof typeof statusColors] || ''}
                  >
                    {deal.status}
                  </Badge>
                </div>

                {/* Value */}
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(deal.value, deal.currency)}
                </div>

                {/* Stage & Probability */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{deal.stage}</span>
                  <span>•</span>
                  <span>{deal.probability}% chance</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t space-y-2">
                {deal.expectedCloseDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Close: {formatDate(deal.expectedCloseDate)}</span>
                  </div>
                )}
                {deal.owner && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{deal.owner.fullNameEn}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
