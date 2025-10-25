import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Send,
  Users,
  Mail,
  Eye,
  MousePointer,
  TrendingUp,
  Calendar,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy
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
  title: "Marketing Campaigns - CRM",
  description: "Manage your marketing campaigns and track performance"
};

// Mock data for demonstration
const campaigns = [
  {
    id: 1,
    name: "Q1 Product Launch",
    type: "Email",
    status: "Active",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    budget: 15000,
    spent: 8500,
    audienceSize: 2847,
    sent: 2500,
    delivered: 2456,
    opened: 1234,
    clicked: 567,
    conversions: 89,
    revenue: 125000,
    openRate: 50.2,
    clickRate: 23.1,
    conversionRate: 15.7
  },
  {
    id: 2,
    name: "Summer Sale 2024",
    type: "Multi-channel",
    status: "Scheduled",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    budget: 25000,
    spent: 0,
    audienceSize: 4521,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    conversions: 0,
    revenue: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0
  },
  {
    id: 3,
    name: "Customer Retention",
    type: "Email",
    status: "Completed",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    budget: 8000,
    spent: 7800,
    audienceSize: 1245,
    sent: 1200,
    delivered: 1185,
    opened: 890,
    clicked: 345,
    conversions: 124,
    revenue: 89000,
    openRate: 75.1,
    clickRate: 38.8,
    conversionRate: 35.9
  },
  {
    id: 4,
    name: "New Feature Announcement",
    type: "Social Media",
    status: "Draft",
    startDate: "2024-02-01",
    endDate: "2024-02-28",
    budget: 12000,
    spent: 0,
    audienceSize: 8934,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    conversions: 0,
    revenue: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0
  },
  {
    id: 5,
    name: "Holiday Promotion",
    type: "Email",
    status: "Paused",
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    budget: 20000,
    spent: 15600,
    audienceSize: 3456,
    sent: 3200,
    delivered: 3145,
    opened: 1876,
    clicked: 734,
    conversions: 198,
    revenue: 156000,
    openRate: 59.6,
    clickRate: 39.1,
    conversionRate: 27.0
  }
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Active":
      return "default";
    case "Completed":
      return "secondary";
    case "Scheduled":
      return "outline";
    case "Draft":
      return "outline";
    case "Paused":
      return "destructive";
    default:
      return "outline";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "Email":
      return "text-blue-600";
    case "Social Media":
      return "text-purple-600";
    case "Multi-channel":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground">
            Create, manage and track your marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/crm/campaigns/templates">
              Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/crm/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
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
                placeholder="Search campaigns..."
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

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">Total Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === "Active").length}
            </div>
            <p className="text-xs text-muted-foreground">Active Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              ${campaigns.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.conversions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Campaigns</CardTitle>
              <CardDescription>
                Manage and monitor your marketing campaigns
              </CardDescription>
            </div>
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
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <span className={`text-sm font-medium ${getTypeColor(campaign.type)}`}>
                        {campaign.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{campaign.audienceSize.toLocaleString()} contacts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {campaign.status === "Active" && (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === "Paused" && (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {campaign.status === "Draft" && (
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Launch
                      </Button>
                    )}
                    
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
                          Edit Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Campaign Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Budget</div>
                    <div className="font-medium">${campaign.budget.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      Spent: ${campaign.spent.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Delivered</div>
                    <div className="font-medium">{campaign.delivered.toLocaleString()}</div>
                    <div className="text-xs text-green-600">
                      {campaign.sent > 0 ? `${((campaign.delivered / campaign.sent) * 100).toFixed(1)}%` : '0%'} delivery rate
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Opened</div>
                    <div className="font-medium">{campaign.opened.toLocaleString()}</div>
                    <div className="text-xs text-blue-600">
                      {campaign.openRate.toFixed(1)}% open rate
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Clicked</div>
                    <div className="font-medium">{campaign.clicked.toLocaleString()}</div>
                    <div className="text-xs text-purple-600">
                      {campaign.clickRate.toFixed(1)}% click rate
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Conversions</div>
                    <div className="font-medium">{campaign.conversions.toLocaleString()}</div>
                    <div className="text-xs text-orange-600">
                      {campaign.conversionRate.toFixed(1)}% conversion rate
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Revenue</div>
                    <div className="font-medium text-green-600">${campaign.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      ROI: {campaign.spent > 0 ? `${(((campaign.revenue - campaign.spent) / campaign.spent) * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Performance Progress Bars */}
                {campaign.status !== "Draft" && campaign.status !== "Scheduled" && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Open Rate</span>
                        <span>{campaign.openRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={campaign.openRate} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Click Rate</span>
                        <span>{campaign.clickRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={campaign.clickRate} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Conversion Rate</span>
                        <span>{campaign.conversionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={campaign.conversionRate} className="h-2" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Overview of campaign metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Open Rate</span>
                <span className="font-semibold">
                  {(campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Click Rate</span>
                <span className="font-semibold">
                  {(campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Conversion Rate</span>
                <span className="font-semibold">
                  {(campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total ROI</span>
                <span className="font-semibold text-green-600">
                  {(() => {
                    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
                    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
                    return totalSpent > 0 ? `${(((totalRevenue - totalSpent) / totalSpent) * 100).toFixed(0)}%` : 'N/A';
                  })()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest campaign activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <div>
                  <p className="text-sm font-medium">Q1 Product Launch completed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <div>
                  <p className="text-sm font-medium">Summer Sale 2024 scheduled</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-orange-600" />
                <div>
                  <p className="text-sm font-medium">Holiday Promotion paused</p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-purple-600" />
                <div>
                  <p className="text-sm font-medium">New Feature Announcement created</p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}