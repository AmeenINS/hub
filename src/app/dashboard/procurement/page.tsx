'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useModulePermissions } from '@/shared/hooks/use-permissions';

export default function ProcurementPage() {
  const router = useRouter();
  const { permissions, isLoading } = useModulePermissions('procurement');

  const purchaseOrders = [
    { id: '1', poNumber: 'PO-2024-001', vendor: 'Tech Supplies Co.', amount: 12500, status: 'Pending', date: '2024-01-15' },
    { id: '2', poNumber: 'PO-2024-002', vendor: 'Office Furniture Ltd.', amount: 8900, status: 'Approved', date: '2024-01-14' },
    { id: '3', poNumber: 'PO-2024-003', vendor: 'Computer Systems Inc.', amount: 25000, status: 'Rejected', date: '2024-01-13' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">You do not have permission to view procurement</p>
      </div>
    );
  }

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

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Procurement</h2>
          <p className="text-muted-foreground">Manage purchase orders and vendors</p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => router.push('/dashboard/procurement/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOrders.filter(po => po.status === 'Pending').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">OMR {purchaseOrders.reduce((sum, po) => sum + po.amount, 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {purchaseOrders.map((po) => (
          <Card
            key={po.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/dashboard/procurement/${po.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{po.poNumber}</CardTitle>
                  <CardDescription>{po.vendor}</CardDescription>
                </div>
                <Badge variant={po.status === 'Approved' ? 'default' : po.status === 'Rejected' ? 'destructive' : 'secondary'}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(po.status)}
                    {po.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount: </span>
                  <span className="font-medium">OMR {po.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-medium">{po.date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
