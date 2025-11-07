'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Workflow, CheckCircle, Clock, PlayCircle } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useModulePermissions } from '@/shared/hooks/use-permissions';

export default function WorkflowsPage() {
  const router = useRouter();
  const { permissions, isLoading } = useModulePermissions('workflows');

  const workflows = [
    { id: '1', name: 'Leave Approval', trigger: 'Manual', status: 'Active', executions: 45, lastRun: '2024-01-15' },
    { id: '2', name: 'Expense Approval', trigger: 'Automatic', status: 'Active', executions: 128, lastRun: '2024-01-15' },
    { id: '3', name: 'Document Review', trigger: 'Manual', status: 'Draft', executions: 0, lastRun: '-' },
    { id: '4', name: 'Purchase Order Approval', trigger: 'Automatic', status: 'Active', executions: 34, lastRun: '2024-01-14' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">You do not have permission to view workflows</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    return status === 'Active' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <Clock className="h-4 w-4 text-gray-500" />
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
          <p className="text-muted-foreground">Automate business processes and approvals</p>
        </div>
        {permissions.canCreate && (
          <Button onClick={() => router.push('/dashboard/workflows/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.status === 'Active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.reduce((sum, w) => sum + w.executions, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card
            key={workflow.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/dashboard/workflows/${workflow.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{workflow.name}</CardTitle>
                  <CardDescription>Trigger: {workflow.trigger}</CardDescription>
                </div>
                <Badge variant={workflow.status === 'Active' ? 'default' : 'secondary'}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(workflow.status)}
                    {workflow.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Executions: </span>
                  <span className="font-medium">{workflow.executions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Run: </span>
                  <span className="font-medium">{workflow.lastRun}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
