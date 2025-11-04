import { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const metadata: Metadata = {
  title: "Companies - CRM",
  description: "Manage your client companies"
};

// Mock data for demonstration
const companies = [
  {
    id: 1,
    name: "TechCorp Inc.",
    industry: "Technology",
    size: "500-1000",
    revenue: "$50M",
    location: "San Francisco, CA",
    status: "Active Customer",
    contacts: 15,
    deals: 3,
    logo: undefined, // Logo files don't exist yet
    website: "www.techcorp.com",
    description: "Leading technology solutions provider"
  },
  {
    id: 2,
    name: "StartupXYZ",
    industry: "SaaS",
    size: "50-100",
    revenue: "$5M",
    location: "Austin, TX",
    status: "Prospect",
    contacts: 8,
    deals: 1,
    logo: undefined, // Logo files don't exist yet
    website: "www.startupxyz.com",
    description: "Innovative SaaS startup disrupting the market"
  },
  {
    id: 3,
    name: "BigCorp Ltd.",
    industry: "Manufacturing",
    size: "1000+",
    revenue: "$200M",
    location: "Chicago, IL",
    status: "Enterprise Client",
    contacts: 45,
    deals: 8,
    logo: undefined, // Logo files don't exist yet
    website: "www.bigcorp.com",
    description: "Global manufacturing and distribution company"
  },
  {
    id: 4,
    name: "Innovate Solutions",
    industry: "Consulting",
    size: "100-500",
    revenue: "$25M",
    location: "New York, NY",
    status: "Lead",
    contacts: 12,
    deals: 2,
    logo: undefined, // Logo files don't exist yet
    website: "www.innovatesolutions.com",
    description: "Strategic consulting and digital transformation"
  },
  {
    id: 5,
    name: "FutureTech",
    industry: "AI/ML",
    size: "200-500",
    revenue: "$15M",
    location: "Seattle, WA",
    status: "Active Customer",
    contacts: 20,
    deals: 4,
    logo: undefined, // Logo files don't exist yet
    website: "www.futuretech.ai",
    description: "Artificial Intelligence and Machine Learning solutions"
  }
];

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
        <Button asChild>
          <Link href="/dashboard/crm/companies/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Link>
        </Button>
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
        {companies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={company.logo} alt={company.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {company.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
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
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Company
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Website
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Add Contact
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Company
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3">
                <Badge variant={getStatusBadgeVariant(company.status)}>
                  {company.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {company.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{company.size} employees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{company.revenue}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{company.location}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  {company.contacts} contacts
                </div>
                <div className="text-sm text-muted-foreground">
                  {company.deals} active deals
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/crm/companies/${company.id}/contacts`}>
                    View Contacts
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/crm/companies/${company.id}/deals`}>
                    View Deals
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Total Companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Active Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">Prospects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">$2.4M</div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}