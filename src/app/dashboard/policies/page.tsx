'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, Calendar, DollarSign } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useI18n } from '@/shared/i18n/i18n-context';
import { useModulePermissions } from '@/shared/hooks/use-permission-level';

export default function PoliciesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { permissions, isLoading } = useModulePermissions('policies');

  const [searchQuery, setSearchQuery] = React.useState('');

  // Mock data - replace with real API call
  const policies = [
    {
      id: '1',
      policyNumber: 'POL-2025-001',
      holderName: 'Ahmed Al Habsi',
      type: 'Health Insurance',
      status: 'Active',
      premium: 5000,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    },
    {
      id: '2',
      policyNumber: 'POL-2025-002',
      holderName: 'Sara Al Balushi',
      type: 'Life Insurance',
      status: 'Pending',
      premium: 8000,
      startDate: '2025-02-01',
      endDate: '2026-01-31',
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">You do not have permission to view policies</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policies</h2>
          <p className="text-muted-foreground">Manage insurance policies</p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => router.push('/dashboard/policies/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {policies.map((policy) => (
          <Card
            key={policy.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/dashboard/policies/${policy.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{policy.policyNumber}</CardTitle>
                <Badge
                  variant={policy.status === 'Active' ? 'default' : 'secondary'}
                >
                  {policy.status}
                </Badge>
              </div>
              <CardDescription>{policy.holderName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{policy.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>OMR {policy.premium.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {policy.startDate} - {policy.endDate}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
