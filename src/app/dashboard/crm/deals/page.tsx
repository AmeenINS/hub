"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Handshake,
  DollarSign,
  Calendar,
  User,
  Building2,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  FileText,
  Loader2
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useModuleVisibility } from "@/shared/hooks/use-module-visibility";
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { apiClient, getErrorMessage } from "@/core/api/client";
import { Deal } from "@/shared/types/database";
import { toast } from "sonner";

const stages = [
  { name: "DISCOVERY", color: "bg-gray-500", display: "Discovery" },
  { name: "QUALIFICATION", color: "bg-blue-500", display: "Qualification" },
  { name: "PROPOSAL", color: "bg-yellow-500", display: "Proposal" },
  { name: "NEGOTIATION", color: "bg-orange-500", display: "Negotiation" },
  { name: "CLOSED_WON", color: "bg-green-500", display: "Closed Won" },
  { name: "CLOSED_LOST", color: "bg-red-500", display: "Closed Lost" }
];

const getStatusBadgeVariant = (stage: string) => {
  switch (stage) {
    case "DISCOVERY":
      return "secondary";
    case "QUALIFICATION":
      return "outline";
    case "PROPOSAL":
      return "default";
    case "NEGOTIATION":
      return "secondary";
    case "CLOSED_WON":
      return "default";
    case "CLOSED_LOST":
      return "destructive";
    default:
      return "outline";
  }
};

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('deals');

  // Fetch deals from database
  useEffect(() => {
    const fetchDeals = async () => {
      if (!canView) return;
      
      try {
        setIsLoadingData(true);
        const response = await apiClient.get<Deal[]>('/api/crm/deals');
        if (response.success && response.data) {
          setDeals(response.data);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load deals'));
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!isLoading && canView) {
      fetchDeals();
    }
  }, [canView, isLoading]);

  // Show loading state
  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user has at least READ permission for Deals
  if (!canView) {
    return null;
  }

  const canCreate = canWrite;
  const canEdit = canWrite;
  const canDelete = canFull;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track deal progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/crm/deals/pipeline">
              View Pipeline
            </Link>
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href="/dashboard/crm/deals/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        {stages.map((stage) => {
          const stageDeals = deals.filter(deal => deal.stage === stage.name);
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
          
          return (
            <Card key={stage.name}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <div className="text-sm font-medium">{stage.display}</div>
                </div>
                <div className="text-2xl font-bold">{stageDeals.length}</div>
                <p className="text-xs text-muted-foreground">
                  ${stageValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Deals List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Deals ({deals.length})</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button variant="outline" size="sm">
                Forecast
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No deals found</p>
              {canCreate && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/crm/deals/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Deal
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => {
                const dealInitials = deal.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                
                return (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {dealInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium">{deal.name}</h3>
                          <Badge variant={getStatusBadgeVariant(deal.stage)}>
                            {deal.stage}
                          </Badge>
                          <div className="text-sm font-medium text-green-600">
                            ${deal.value.toLocaleString()}
                          </div>
                        </div>
                        {deal.description && (
                          <p className="text-sm text-muted-foreground">{deal.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {deal.expectedCloseDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <span>Probability: {deal.probability}%</span>
                            <Progress value={deal.probability} className="w-20 h-2" />
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Created: {new Date(deal.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Update Stage
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/crm/deals/${deal.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/crm/deals/${deal.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Deal
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {canCreate && (
                            <>
                              <DropdownMenuItem>
                                Add Activity
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Clone Deal
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Deal
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground">Total Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              ${deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Pipeline Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              ${deals.filter(d => d.stage === "CLOSED_WON").reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Won This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Avg. Win Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}