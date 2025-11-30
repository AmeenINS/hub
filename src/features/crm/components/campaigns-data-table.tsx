"use client";

import * as React from "react";
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
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { useI18n } from "@/shared/i18n/i18n-context";
import { Campaign, CampaignType, CampaignStatus } from "@/shared/types/database";
import { Mail, MessageSquare, Share2, Users, Target } from "lucide-react";

interface CampaignsDataTableProps {
  data: Campaign[];
}

export function CampaignsDataTable({ data }: CampaignsDataTableProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const getCampaignIcon = React.useCallback((type: CampaignType) => {
    switch (type) {
      case CampaignType.EMAIL:
        return <Mail className="h-4 w-4" />;
      case CampaignType.SMS:
        return <MessageSquare className="h-4 w-4" />;
      case CampaignType.SOCIAL_MEDIA:
        return <Share2 className="h-4 w-4" />;
      case CampaignType.EVENT:
        return <Users className="h-4 w-4" />;
      case CampaignType.WEBINAR:
        return <Users className="h-4 w-4" />;
      case CampaignType.ADVERTISING:
        return <Target className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  }, []);

  const getStatusBadge = React.useCallback((status: CampaignStatus) => {
    const variants: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "outline",
      SCHEDULED: "secondary",
      ACTIVE: "default",
      PAUSED: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    };
    return (
      <Badge variant={variants[status]}>
        {t(`crm.campaigns.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}
      </Badge>
    );
  }, [t]);

  const formatCurrency = React.useCallback((value: number | undefined) => {
    if (!value) return locale === "ar" ? "ر.ع 0" : "0 OMR";
    const formatted = value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    return locale === "ar" ? `${formatted} ر.ع` : `${formatted} OMR`;
  }, [locale]);

  const formatDate = React.useCallback((date: string | Date | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }, []);

  const calculateROI = React.useCallback((campaign: Campaign) => {
    if (!campaign.actualCost || campaign.actualCost === 0) return 0;
    const revenue = campaign.metrics?.revenue || 0;
    const cost = campaign.actualCost;
    return ((revenue - cost) / cost) * 100;
  }, []);

  const columns: ColumnDef<Campaign>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("crm.campaigns.name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{campaign.name}</span>
            {campaign.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: t("crm.campaigns.type"),
      cell: ({ row }) => {
        const type = row.getValue("type") as CampaignType;
        return (
          <div className="flex items-center gap-2">
            {getCampaignIcon(type)}
            <span className="text-sm">
              {t(`crm.campaigns.type${type.charAt(0) + type.slice(1).toLowerCase()}`)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: t("crm.campaigns.status"),
      cell: ({ row }) => getStatusBadge(row.getValue("status") as CampaignStatus),
    },
    {
      accessorKey: "budget",
      header: t("crm.campaigns.budget"),
      cell: ({ row }) => formatCurrency(row.getValue("budget") as number),
    },
    {
      accessorKey: "metrics.leads",
      header: t("crm.campaigns.leads"),
      cell: ({ row }) => row.original.metrics?.leads || 0,
    },
    {
      id: "roi",
      header: t("crm.campaigns.roi"),
      cell: ({ row }) => {
        const roi = calculateROI(row.original);
        return (
          <span className={roi >= 0 ? "text-green-600" : "text-red-600"}>
            {roi.toFixed(1)}%
          </span>
        );
      },
    },
    {
      accessorKey: "startDate",
      header: t("crm.campaigns.startDate"),
      cell: ({ row }) => formatDate(row.getValue("startDate")),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const campaign = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/crm/campaigns/${campaign.id}`)}>
                {t("crm.viewDetails")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, locale, router, getCampaignIcon, getStatusBadge, formatCurrency, formatDate, calculateROI]);

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
          placeholder={t("crm.campaigns.campaignsSearchPlaceholder")}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t("common.columns")} <ChevronDown className="ml-2 h-4 w-4" />
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
                    data-state={row.getIsSelected() && "selected"}
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
                    {t("crm.campaigns.noCampaigns")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} {t("common.of")} {table.getFilteredRowModel().rows.length} {t("common.rowsSelected")}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">{t("common.rowsPerPage")}</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-background"
              aria-label={t("common.rowsPerPage")}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {t("common.page")} {table.getState().pagination.pageIndex + 1} {t("common.of")} {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
