'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal, Calendar, Phone, Mail, Users, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { useI18n } from '@/shared/i18n/i18n-context';
import { Activity, ActivityType, ActivityStatus } from '@/shared/types/database';

interface ActivitiesDataTableProps {
  data: Activity[];
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export function ActivitiesDataTable({ data, onEdit, onDelete }: ActivitiesDataTableProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />;
      case 'MEETING': return <Users className="h-4 w-4" />;
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'TASK': return <CheckCircle2 className="h-4 w-4" />;
      case 'NOTE': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const variants: Record<ActivityStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [ActivityStatus.PLANNED]: 'default',
      [ActivityStatus.IN_PROGRESS]: 'secondary',
      [ActivityStatus.COMPLETED]: 'outline',
      [ActivityStatus.CANCELLED]: 'destructive'
    };

    return (
      <Badge variant={variants[status]}>
        {t(`crm.activities.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
      </Badge>
    );
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (activity: Activity) => {
    if (!activity.startDate || activity.status !== ActivityStatus.PLANNED) return false;
    return new Date(activity.startDate) < new Date();
  };

  const columns: ColumnDef<Activity>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('crm.activities.type')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const type = row.getValue('type') as ActivityType;
        return (
          <div className="flex items-center gap-2">
            {getActivityIcon(type)}
            <span className="font-medium">
              {t(`crm.activities.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'subject',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('crm.activities.subject')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{activity.subject}</span>
            {activity.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {activity.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('crm.activities.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as ActivityStatus;
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('crm.activities.scheduledAt')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const activity = row.original;
        const overdue = isOverdue(activity);
        return (
          <div className="flex items-center gap-2">
            <span className={overdue ? 'text-destructive font-medium' : ''}>
              {formatDate(activity.startDate)}
            </span>
            {overdue && (
              <Badge variant="destructive" className="text-xs">
                {t('crm.activities.overdue')}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'relatedTo',
      header: t('crm.activities.relatedTo'),
      cell: ({ row }) => {
        const activity = row.original;
        
        if (activity.leadId) {
          return (
            <Badge variant="outline" className="gap-1">
              {t('crm.activities.lead')}
            </Badge>
          );
        }
        if (activity.dealId) {
          return (
            <Badge variant="outline" className="gap-1">
              {t('crm.activities.deal')}
            </Badge>
          );
        }
        if (activity.contactId) {
          return (
            <Badge variant="outline" className="gap-1">
              {t('crm.activities.contact')}
            </Badge>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'assignedTo',
      header: t('crm.activities.assignedTo'),
      cell: ({ row }) => {
        const activity = row.original;
        return activity.assignedTo ? (
          <span className="text-sm">{activity.assignedTo}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const activity = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => router.push(`/dashboard/crm/activities/${activity.id}`)}
              >
                {t('crm.viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(activity)}>
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(activity)}
                className="text-destructive"
              >
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder={t('crm.activities.activitiesSearchPlaceholder')}
          value={(table.getColumn('subject')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('subject')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t('common.columns')} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t('crm.activities.noActivities')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} {t('common.of')}{' '}
          {table.getFilteredRowModel().rows.length} {t('common.rowsSelected')}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">{t('common.rowsPerPage')}</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-background"
              aria-label={t('common.rowsPerPage')}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {t('common.page')} {table.getState().pagination.pageIndex + 1} {t('common.of')}{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
