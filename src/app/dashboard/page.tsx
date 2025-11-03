'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  ListTodo, 
  Shield, 
  BarChart3,
  Bell,
  Calendar,
  FileText,
  DollarSign,
  ClipboardList,
  Calculator,
  Briefcase,
  GitBranch,
  Package,
  TruckIcon,
  Settings2,
  LifeBuoy,
  Network,
  LayoutDashboard,
  UserPlus,
  UserCheck,
  Activity,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Workflow,
  PieChart,
  TrendingUp,
  Award,
  CreditCard,
  Banknote,
  Receipt,
  Wallet,
  Layers,
  ShoppingCart,
  Folder
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications';
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SubMenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  iconColor: string;
}

interface AppModule {
  title: string;
  icon: React.ElementType;
  color: string;
  module: string;
  badge?: number;
  subItems: SubMenuItem[];
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { token } = useAuthStore();
  const router = useRouter();
  const { unreadCount } = useRealTimeNotifications();
  const [permissions, setPermissions] = React.useState<Record<string, string[]>>({});
  const [selectedModule, setSelectedModule] = React.useState<AppModule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const getModuleColor = (iconColor: string) => {
    const colorMap: Record<string, string> = {
      'text-blue-500': 'from-blue-500 to-blue-600',
      'text-purple-500': 'from-purple-500 to-purple-600',
      'text-purple-600': 'from-purple-600 to-purple-700',
      'text-purple-700': 'from-purple-700 to-purple-800',
      'text-emerald-500': 'from-emerald-500 to-emerald-600',
      'text-emerald-600': 'from-emerald-600 to-emerald-700',
      'text-emerald-700': 'from-emerald-700 to-emerald-800',
      'text-red-500': 'from-red-500 to-red-600',
      'text-orange-500': 'from-orange-500 to-orange-600',
      'text-orange-600': 'from-orange-600 to-orange-700',
      'text-orange-700': 'from-orange-700 to-orange-800',
      'text-yellow-500': 'from-yellow-500 to-yellow-600',
      'text-yellow-600': 'from-yellow-600 to-yellow-700',
      'text-yellow-700': 'from-yellow-700 to-yellow-800',
      'text-green-600': 'from-green-600 to-green-700',
      'text-teal-500': 'from-teal-500 to-teal-600',
      'text-teal-600': 'from-teal-600 to-teal-700',
      'text-teal-700': 'from-teal-700 to-teal-800',
      'text-teal-800': 'from-teal-800 to-teal-900',
      'text-cyan-500': 'from-cyan-500 to-cyan-600',
      'text-cyan-600': 'from-cyan-600 to-cyan-700',
      'text-cyan-700': 'from-cyan-700 to-cyan-800',
      'text-pink-500': 'from-pink-500 to-pink-600',
      'text-pink-600': 'from-pink-600 to-pink-700',
      'text-pink-700': 'from-pink-700 to-pink-800',
      'text-indigo-500': 'from-indigo-500 to-indigo-600',
      'text-indigo-600': 'from-indigo-600 to-indigo-700',
      'text-indigo-700': 'from-indigo-700 to-indigo-800',
      'text-violet-500': 'from-violet-500 to-violet-600',
      'text-violet-600': 'from-violet-600 to-violet-700',
      'text-violet-700': 'from-violet-700 to-violet-800',
      'text-fuchsia-500': 'from-fuchsia-500 to-fuchsia-600',
      'text-fuchsia-600': 'from-fuchsia-600 to-fuchsia-700',
      'text-slate-500': 'from-slate-500 to-slate-600',
      'text-slate-600': 'from-slate-600 to-slate-700',
      'text-slate-700': 'from-slate-700 to-slate-800',
      'text-amber-500': 'from-amber-500 to-amber-600',
      'text-amber-600': 'from-amber-600 to-amber-700',
      'text-amber-700': 'from-amber-700 to-amber-800',
      'text-zinc-500': 'from-zinc-500 to-zinc-600',
      'text-green-500': 'from-green-500 to-green-600',
    };
    return colorMap[iconColor] || 'from-gray-500 to-gray-600';
  };

  React.useEffect(() => {
    const fetchPermissions = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/permissions/my-permissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions || {});
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };

    fetchPermissions();
  }, [token]);

  const hasModuleAccess = (module: string) => {
    if (!permissions || Object.keys(permissions).length === 0) return true;
    return permissions[module] && permissions[module].length > 0;
  };

  const handleModuleClick = (module: AppModule) => {
    if (module.subItems.length === 1) {
      router.push(module.subItems[0].url);
    } else {
      setSelectedModule(module);
      setIsDialogOpen(true);
    }
  };

  const handleSubItemClick = (url: string) => {
    setIsDialogOpen(false);
    router.push(url);
  };

  const appModules: AppModule[] = [
    {
      title: t('nav.dashboard') || 'Dashboard',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-blue-600',
      module: 'dashboard',
      subItems: [
        { title: 'Overview', url: '/dashboard', icon: LayoutDashboard, iconColor: 'text-blue-500' },
      ],
    },
    {
      title: 'CRM',
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      module: 'crm',
      subItems: [
        { title: 'Contacts', url: '/dashboard/crm/contacts', icon: Users, iconColor: 'text-purple-500' },
        { title: 'Companies', url: '/dashboard/crm/companies', icon: Building2, iconColor: 'text-purple-600' },
        { title: 'Deals', url: '/dashboard/crm/deals', icon: Briefcase, iconColor: 'text-purple-700' },
        { title: 'Activities', url: '/dashboard/crm/activities', icon: Activity, iconColor: 'text-purple-500' },
        { title: 'Campaigns', url: '/dashboard/crm/campaigns', icon: Mail, iconColor: 'text-purple-600' },
      ],
    },
    {
      title: 'Policies',
      icon: FileText,
      color: 'from-emerald-500 to-emerald-600',
      module: 'policies',
      subItems: [
        { title: 'All Policies', url: '/dashboard/policies', icon: FileText, iconColor: 'text-emerald-500' },
        { title: 'New Policy', url: '/dashboard/policies/new', icon: FileText, iconColor: 'text-emerald-600' },
        { title: 'Renewals', url: '/dashboard/policies/renewals', icon: Clock, iconColor: 'text-emerald-700' },
        { title: 'Expired', url: '/dashboard/policies/expired', icon: AlertCircle, iconColor: 'text-red-500' },
        { title: 'Policy Types', url: '/dashboard/policies/types', icon: Layers, iconColor: 'text-emerald-600' },
      ],
    },
    {
      title: 'Claims',
      icon: ClipboardList,
      color: 'from-orange-500 to-orange-600',
      module: 'claims',
      subItems: [
        { title: 'All Claims', url: '/dashboard/claims', icon: ClipboardList, iconColor: 'text-orange-500' },
        { title: 'New Claim', url: '/dashboard/claims/new', icon: FileText, iconColor: 'text-orange-600' },
        { title: 'Pending', url: '/dashboard/claims/pending', icon: Clock, iconColor: 'text-yellow-600' },
        { title: 'Approved', url: '/dashboard/claims/approved', icon: CheckCircle2, iconColor: 'text-green-600' },
        { title: 'Rejected', url: '/dashboard/claims/rejected', icon: AlertCircle, iconColor: 'text-red-600' },
        { title: 'Processing', url: '/dashboard/claims/processing', icon: Workflow, iconColor: 'text-orange-700' },
      ],
    },
    {
      title: 'Accounting',
      icon: Calculator,
      color: 'from-teal-500 to-teal-600',
      module: 'accounting',
      subItems: [
        { title: 'Commission', url: '/dashboard/commission', icon: DollarSign, iconColor: 'text-teal-500' },
        { title: 'Payouts', url: '/dashboard/commission/payouts', icon: Wallet, iconColor: 'text-teal-600' },
        { title: 'Invoices', url: '/dashboard/accounting/invoices', icon: Receipt, iconColor: 'text-teal-700' },
        { title: 'Payments', url: '/dashboard/accounting/payments', icon: CreditCard, iconColor: 'text-teal-800' },
        { title: 'Transactions', url: '/dashboard/accounting/transactions', icon: Banknote, iconColor: 'text-teal-600' },
      ],
    },
    {
      title: t('nav.tasks') || 'Tasks',
      icon: ListTodo,
      color: 'from-pink-500 to-pink-600',
      module: 'tasks',
      subItems: [
        { title: t('tasks.allTasks') || 'All Tasks', url: '/dashboard/tasks', icon: ListTodo, iconColor: 'text-pink-500' },
        { title: t('tasks.createTask') || 'Create Task', url: '/dashboard/tasks/new', icon: FileText, iconColor: 'text-pink-600' },
        { title: t('tasks.myTasks') || 'My Tasks', url: '/dashboard/tasks/my-tasks', icon: UserCheck, iconColor: 'text-pink-700' },
      ],
    },
    {
      title: 'Scheduler',
      icon: Calendar,
      color: 'from-cyan-500 to-cyan-600',
      module: 'scheduler',
      subItems: [
        { title: 'All Events', url: '/dashboard/scheduler', icon: Calendar, iconColor: 'text-cyan-500' },
        { title: 'New Event', url: '/dashboard/scheduler/new', icon: FileText, iconColor: 'text-cyan-600' },
        { title: 'Calendar View', url: '/dashboard/scheduler?view=calendar', icon: Clock, iconColor: 'text-cyan-700' },
      ],
    },
    {
      title: 'Workflows',
      icon: GitBranch,
      color: 'from-indigo-500 to-indigo-600',
      module: 'workflows',
      subItems: [
        { title: 'Workflows', url: '/dashboard/workflows', icon: GitBranch, iconColor: 'text-indigo-500' },
        { title: 'Automations', url: '/dashboard/workflows/automations', icon: Workflow, iconColor: 'text-indigo-600' },
        { title: 'Templates', url: '/dashboard/workflows/templates', icon: Folder, iconColor: 'text-indigo-700' },
      ],
    },
    {
      title: t('nav.users') || 'Users',
      icon: Users,
      color: 'from-violet-500 to-violet-600',
      module: 'users',
      subItems: [
        { title: t('users.allUsers') || 'All Users', url: '/dashboard/users', icon: Users, iconColor: 'text-violet-500' },
        { title: t('users.createUser') || 'Create User', url: '/dashboard/users/new', icon: UserPlus, iconColor: 'text-violet-600' },
        { title: t('dashboard.orgChart') || 'Org Chart', url: '/dashboard/users/chart', icon: Network, iconColor: 'text-violet-700' },
      ],
    },
    {
      title: t('nav.roles') || 'Roles',
      icon: Shield,
      color: 'from-fuchsia-500 to-fuchsia-600',
      module: 'roles',
      subItems: [
        { title: t('roles.allRoles') || 'All Roles', url: '/dashboard/roles', icon: Shield, iconColor: 'text-fuchsia-500' },
        { title: t('roles.permissions') || 'Permissions', url: '/dashboard/roles/permissions', icon: Settings2, iconColor: 'text-fuchsia-600' },
      ],
    },
    {
      title: t('nav.reports') || 'Reports',
      icon: BarChart3,
      color: 'from-slate-500 to-slate-600',
      module: 'reports',
      subItems: [
        { title: 'Overview', url: '/dashboard/reports', icon: BarChart3, iconColor: 'text-slate-500' },
        { title: 'Sales Reports', url: '/dashboard/reports/sales', icon: TrendingUp, iconColor: 'text-slate-600' },
        { title: 'Financial Reports', url: '/dashboard/reports/financial', icon: DollarSign, iconColor: 'text-slate-700' },
        { title: 'Performance', url: '/dashboard/reports/performance', icon: Award, iconColor: 'text-slate-600' },
        { title: 'Custom Reports', url: '/dashboard/reports/custom', icon: PieChart, iconColor: 'text-slate-500' },
      ],
    },
    {
      title: 'Inventory',
      icon: Package,
      color: 'from-amber-500 to-amber-600',
      module: 'inventory',
      subItems: [
        { title: 'All Products', url: '/dashboard/inventory', icon: Package, iconColor: 'text-amber-500' },
        { title: 'Categories', url: '/dashboard/inventory/categories', icon: Layers, iconColor: 'text-amber-600' },
        { title: 'Stock', url: '/dashboard/inventory/stock', icon: ShoppingCart, iconColor: 'text-amber-700' },
      ],
    },
    {
      title: 'Procurement',
      icon: TruckIcon,
      color: 'from-yellow-500 to-yellow-600',
      module: 'procurement',
      subItems: [
        { title: 'Purchase Orders', url: '/dashboard/procurement/orders', icon: FileText, iconColor: 'text-yellow-500' },
        { title: 'Suppliers', url: '/dashboard/procurement/suppliers', icon: Building2, iconColor: 'text-yellow-600' },
        { title: 'Requisitions', url: '/dashboard/procurement/requisitions', icon: ClipboardList, iconColor: 'text-yellow-700' },
      ],
    },
    {
      title: t('nav.notifications') || 'Notifications',
      icon: Bell,
      color: 'from-red-500 to-red-600',
      module: 'notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
      subItems: [
        { title: 'All Notifications', url: '/dashboard/notifications', icon: Bell, iconColor: 'text-red-500' },
      ],
    },
    {
      title: t('nav.settings') || 'Settings',
      icon: Settings2,
      color: 'from-zinc-500 to-zinc-600',
      module: 'settings',
      subItems: [
        { title: 'Settings', url: '/dashboard/settings', icon: Settings2, iconColor: 'text-zinc-500' },
      ],
    },
    {
      title: t('common.support') || 'Support',
      icon: LifeBuoy,
      color: 'from-green-500 to-green-600',
      module: 'support',
      subItems: [
        { title: 'Support', url: '/dashboard/support', icon: LifeBuoy, iconColor: 'text-green-500' },
      ],
    },
  ];

  const accessibleModules = appModules.filter(module => 
    module.module === 'dashboard' || 
    module.module === 'settings' || 
    hasModuleAccess(module.module)
  );

  return (
    <div className="p-6">
      <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {accessibleModules.map((module, index) => (
          <Card 
            key={index}
            onClick={() => handleModuleClick(module)}
            className="group relative hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-primary/50 overflow-hidden hover:scale-105 py-0"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 relative">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <module.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="font-medium text-xs leading-tight group-hover:text-primary transition-colors">
                {module.title}
              </h3>

              {module.badge && (
                <Badge variant="destructive" className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full text-xs">
                  {module.badge}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto max-w-none p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-3">
              {selectedModule && (
                <>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedModule.color}`}>
                    <selectedModule.icon className="h-5 w-5 text-white" />
                  </div>
                  <span>{selectedModule.title}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 flex-wrap">
            {selectedModule?.subItems.map((item, index) => (
              <Card
                key={index}
                onClick={() => handleSubItemClick(item.url)}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-primary/50 hover:scale-105 w-[95px] py-0"
              >
                <CardContent className="p-3 flex flex-col items-center justify-center text-center space-y-2">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${getModuleColor(item.iconColor)} shadow-md group-hover:scale-110 transition-transform duration-300 aspect-square flex items-center justify-center`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-xs leading-tight group-hover:text-primary transition-colors w-full">
                    {item.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
