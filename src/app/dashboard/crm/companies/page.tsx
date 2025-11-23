"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Users,
  DollarSign,
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
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
import { Company } from "@/shared/types/database";
import { toast } from "sonner";

// Format currency in OMR
const formatOMR = (amount: number | undefined | null): string => {
  if (!amount) return '0.000 OMR';
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} OMR`;
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Active Customer":
      return "default";
    case "Enterprise Client":
      return "secondary";
    case "Lead":
      return "destructive";
    case "Prospect":
      return "outline";
    default:
      return "outline";
  }
};

export default function CompaniesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('companies');

  // Fetch companies from database
  const fetchCompanies = async () => {
    if (!canView) return;
    
    try {
      setIsLoadingData(true);
      const url = searchQuery 
        ? `/api/crm/companies?search=${encodeURIComponent(searchQuery)}`
        : '/api/crm/companies';
      const response = await apiClient.get<Company[]>(url);
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load companies'));
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading && canView) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        fetchCompanies();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [canView, isLoading, searchQuery]);

  const handleDelete = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete "${companyName}"?`)) return;
    
    try {
      const response = await apiClient.delete(`/api/crm/companies/${companyId}`);
      if (response.success) {
        toast.success('Company deleted successfully');
        fetchCompanies(); // Reload the list
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete company'));
    }
  };

  // Show loading state
  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if user has at least READ permission for Companies
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
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage your client companies and prospects
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/crm/companies/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
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

      {/* Companies Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No companies found</p>
            {canCreate && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/crm/companies/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Company
                </Link>
              </Button>
            )}
          </div>
        ) : (
          companies.map((company) => {
            const location = [company.city, company.state, company.country].filter(Boolean).join(', ');
            const companyInitials = company.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            
            return (
              <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/crm/companies/${company.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={company.logoUrl} alt={company.name} />
                        <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {companyInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                        {company.industry && (
                          <p className="text-sm text-muted-foreground">{company.industry}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/crm/companies/${company.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {company.website && (
                          <DropdownMenuItem asChild>
                            <a href={company.website.includes('://') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Visit Website
                            </a>
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/crm/companies/${company.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Company
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canCreate && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/crm/contacts/new?companyId=${company.id}`}>
                              Add Contact
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(company.id, company.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Company
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Description */}
                  {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {company.description}
                    </p>
                  )}
                  
                  {/* Main Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Company Size */}
                    {company.size && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium">{company.size}</div>
                          <div className="text-xs text-muted-foreground">Employees</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Annual Revenue */}
                    {company.revenue && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium">{formatOMR(company.revenue)}</div>
                          <div className="text-xs text-muted-foreground">Annual Revenue</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Location */}
                  {location && (
                    <div className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded-md">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">{location}</span>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-2 text-sm border-t pt-3">
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">📞</span>
                        <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                          {company.phone}
                        </a>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">📧</span>
                        <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                          {company.email}
                        </a>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">🌐</span>
                        <a 
                          href={company.website.includes('://') ? company.website : `https://${company.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/crm/contacts?companyId=${company.id}`}>
                        View Contacts
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/crm/deals?companyId=${company.id}`}>
                        View Deals
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Stats Cards */}
      {companies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground">Total Companies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {companies.filter(c => c.industry).length}
              </div>
              <p className="text-xs text-muted-foreground">With Industry</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {companies.filter(c => c.website).length}
              </div>
              <p className="text-xs text-muted-foreground">With Website</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {formatOMR(companies.reduce((sum, c) => sum + (c.revenue || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}