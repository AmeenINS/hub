'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { Card, CardContent } from '@/components/ui/card';
import type { Note } from '@/lib/db/notes-service';
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
  Folder,
  Lightbulb
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications';
import { apiClient, getErrorMessage } from '@/lib/api-client';
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
  const { t, dir } = useI18n();
  const { token } = useAuthStore();
  const router = useRouter();
  const { unreadCount } = useRealTimeNotifications();
  const [permissions, setPermissions] = React.useState<Record<string, string[]>>({});
  const [selectedModule, setSelectedModule] = React.useState<AppModule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [notesStats, setNotesStats] = React.useState<{
    total: number;
    pinned: number;
    archived: number;
  }>({ total: 0, pinned: 0, archived: 0 });

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
        const response = await apiClient.get<Record<string, string[]>>('/api/users/me/all-permissions');
        
        if (response.success && response.data) {
          // API returns { success: true, data: Record<string, string[]> }
          // response.data is already the permissions object
          setPermissions(
            typeof response.data === 'object' && !Array.isArray(response.data)
              ? response.data
              : {}
          );
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', getErrorMessage(error));
      }
    };

    fetchPermissions();
  }, [token]);

  // Fetch notes statistics
  React.useEffect(() => {
    const fetchNotesStats = async () => {
      if (!token) return;
      
      try {
        const [activeResponse, archivedResponse] = await Promise.all([
          apiClient.get<Note[]>('/api/notes'),
          apiClient.get<Note[]>('/api/notes?archived=true')
        ]);
        
        if (activeResponse.success && activeResponse.data) {
          const activeNotes = activeResponse.data;
          const pinnedCount = activeNotes.filter((note: Note) => note.pinned).length;
          
          let archivedCount = 0;
          if (archivedResponse.success && archivedResponse.data) {
            archivedCount = archivedResponse.data.filter((note: Note) => note.archived).length;
          }
          
          setNotesStats({
            total: activeNotes.length,
            pinned: pinnedCount,
            archived: archivedCount
          });
        }
      } catch (error) {
        console.error('Failed to fetch notes stats:', getErrorMessage(error));
      }
    };

    fetchNotesStats();
  }, [token]);

  const hasModuleAccess = (module: string) => {
    // If permissions are not loaded yet, show all modules
    if (!permissions || Object.keys(permissions).length === 0) return true;
    
    // Check if user is super admin (has system:admin permission)
    const isSuperAdmin = permissions['system']?.includes('admin');
    if (isSuperAdmin) return true;
    
    // For CRM module, check if user has access to any CRM sub-module
    if (module === 'crm') {
      return ['crm', 'crm_contacts', 'crm_companies', 'crm_leads', 'crm_deals', 'crm_activities', 'crm_campaigns']
        .some(subModule => permissions[subModule] && permissions[subModule].length > 0);
    }
    
    // Check specific module permission
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
      title: t('nav.dashboard'),
      icon: LayoutDashboard,
      color: 'from-blue-500 to-blue-600',
      module: 'dashboard',
      subItems: [
        { title: t('nav.dashboard'), url: '/dashboard', icon: LayoutDashboard, iconColor: 'text-blue-500' },
      ],
    },
    {
      title: t('modules.crm'),
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      module: 'crm',
      subItems: [
        { title: t('modules.contacts'), url: '/dashboard/crm/contacts', icon: Users, iconColor: 'text-purple-500' },
        { title: t('modules.companies'), url: '/dashboard/crm/companies', icon: Building2, iconColor: 'text-purple-600' },
        { title: t('modules.deals'), url: '/dashboard/crm/deals', icon: Briefcase, iconColor: 'text-purple-700' },
        { title: t('modules.activities'), url: '/dashboard/crm/activities', icon: Activity, iconColor: 'text-purple-500' },
        { title: t('modules.campaigns'), url: '/dashboard/crm/campaigns', icon: Mail, iconColor: 'text-purple-600' },
      ],
    },
    {
      title: t('modules.policies'),
      icon: FileText,
      color: 'from-emerald-500 to-emerald-600',
      module: 'policies',
      subItems: [
        { title: t('modules.allPolicies'), url: '/dashboard/policies', icon: FileText, iconColor: 'text-emerald-500' },
        { title: t('modules.newPolicy'), url: '/dashboard/policies/new', icon: FileText, iconColor: 'text-emerald-600' },
        { title: t('modules.renewals'), url: '/dashboard/policies/renewals', icon: Clock, iconColor: 'text-emerald-700' },
        { title: t('modules.expired'), url: '/dashboard/policies/expired', icon: AlertCircle, iconColor: 'text-red-500' },
        { title: t('modules.policyTypes'), url: '/dashboard/policies/types', icon: Layers, iconColor: 'text-emerald-600' },
      ],
    },
    {
      title: t('modules.claims'),
      icon: ClipboardList,
      color: 'from-orange-500 to-orange-600',
      module: 'claims',
      subItems: [
        { title: t('modules.allClaims'), url: '/dashboard/claims', icon: ClipboardList, iconColor: 'text-orange-500' },
        { title: t('modules.newClaim'), url: '/dashboard/claims/new', icon: FileText, iconColor: 'text-orange-600' },
        { title: t('modules.pending'), url: '/dashboard/claims/pending', icon: Clock, iconColor: 'text-yellow-600' },
        { title: t('modules.approved'), url: '/dashboard/claims/approved', icon: CheckCircle2, iconColor: 'text-green-600' },
        { title: t('modules.rejected'), url: '/dashboard/claims/rejected', icon: AlertCircle, iconColor: 'text-red-600' },
        { title: t('modules.processing'), url: '/dashboard/claims/processing', icon: Workflow, iconColor: 'text-orange-700' },
      ],
    },
    {
      title: t('modules.accounting'),
      icon: Calculator,
      color: 'from-teal-500 to-teal-600',
      module: 'accounting',
      subItems: [
        { title: t('modules.commission'), url: '/dashboard/commission', icon: DollarSign, iconColor: 'text-teal-500' },
        { title: t('modules.payouts'), url: '/dashboard/commission/payouts', icon: Wallet, iconColor: 'text-teal-600' },
        { title: t('modules.invoices'), url: '/dashboard/accounting/invoices', icon: Receipt, iconColor: 'text-teal-700' },
        { title: t('modules.payments'), url: '/dashboard/accounting/payments', icon: CreditCard, iconColor: 'text-teal-800' },
        { title: t('modules.transactions'), url: '/dashboard/accounting/transactions', icon: Banknote, iconColor: 'text-teal-600' },
      ],
    },
    {
      title: t('nav.tasks'),
      icon: ListTodo,
      color: 'from-pink-500 to-pink-600',
      module: 'tasks',
      subItems: [
        { title: t('tasks.allTasks'), url: '/dashboard/tasks', icon: ListTodo, iconColor: 'text-pink-500' },
        { title: t('tasks.createTask'), url: '/dashboard/tasks/new', icon: FileText, iconColor: 'text-pink-600' },
        { title: t('tasks.myTasks'), url: '/dashboard/tasks/my-tasks', icon: UserCheck, iconColor: 'text-pink-700' },
      ],
    },
    {
      title: t('nav.notes'),
      icon: Lightbulb,
      color: 'from-yellow-500 to-yellow-600',
      module: 'notes',
      subItems: [
        { title: t('nav.notes'), url: '/dashboard/notes', icon: Lightbulb, iconColor: 'text-yellow-500' },
      ],
    },
    {
      title: t('modules.scheduler'),
      icon: Calendar,
      color: 'from-cyan-500 to-cyan-600',
      module: 'scheduler',
      subItems: [
        { title: t('modules.allEvents'), url: '/dashboard/scheduler', icon: Calendar, iconColor: 'text-cyan-500' },
        { title: t('modules.newEvent'), url: '/dashboard/scheduler/new', icon: FileText, iconColor: 'text-cyan-600' },
        { title: t('modules.calendarView'), url: '/dashboard/scheduler?view=calendar', icon: Clock, iconColor: 'text-cyan-700' },
      ],
    },
    {
      title: t('modules.workflows'),
      icon: GitBranch,
      color: 'from-indigo-500 to-indigo-600',
      module: 'workflows',
      subItems: [
        { title: t('modules.workflows'), url: '/dashboard/workflows', icon: GitBranch, iconColor: 'text-indigo-500' },
        { title: t('modules.automations'), url: '/dashboard/workflows/automations', icon: Workflow, iconColor: 'text-indigo-600' },
        { title: t('modules.templates'), url: '/dashboard/workflows/templates', icon: Folder, iconColor: 'text-indigo-700' },
      ],
    },
    {
      title: t('nav.users'),
      icon: Users,
      color: 'from-violet-500 to-violet-600',
      module: 'users',
      subItems: [
        { title: t('users.allUsers'), url: '/dashboard/users', icon: Users, iconColor: 'text-violet-500' },
        { title: t('users.createUser'), url: '/dashboard/users/new', icon: UserPlus, iconColor: 'text-violet-600' },
        { title: t('modules.orgChart'), url: '/dashboard/users/chart', icon: Network, iconColor: 'text-violet-700' },
      ],
    },
    {
      title: t('nav.roles'),
      icon: Shield,
      color: 'from-fuchsia-500 to-fuchsia-600',
      module: 'roles',
      subItems: [
        { title: t('roles.allRoles'), url: '/dashboard/roles', icon: Shield, iconColor: 'text-fuchsia-500' },
        { title: t('roles.permissions'), url: '/dashboard/roles/permissions', icon: Settings2, iconColor: 'text-fuchsia-600' },
      ],
    },
    {
      title: t('nav.reports'),
      icon: BarChart3,
      color: 'from-slate-500 to-slate-600',
      module: 'reports',
      subItems: [
        { title: t('nav.reports'), url: '/dashboard/reports', icon: BarChart3, iconColor: 'text-slate-500' },
        { title: t('dashboard.salesReports'), url: '/dashboard/reports/sales', icon: TrendingUp, iconColor: 'text-slate-600' },
        { title: t('dashboard.financialReports'), url: '/dashboard/reports/financial', icon: DollarSign, iconColor: 'text-slate-700' },
        { title: t('dashboard.performance'), url: '/dashboard/reports/performance', icon: Award, iconColor: 'text-slate-600' },
        { title: t('dashboard.customReports'), url: '/dashboard/reports/custom', icon: PieChart, iconColor: 'text-slate-500' },
      ],
    },
    {
      title: t('modules.inventory'),
      icon: Package,
      color: 'from-amber-500 to-amber-600',
      module: 'inventory',
      subItems: [
        { title: t('modules.allProducts'), url: '/dashboard/inventory', icon: Package, iconColor: 'text-amber-500' },
        { title: t('modules.categories'), url: '/dashboard/inventory/categories', icon: Layers, iconColor: 'text-amber-600' },
        { title: t('modules.stock'), url: '/dashboard/inventory/stock', icon: ShoppingCart, iconColor: 'text-amber-700' },
      ],
    },
    {
      title: t('modules.procurement'),
      icon: TruckIcon,
      color: 'from-yellow-500 to-yellow-600',
      module: 'procurement',
      subItems: [
        { title: t('modules.purchaseOrders'), url: '/dashboard/procurement/orders', icon: FileText, iconColor: 'text-yellow-500' },
        { title: t('modules.suppliers'), url: '/dashboard/procurement/suppliers', icon: Building2, iconColor: 'text-yellow-600' },
        { title: t('modules.requisitions'), url: '/dashboard/procurement/requisitions', icon: ClipboardList, iconColor: 'text-yellow-700' },
      ],
    },
    {
      title: t('nav.notifications'),
      icon: Bell,
      color: 'from-red-500 to-red-600',
      module: 'notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
      subItems: [
        { title: t('nav.notifications'), url: '/dashboard/notifications', icon: Bell, iconColor: 'text-red-500' },
      ],
    },
    {
      title: t('nav.settings'),
      icon: Settings2,
      color: 'from-zinc-500 to-zinc-600',
      module: 'settings',
      subItems: [
        { title: t('nav.settings'), url: '/dashboard/settings', icon: Settings2, iconColor: 'text-zinc-500' },
      ],
    },
    {
      title: t('common.support'),
      icon: LifeBuoy,
      color: 'from-green-500 to-green-600',
      module: 'support',
      subItems: [
        { title: t('common.support'), url: '/dashboard/support', icon: LifeBuoy, iconColor: 'text-green-500' },
      ],
    },
  ];

  const accessibleModules = appModules.filter(module => 
    module.module === 'dashboard' || 
    module.module === 'settings' ||
    module.module === 'notes' ||
    module.module === 'notifications' ||
    hasModuleAccess(module.module)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Notes */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notes.title')}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {notesStats.total}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pinned Notes */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notes.pinned')}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {notesStats.pinned}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Archived Notes */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notes.archivedNotes')}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {notesStats.archived}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600">
                <Folder className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('nav.notifications')}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {unreadCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                <Bell className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
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
        <DialogContent 
          className="w-[calc(100vw-2rem)] sm:w-auto max-w-none p-6"
          closeButtonPosition={dir === 'rtl' ? 'left' : 'right'}
        >
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
