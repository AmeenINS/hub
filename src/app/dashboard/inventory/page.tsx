'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Package, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useModulePermissions } from '@/hooks/use-permissions';

export default function InventoryPage() {
  const router = useRouter();
  const { permissions, isLoading } = useModulePermissions('inventory');

  const products = [
    { id: '1', name: 'Office Chairs', sku: 'CHR-001', quantity: 45, minStock: 20, status: 'In Stock' },
    { id: '2', name: 'Desks', sku: 'DSK-001', quantity: 12, minStock: 15, status: 'Low Stock' },
    { id: '3', name: 'Laptops', sku: 'LPT-001', quantity: 8, minStock: 10, status: 'Low Stock' },
    { id: '4', name: 'Monitors', sku: 'MON-001', quantity: 25, minStock: 20, status: 'In Stock' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">You do not have permission to view inventory</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">Manage products and stock levels</p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => router.push('/dashboard/inventory/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.status === 'Low Stock').length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/dashboard/inventory/${product.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>SKU: {product.sku}</CardDescription>
                </div>
                <Badge variant={product.status === 'Low Stock' ? 'destructive' : 'default'}>
                  {product.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Quantity: </span>
                  <span className="font-medium">{product.quantity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Stock: </span>
                  <span className="font-medium">{product.minStock}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
