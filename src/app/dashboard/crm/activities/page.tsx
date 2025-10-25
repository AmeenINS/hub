import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Clock,
  User,
  Building2,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
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
  title: "CRM Activities - Communication Tracking",
  description: "Track and manage customer communications and activities"
};

// Mock data for demonstration
const activities = [
  {
    id: 1,
    type: "email",
    title: "Sent proposal to TechCorp Inc.",
    description: "Enterprise Software License proposal with 20% discount",
    contact: "John Smith",
    company: "TechCorp Inc.",
    status: "completed",
    priority: "high",
    createdAt: "2024-01-15T14:30:00",
    completedAt: "2024-01-15T14:30:00",
    avatar: "/avatars/john.jpg",
    assignee: "Sarah Johnson"
  },
  {
    id: 2,
    type: "call",
    title: "Follow-up call with StartupXYZ",
    description: "Discuss cloud migration timeline and requirements",
    contact: "Mike Chen",
    company: "StartupXYZ",
    status: "scheduled",
    priority: "medium",
    createdAt: "2024-01-15T10:00:00",
    scheduledAt: "2024-01-16T15:00:00",
    avatar: "/avatars/mike.jpg",
    assignee: "David Wilson"
  },
  {
    id: 3,
    type: "meeting",
    title: "Contract negotiation meeting",
    description: "Final contract terms discussion for annual support",
    contact: "Emily Davis",
    company: "BigCorp Ltd.",
    status: "completed",
    priority: "high",
    createdAt: "2024-01-14T09:00:00",
    completedAt: "2024-01-14T16:00:00",
    avatar: "/avatars/emily.jpg",
    assignee: "Alex Thompson"
  },
  {
    id: 4,
    type: "email",
    title: "Marketing automation demo",
    description: "Schedule demo for marketing automation platform",
    contact: "Robert Taylor",
    company: "Innovate Solutions",
    status: "pending",
    priority: "medium",
    createdAt: "2024-01-13T11:30:00",
    dueDate: "2024-01-17T10:00:00",
    avatar: "/avatars/robert.jpg",
    assignee: "Lisa Chen"
  },
  {
    id: 5,
    type: "call",
    title: "Discovery call - Custom Development",
    description: "Understand requirements for custom development project",
    contact: "Maria Garcia",
    company: "FutureTech",
    status: "overdue",
    priority: "low",
    createdAt: "2024-01-12T14:00:00",
    dueDate: "2024-01-14T09:00:00",
    avatar: "/avatars/maria.jpg",
    assignee: "James Wilson"
  }
];

const upcomingTasks = [
  {
    id: 1,
    title: "Prepare quarterly business review",
    contact: "John Smith",
    company: "TechCorp Inc.",
    dueDate: "2024-01-16T10:00:00",
    priority: "high"
  },
  {
    id: 2,
    title: "Send contract renewal reminder",
    contact: "Emily Davis", 
    company: "BigCorp Ltd.",
    dueDate: "2024-01-16T14:00:00",
    priority: "medium"
  },
  {
    id: 3,
    title: "Follow up on pricing questions",
    contact: "Mike Chen",
    company: "StartupXYZ", 
    dueDate: "2024-01-17T09:00:00",
    priority: "medium"
  }
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "email":
      return Mail;
    case "call":
      return Phone;
    case "meeting":
      return Video;
    case "message":
      return MessageSquare;
    default:
      return Calendar;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "scheduled":
      return "secondary";
    case "pending":
      return "outline";
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-600";
    case "medium":
      return "text-yellow-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

export default function CRMActivitiesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Activities</h1>
          <p className="text-muted-foreground">
            Track communications and manage customer interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button asChild>
            <Link href="/dashboard/crm/activities/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
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
                placeholder="Search activities..."
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activities List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest customer communications and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`rounded-full p-2 ${
                        activity.type === 'email' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'call' ? 'bg-green-100 text-green-600' :
                        activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{activity.title}</h3>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusBadgeVariant(activity.status)}>
                              {activity.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit Activity</DropdownMenuItem>
                                <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                                <DropdownMenuItem>Add Follow-up</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Delete Activity
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{activity.contact}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-3 w-3" />
                            <span>{activity.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(activity.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={activity.avatar} alt={activity.contact} />
                              <AvatarFallback className="text-xs">
                                {activity.contact.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              Assigned to {activity.assignee}
                            </span>
                          </div>
                          <div className={`text-sm font-medium ${getPriorityColor(activity.priority)}`}>
                            {activity.priority.toUpperCase()} PRIORITY
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Upcoming Tasks</span>
              </CardTitle>
              <CardDescription>
                Tasks due in the next few days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.contact} • {task.company}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>
                This week's activity statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Emails</span>
                </div>
                <span className="font-semibold">47</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>Calls</span>
                </div>
                <span className="font-semibold">23</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="h-4 w-4 text-purple-600" />
                  <span>Meetings</span>
                </div>
                <span className="font-semibold">12</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Completed</span>
                </div>
                <span className="font-semibold">68</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span>Overdue</span>
                </div>
                <span className="font-semibold">3</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common CRM activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}