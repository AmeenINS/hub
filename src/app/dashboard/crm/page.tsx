"use client";

import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { 
  Users, 
  Building2, 
  Target, 
  Handshake, 
  DollarSign,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Plus,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { usePermissionLevel } from "@/shared/hooks/use-permission-level";
import { useI18n } from "@/shared/hooks/use-i18n";



// Mock data for demonstration
const stats = [
  {
    title: "Total Contacts",
    value: "2,847",
    change: "+12%",
    icon: Users,
    color: "text-blue-600"
  },
  {
    title: "Active Deals",
    value: "143",
    change: "+8%",
    icon: Handshake,
    color: "text-green-600"
  },
  {
    title: "Monthly Revenue",
    value: "$284,900",
    change: "+23%",
    icon: DollarSign,
    color: "text-emerald-600"
  },
  {
    title: "Conversion Rate",
    value: "24.5%",
    change: "+4%",
    icon: TrendingUp,
    color: "text-purple-600"
  }
];

const recentDeals = [
  {
    id: 1,
    title: "Enterprise Software License",
    company: "TechCorp Inc.",
    value: "$45,000",
    stage: "Negotiation",
    probability: 75,
    daysLeft: 12
  },
  {
    id: 2,
    title: "Cloud Migration Project",
    company: "StartupXYZ",
    value: "$28,500",
    stage: "Proposal",
    probability: 60,
    daysLeft: 8
  },
  {
    id: 3,
    title: "Annual Support Contract",
    company: "BigCorp Ltd.",
    value: "$120,000",
    stage: "Closed Won",
    probability: 100,
    daysLeft: 0
  }
];

const recentActivities = [
  {
    id: 1,
    type: "call",
    description: "Called John Smith from TechCorp",
    time: "2 hours ago",
    icon: Phone
  },
  {
    id: 2,
    type: "email",
    description: "Sent proposal to StartupXYZ",
    time: "4 hours ago",
    icon: Mail
  },
  {
    id: 3,
    type: "meeting",
    description: "Meeting with BigCorp team",
    time: "1 day ago",
    icon: Calendar
  }
];

export default function CRMDashboard() {
  const { canView, isLoading } = usePermissionLevel('crm');
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('crm.crmDashboard')}</h1>
          <p className="text-muted-foreground">
            {t('crm.crmDashboardDescription')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/crm/leads/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.addLead')}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/crm/contacts/new">
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.addContact')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Deals</CardTitle>
                <CardDescription>
                  Track your sales pipeline progress
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/crm/deals">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDeals.map((deal) => (
              <div key={deal.id} className="flex items-center space-x-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {deal.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {deal.company}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={deal.stage === "Closed Won" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {deal.stage}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {deal.daysLeft > 0 ? `${deal.daysLeft} days left` : "Closed"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Probability</span>
                      <span>{deal.probability}%</span>
                    </div>
                    <Progress value={deal.probability} className="h-1" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{deal.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Your latest customer interactions
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="rounded-full bg-muted p-2">
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/dashboard/crm/contacts">
            <CardContent className="flex items-center space-x-4 p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">{t('common.contacts')}</h3>
                <p className="text-sm text-muted-foreground">{t('crm.manageContacts')}</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/dashboard/crm/companies">
            <CardContent className="flex items-center space-x-4 p-6">
              <Building2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">{t('common.companies')}</h3>
                <p className="text-sm text-muted-foreground">{t('crm.companyDatabase')}</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/dashboard/crm/leads">
            <CardContent className="flex items-center space-x-4 p-6">
              <Target className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-semibold">{t('common.leads')}</h3>
                <p className="text-sm text-muted-foreground">{t('crm.leadManagement')}</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/dashboard/crm/deals">
            <CardContent className="flex items-center space-x-4 p-6">
              <Handshake className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">{t('common.deals')}</h3>
                <p className="text-sm text-muted-foreground">{t('crm.salesPipeline')}</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <Link href="/dashboard/crm/activities">
            <CardContent className="flex items-center space-x-4 p-6">
              <Calendar className="h-8 w-8 text-cyan-600" />
              <div>
                <h3 className="font-semibold">{t('common.activities')}</h3>
                <p className="text-sm text-muted-foreground">{t('crm.trackActivities')}</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}