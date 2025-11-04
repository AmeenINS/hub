'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n/i18n-context';
import { useModulePermissions } from '@/hooks/use-permissions';

export default function ClaimsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { permissions, isLoading } = useModulePermissions('claims');

  const [searchQuery, setSearchQuery] = React.useState('');

  // Mock data
  const claims = [
    {
      id: '1',
      claimNumber: 'CLM-2025-001',
      policyNumber: 'POL-2025-001',
      claimant: 'Ahmed Al Habsi',
      type: 'Medical',
      amount: 2500,
      status: 'Pending',
      submittedDate: '2025-11-01',
    },
    {
      id: '2',
      claimNumber: 'CLM-2025-002',
      policyNumber: 'POL-2025-002',
      claimant: 'Sara Al Balushi',
      type: 'Accident',
      amount: 5000,
      status: 'Approved',
      submittedDate: '2025-10-28',
    },
    {
      id: '3',
      claimNumber: 'CLM-2025-003',
      policyNumber: 'POL-2025-003',
      claimant: 'Mohammed Al Hinai',
      type: 'Hospitalization',
      amount: 8000,
      status: 'Rejected',
      submittedDate: '2025-10-25',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">You do not have permission to view claims</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Claims</h2>
          <p className="text-muted-foreground">Manage insurance claims</p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => router.push('/dashboard/claims/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search claims..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {claims.map((claim) => (
          <Card
            key={claim.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/dashboard/claims/${claim.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{claim.claimNumber}</CardTitle>
                <Badge variant={getStatusVariant(claim.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(claim.status)}
                    <span>{claim.status}</span>
                  </div>
                </Badge>
              </div>
              <CardDescription>{claim.claimant}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{claim.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>OMR {claim.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Submitted: {claim.submittedDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
