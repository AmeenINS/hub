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
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  User,
  Building2,
  Edit,
  Trash2,
  ArrowRight,
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
import { usePermissionLevel } from "@/shared/hooks/use-permission-level";
import { apiClient, getErrorMessage } from "@/core/api/client";
import { Lead } from "@/shared/types/database";
import { toast } from "sonner";

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "New":
      return "destructive";
    case "Qualified":
      return "default";
    case "Contacted":
      return "secondary";
    case "Nurturing":
      return "outline";
    case "Meeting Scheduled":
      return "default";
    default:
      return "outline";
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('leads');

  // Fetch leads from database
  useEffect(() => {
    const fetchLeads = async () => {
      if (!canView) return;
      
      try {
        setIsLoadingData(true);
        const response = await apiClient.get<Lead[]>('/api/crm/leads');
        if (response.success && response.data) {
          setLeads(response.data);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load leads'));
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!isLoading && canView) {
      fetchLeads();
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

  // Check if user has at least READ permission for Leads
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
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage and nurture your sales leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard/crm/leads/import">
                  Import Leads
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/crm/leads/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Link>
              </Button>
            </>
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
                placeholder="Search leads..."
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

      {/* Lead Pipeline */}
      {leads.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          {["NEW", "QUALIFIED", "CONTACTED", "NEGOTIATING", "CONVERTED"].map((stage) => {
            const stageLeads = leads.filter(lead => lead.status === stage);
            const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
            
            return (
              <Card key={stage}>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-2">{stage}</div>
                  <div className="text-2xl font-bold">{stageLeads.length}</div>
                  <p className="text-xs text-muted-foreground">
                    ${stageValue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Leads List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Leads ({leads.length})</h2>
            {leads.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No leads found</p>
              {canCreate && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/crm/leads/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Lead
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => {
                const leadInitials = lead.title.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                
                return (
                  <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {leadInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium">{lead.title}</h3>
                          <Badge variant={getStatusBadgeVariant(lead.status)}>
                            {lead.status}
                          </Badge>
                        </div>
                        {lead.description && (
                          <p className="text-sm text-muted-foreground">{lead.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>Source: {lead.source}</span>
                          </div>
                          {lead.expectedCloseDate && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Expected: {new Date(lead.expectedCloseDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          {lead.value && (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">${lead.value.toLocaleString()}</span>
                            </div>
                          )}
                          {lead.probability !== undefined && (
                            <div className="flex items-center space-x-2">
                              <span>Probability: {lead.probability}%</span>
                              <Progress value={lead.probability} className="w-16 h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canEdit && (
                        <>
                          <Button variant="outline" size="sm">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Qualify
                          </Button>
                          <Button variant="outline" size="sm">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Convert
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/crm/leads/${lead.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/crm/leads/${lead.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Lead
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {canCreate && (
                            <>
                              <DropdownMenuItem>
                                Add Task
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                Send Email
                              </DropdownMenuItem>
                            </>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Lead
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

      {/* Stats Cards */}
      {leads.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                ${leads.reduce((sum, lead) => sum + (lead.value || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Pipeline Value</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {leads.filter(l => l.probability).length > 0
                  ? Math.round(
                      leads.filter(l => l.probability).reduce((sum, lead) => sum + (lead.probability || 0), 0) /
                      leads.filter(l => l.probability).length
                    )
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Avg. Probability</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {leads.filter(l => l.status === 'CONVERTED').length}
              </div>
              <p className="text-xs text-muted-foreground">Converted Leads</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}