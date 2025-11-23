"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Globe,
  Users,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Briefcase,
  User as UserIcon,
  Calendar,
  Tag
} from "lucide-react";
import Link from "next/link";
import { apiClient, getErrorMessage } from "@/core/api/client";
import { toast } from "sonner";
import { usePermissionLevel } from "@/shared/hooks/use-permission-level";
import { Company, Deal, Contact } from "@/shared/types/database";

export default function CompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { canView, canWrite, canFull, isLoading: permLoading } = usePermissionLevel('companies');

  useEffect(() => {
    const loadData = async () => {
      if (!canView) return;
      
      try {
        setIsLoading(true);
        
        // Load company details
        const companyResponse = await apiClient.get<Company>(`/api/crm/companies/${companyId}`);
        if (companyResponse.success && companyResponse.data) {
          setCompany(companyResponse.data);
        }

        // Load related deals
        const dealsResponse = await apiClient.get<Deal[]>(`/api/crm/deals?companyId=${companyId}`);
        if (dealsResponse.success && dealsResponse.data) {
          setDeals(dealsResponse.data);
        }

        // Load related contacts
        const contactsResponse = await apiClient.get<Contact[]>(`/api/crm/contacts?companyId=${companyId}`);
        if (contactsResponse.success && contactsResponse.data) {
          setContacts(contactsResponse.data);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load company details"));
        router.push("/dashboard/crm/companies");
      } finally {
        setIsLoading(false);
      }
    };

    if (!permLoading) {
      loadData();
    }
  }, [companyId, canView, permLoading, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    
    try {
      const response = await apiClient.delete(`/api/crm/companies/${companyId}`);
      if (response.success) {
        toast.success("Company deleted successfully");
        router.push("/dashboard/crm/companies");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete company"));
    }
  };

  if (permLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView || !company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Company not found or you don't have permission to view it</p>
      </div>
    );
  }

  const location = [company.city, company.state, company.country].filter(Boolean).join(', ');
  const totalDealsValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/crm/companies">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarImage src={company.logoUrl} alt={company.name} />
            <AvatarFallback className="text-xl bg-linear-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {company.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {company.industry && (
                <Badge variant="secondary">{company.industry}</Badge>
              )}
              {company.size && (
                <Badge variant="outline">{company.size} employees</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canWrite && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/crm/companies/${companyId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          {canFull && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{company.description}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {company.industry && (
                  <div className="flex items-start space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-medium">{company.industry}</p>
                    </div>
                  </div>
                )}
                {company.size && (
                  <div className="flex items-start space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company Size</p>
                      <p className="font-medium">{company.size} employees</p>
                    </div>
                  </div>
                )}
                {company.revenue && (
                  <div className="flex items-start space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p className="font-medium">{company.revenue.toLocaleString()} OMR</p>
                    </div>
                  </div>
                )}
                {company.createdAt && (
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created Date</p>
                      <p className="font-medium">{new Date(company.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                )}
              </div>

              {company.tags && company.tags.length > 0 && (
                <div className="flex items-start space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {company.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {location && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    {company.address && <p className="font-medium">{company.address}</p>}
                    <p className="font-medium">{location}</p>
                    {company.zipCode && <p className="text-sm text-muted-foreground">{company.zipCode}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Deals and Contacts */}
          <Tabs defaultValue="deals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deals">
                Deals ({deals.length})
              </TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts ({contacts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deals" className="space-y-4">
              {deals.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No deals found</p>
                    {canWrite && (
                      <Button asChild className="mt-4">
                        <Link href={`/dashboard/crm/deals/new?companyId=${companyId}`}>
                          Create Deal
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {deals.map((deal) => (
                    <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{deal.name}</h3>
                            <p className="text-sm text-muted-foreground">{deal.stage}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {deal.value.toLocaleString()} OMR
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {deal.probability}% probability
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/dashboard/crm/companies/${companyId}/deals`}>
                      View All Deals
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              {contacts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No contacts found</p>
                    {canWrite && (
                      <Button asChild className="mt-4">
                        <Link href={`/dashboard/crm/contacts/new?companyId=${companyId}`}>
                          Add Contact
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">
                              {contact.fullNameEn || `${contact.firstName} ${contact.lastName}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                            {contact.phone && (
                              <p className="text-sm text-muted-foreground">{contact.phone}</p>
                            )}
                          </div>
                          <Badge>{contact.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/dashboard/crm/companies/${companyId}/contacts`}>
                      View All Contacts
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.website && (
                <div className="flex items-start space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a 
                      href={company.website.includes('://') ? company.website : `https://${company.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
              )}

              {company.phone && (
                <div className="flex items-start space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{company.phone}</p>
                  </div>
                </div>
              )}

              {company.email && (
                <div className="flex items-start space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${company.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {company.email}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Logo */}
          {company.logoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Company Logo</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={company.logoUrl} alt={company.name} />
                  <AvatarFallback className="text-4xl bg-linear-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {company.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{contacts.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{deals.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalDealsValue.toLocaleString()} OMR
                </p>
              </div>
              {company.updatedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{new Date(company.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {canWrite && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/crm/contacts/new?companyId=${companyId}`}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Add Contact
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/crm/deals/new?companyId=${companyId}`}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Create Deal
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
