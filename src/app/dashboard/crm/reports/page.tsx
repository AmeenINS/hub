import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";

export const metadata: Metadata = {
  title: "CRM Reports - Analytics Dashboard",
  description: "Comprehensive CRM analytics and reporting"
};

// Mock data for demonstration
const salesMetrics = {
  totalRevenue: 1284900,
  monthlyGrowth: 23.5,
  dealsWon: 47,
  conversionRate: 24.5,
  avgDealSize: 27337,
  salesCycle: 34
};

const pipelineData = [
  { stage: "Discovery", count: 15, value: 375000, color: "bg-gray-500" },
  { stage: "Qualification", count: 23, value: 650000, color: "bg-blue-500" },
  { stage: "Proposal", count: 18, value: 890000, color: "bg-yellow-500" },
  { stage: "Negotiation", count: 12, value: 980000, color: "bg-orange-500" },
  { stage: "Closed Won", count: 8, value: 560000, color: "bg-green-500" }
];

const topPerformers = [
  { name: "Sarah Johnson", deals: 12, revenue: 380000, avatar: "/avatars/sarah.jpg" },
  { name: "David Wilson", deals: 10, revenue: 285000, avatar: "/avatars/david.jpg" },
  { name: "Alex Thompson", deals: 8, revenue: 195000, avatar: "/avatars/alex.jpg" },
  { name: "Lisa Chen", deals: 7, revenue: 165000, avatar: "/avatars/lisa.jpg" },
  { name: "James Wilson", deals: 6, revenue: 145000, avatar: "/avatars/james.jpg" }
];

const revenueByMonth = [
  { month: "Jan", revenue: 85000, deals: 12 },
  { month: "Feb", revenue: 92000, deals: 15 },
  { month: "Mar", revenue: 78000, deals: 11 },
  { month: "Apr", revenue: 105000, deals: 18 },
  { month: "May", revenue: 125000, deals: 22 },
  { month: "Jun", revenue: 148000, deals: 26 }
];

const leadSources = [
  { source: "Website", count: 145, percentage: 32.2 },
  { source: "Referral", count: 98, percentage: 21.8 },
  { source: "LinkedIn", count: 87, percentage: 19.3 },
  { source: "Cold Email", count: 65, percentage: 14.4 },
  { source: "Trade Show", count: 35, percentage: 7.8 },
  { source: "Other", count: 20, percentage: 4.4 }
];

export default function CRMReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your sales performance and pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesMetrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{salesMetrics.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesMetrics.dealsWon}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesMetrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Lead to customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesMetrics.avgDealSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per closed deal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Cycle</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesMetrics.salesCycle} days</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pipelineData.reduce((sum, stage) => sum + stage.value, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total pipeline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline Analysis</CardTitle>
            <CardDescription>
              Deal distribution across pipeline stages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelineData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="font-medium">{stage.stage}</span>
                    <Badge variant="secondary">{stage.count} deals</Badge>
                  </div>
                  <span className="font-semibold">${stage.value.toLocaleString()}</span>
                </div>
                <Progress 
                  value={((stage.value / 2500000) * 100)} 
                  className="h-2" 
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Sales team performance this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">{performer.deals} deals closed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${performer.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Monthly revenue and deals closed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByMonth.map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{month.month} 2024</span>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{month.deals} deals</Badge>
                      <span className="font-semibold">${month.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <Progress 
                    value={((month.revenue / 150000) * 100)} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>
              Where your leads are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadSources.map((source) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{source.source}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{source.count} leads</span>
                      <span className="font-semibold">{source.percentage}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={source.percentage} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>
            Recent CRM activities and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">247</div>
              <p className="text-sm text-muted-foreground">Calls Made</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">189</div>
              <p className="text-sm text-muted-foreground">Emails Sent</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">73</div>
              <p className="text-sm text-muted-foreground">Meetings Held</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">34</div>
              <p className="text-sm text-muted-foreground">Proposals Sent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Forecast</CardTitle>
          <CardDescription>
            Projected revenue and deals for next quarter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">Conservative Forecast</h3>
              <div className="text-2xl font-bold text-gray-600">$890K</div>
              <p className="text-sm text-muted-foreground">32 deals (75% probability)</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Most Likely</h3>
              <div className="text-2xl font-bold text-blue-600">$1.2M</div>
              <p className="text-sm text-muted-foreground">45 deals (50% probability)</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Optimistic Forecast</h3>
              <div className="text-2xl font-bold text-green-600">$1.8M</div>
              <p className="text-sm text-muted-foreground">68 deals (25% probability)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}