import { Metadata } from "next";
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
  ArrowRight
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

export const metadata: Metadata = {
  title: "Leads - CRM",
  description: "Manage your sales leads"
};

// Mock data for demonstration
const leads = [
  {
    id: 1,
    name: "Alex Thompson",
    email: "alex@newtechstartup.com",
    company: "NewTech Startup",
    source: "Website",
    status: "New",
    score: 85,
    value: "$25,000",
    probability: 60,
    createdAt: "2024-01-15",
    lastActivity: "2024-01-15",
    avatar: "/avatars/alex.jpg"
  },
  {
    id: 2,
    name: "Maria Garcia",
    email: "maria@globalcorp.com", 
    company: "Global Corp",
    source: "Referral",
    status: "Qualified",
    score: 92,
    value: "$75,000",
    probability: 80,
    createdAt: "2024-01-14",
    lastActivity: "2024-01-15",
    avatar: "/avatars/maria.jpg"
  },
  {
    id: 3,
    name: "James Wilson",
    email: "j.wilson@enterprise.com",
    company: "Enterprise Solutions",
    source: "Cold Email",
    status: "Contacted",
    score: 78,
    value: "$150,000",
    probability: 45,
    createdAt: "2024-01-13",
    lastActivity: "2024-01-14",
    avatar: "/avatars/james.jpg"
  },
  {
    id: 4,
    name: "Lisa Chen",
    email: "lisa@innovativetech.com",
    company: "Innovative Tech",
    source: "LinkedIn",
    status: "Nurturing",
    score: 65,
    value: "$40,000",
    probability: 35,
    createdAt: "2024-01-12",
    lastActivity: "2024-01-13",
    avatar: "/avatars/lisa.jpg"
  },
  {
    id: 5,
    name: "Robert Taylor",
    email: "robert@fastgrowth.com",
    company: "Fast Growth Inc",
    source: "Trade Show",
    status: "Meeting Scheduled",
    score: 88,
    value: "$90,000",
    probability: 70,
    createdAt: "2024-01-11",
    lastActivity: "2024-01-15",
    avatar: "/avatars/robert.jpg"
  }
];

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
      <div className="grid gap-4 md:grid-cols-5">
        {["New", "Qualified", "Contacted", "Nurturing", "Meeting Scheduled"].map((stage) => (
          <Card key={stage}>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-2">{stage}</div>
              <div className="text-2xl font-bold">
                {leads.filter(lead => lead.status === stage).length}
              </div>
              <p className="text-xs text-muted-foreground">
                ${leads.filter(lead => lead.status === stage)
                  .reduce((sum, lead) => sum + parseInt(lead.value.replace(/[,$]/g, '')), 0)
                  .toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Leads ({leads.length})</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button variant="outline" size="sm">
                Bulk Actions
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={lead.avatar} alt={lead.name} />
                    <AvatarFallback>
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{lead.name}</h3>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                      <div className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                        Score: {lead.score}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{lead.company}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>Source: {lead.source}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">{lead.value}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Probability: {lead.probability}%</span>
                        <Progress value={lead.probability} className="w-16 h-2" />
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Last: {new Date(lead.lastActivity).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Qualify
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Convert
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
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Add Task
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
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
              ${leads.reduce((sum, lead) => sum + parseInt(lead.value.replace(/[,$]/g, '')), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Pipeline Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(leads.reduce((sum, lead) => sum + lead.probability, 0) / leads.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Avg. Probability</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)}
            </div>
            <p className="text-xs text-muted-foreground">Avg. Lead Score</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}