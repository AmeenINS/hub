import { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  FileText
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
  title: "Deals - CRM",
  description: "Manage your sales deals and pipeline"
};

// Mock data for demonstration
const deals = [
  {
    id: 1,
    title: "Enterprise Software License",
    company: "TechCorp Inc.",
    contact: "John Smith",
    value: 45000,
    stage: "Negotiation",
    probability: 75,
    expectedCloseDate: "2024-02-15",
    createdDate: "2024-01-01",
    lastActivity: "2024-01-15",
    owner: "Sarah Johnson",
    avatar: "/avatars/john.jpg",
    ownerAvatar: "/avatars/sarah.jpg"
  },
  {
    id: 2,
    title: "Cloud Migration Project",
    company: "StartupXYZ",
    contact: "Mike Chen",
    value: 28500,
    stage: "Proposal",
    probability: 60,
    expectedCloseDate: "2024-02-28",
    createdDate: "2024-01-05",
    lastActivity: "2024-01-14",
    owner: "David Wilson",
    avatar: "/avatars/mike.jpg",
    ownerAvatar: "/avatars/david.jpg"
  },
  {
    id: 3,
    title: "Annual Support Contract",
    company: "BigCorp Ltd.",
    contact: "Emily Davis",
    value: 120000,
    stage: "Closed Won",
    probability: 100,
    expectedCloseDate: "2024-01-30",
    createdDate: "2023-12-15",
    lastActivity: "2024-01-13",
    owner: "Alex Thompson",
    avatar: "/avatars/emily.jpg",
    ownerAvatar: "/avatars/alex.jpg"
  },
  {
    id: 4,
    title: "Marketing Automation Setup",
    company: "Innovate Solutions",
    contact: "Robert Taylor",
    value: 15000,
    stage: "Qualification",
    probability: 40,
    expectedCloseDate: "2024-03-15",
    createdDate: "2024-01-10",
    lastActivity: "2024-01-15",
    owner: "Lisa Chen",
    avatar: "/avatars/robert.jpg",
    ownerAvatar: "/avatars/lisa.jpg"
  },
  {
    id: 5,
    title: "Custom Development Project",
    company: "FutureTech",
    contact: "Maria Garcia",
    value: 85000,
    stage: "Discovery",
    probability: 25,
    expectedCloseDate: "2024-04-01",
    createdDate: "2024-01-12",
    lastActivity: "2024-01-14",
    owner: "James Wilson",
    avatar: "/avatars/maria.jpg",
    ownerAvatar: "/avatars/james.jpg"
  }
];

const stages = [
  { name: "Discovery", color: "bg-gray-500" },
  { name: "Qualification", color: "bg-blue-500" },
  { name: "Proposal", color: "bg-yellow-500" },
  { name: "Negotiation", color: "bg-orange-500" },
  { name: "Closed Won", color: "bg-green-500" },
  { name: "Closed Lost", color: "bg-red-500" }
];

const getStatusBadgeVariant = (stage: string) => {
  switch (stage) {
    case "Discovery":
      return "secondary";
    case "Qualification":
      return "outline";
    case "Proposal":
      return "default";
    case "Negotiation":
      return "secondary";
    case "Closed Won":
      return "default";
    case "Closed Lost":
      return "destructive";
    default:
      return "outline";
  }
};

export default function DealsPage() {
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
          <Button asChild>
            <Link href="/dashboard/crm/deals/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Link>
          </Button>
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
                  <div className="text-sm font-medium">{stage.name}</div>
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
          <div className="space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={deal.avatar} alt={deal.contact} />
                    <AvatarFallback>
                      {deal.contact.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{deal.title}</h3>
                      <Badge variant={getStatusBadgeVariant(deal.stage)}>
                        {deal.stage}
                      </Badge>
                      <div className="text-sm font-medium text-green-600">
                        ${deal.value.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{deal.company}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{deal.contact}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span>Probability: {deal.probability}%</span>
                        <Progress value={deal.probability} className="w-20 h-2" />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={deal.ownerAvatar} alt={deal.owner} />
                          <AvatarFallback className="text-xs">
                            {deal.owner.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{deal.owner}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Last: {new Date(deal.lastActivity).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Update Stage
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Proposal
                  </Button>
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
                        Edit Deal
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Add Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Clone Deal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Deal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
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
              ${deals.filter(d => d.stage === "Closed Won").reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
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