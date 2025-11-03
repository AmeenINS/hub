'use client';

import * as React from 'react';
import '@/app/sidebar-enhanced.css';
import {
  Bot,
  ChevronRight,
  ChevronsUpDown,
  LifeBuoy,
  Settings2,
  Users,
  Shield,
  ListTodo,
  BarChart3,
  Bell,
  LogOut,
  TrendingUp,
  Clock,
  Building2,
  UserPlus,
  Briefcase,
  FileText,
  DollarSign,
  FileCheck,
  ClipboardList,
  Calculator,
  Wallet,
  Receipt,
  Target,
  Users2,
  UserCheck,
  GitBranch,
  Workflow,
  CheckCircle2,
  AlertCircle,
  PieChart,
  Activity,
  Mail,
  Award,
  CreditCard,
  Banknote,
  Package,
  ShoppingCart,
  TruckIcon,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Folder,
  LayoutDashboard,
  Network,
  Layers,
  Settings,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useI18n } from '@/lib/i18n/i18n-context';
import { getLocalizedUserName, getUserInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, dir, locale } = useI18n();
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [permissions, setPermissions] = React.useState<Record<string, string[]>>({});
  const [loading, setLoading] = React.useState(true);
  
  // Use real-time notifications hook
  const { unreadCount } = useRealTimeNotifications();



  // Fetch user permissions
  React.useEffect(() => {
    const fetchPermissions = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const modules = [
          'users', 'tasks', 'roles', 'reports', 'notifications', 'support', 'scheduler',
          'crm_contacts', 'crm_companies', 'crm_leads', 'crm_deals', 'crm_activities', 'crm_campaigns',
          'policies', 'claims', 'commission', 'accounting',
          'workflows', 'inventory', 'procurement'
        ];
        const response = await fetch(`/api/users/me/permissions?modules=${modules.join(',')}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPermissions(data);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [token]);



  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Check if user has access to a module
  const hasModuleAccess = (moduleName: string) => {
    if (loading) return true; // Show all while loading
    
    // For CRM, check if user has access to any CRM module
    if (moduleName === 'crm') {
      return ['crm_contacts', 'crm_companies', 'crm_leads', 'crm_deals', 'crm_activities', 'crm_campaigns']
        .some(module => permissions[module] && permissions[module].length > 0);
    }
    
    return permissions[moduleName] && permissions[moduleName].length > 0;
  };

  // Navigation data based on user permissions
  const allNavItems = [
    {
      title: t('nav.dashboard'),
      url: '/dashboard',
      icon: LayoutDashboard,
      iconColor: 'text-blue-600 dark:text-blue-400',
      isActive: pathname === '/dashboard',
      module: 'dashboard',
    },
    // CRM Module
    {
      title: 'CRM & Sales',
      url: '/dashboard/crm',
      icon: Users2,
      iconColor: 'text-purple-600 dark:text-purple-400',
      isActive: pathname?.startsWith('/dashboard/crm'),
      module: 'crm',
      items: [
        {
          title: 'Contacts',
          url: '/dashboard/crm/contacts',
          icon: UserCheck,
          iconColor: 'text-purple-500',
        },
        {
          title: 'Companies',
          url: '/dashboard/crm/companies',
          icon: Building2,
          iconColor: 'text-purple-600',
        },
        {
          title: 'Leads',
          url: '/dashboard/crm/leads',
          icon: Target,
          iconColor: 'text-purple-700',
        },
        {
          title: 'Deals',
          url: '/dashboard/crm/deals',
          icon: Briefcase,
          iconColor: 'text-purple-800',
        },
        {
          title: 'Activities',
          url: '/dashboard/crm/activities',
          icon: Activity,
          iconColor: 'text-purple-500',
        },
        {
          title: 'Campaigns',
          url: '/dashboard/crm/campaigns',
          icon: Mail,
          iconColor: 'text-purple-600',
        },
      ],
    },
    // Policy Management Module
    {
      title: 'Policy Management',
      url: '/dashboard/policies',
      icon: FileText,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      isActive: pathname?.startsWith('/dashboard/policies'),
      module: 'policies',
      items: [
        {
          title: 'All Policies',
          url: '/dashboard/policies',
          icon: FileCheck,
          iconColor: 'text-emerald-500',
        },
        {
          title: 'New Policy',
          url: '/dashboard/policies/new',
          icon: FileText,
          iconColor: 'text-emerald-600',
        },
        {
          title: 'Renewals',
          url: '/dashboard/policies/renewals',
          icon: Clock,
          iconColor: 'text-emerald-700',
        },
        {
          title: 'Expired',
          url: '/dashboard/policies/expired',
          icon: AlertCircle,
          iconColor: 'text-red-500',
        },
        {
          title: 'Policy Types',
          url: '/dashboard/policies/types',
          icon: Layers,
          iconColor: 'text-emerald-600',
        },
      ],
    },
    // Claims Management Module
    {
      title: 'Claims Management',
      url: '/dashboard/claims',
      icon: ClipboardList,
      iconColor: 'text-orange-600 dark:text-orange-400',
      isActive: pathname?.startsWith('/dashboard/claims'),
      module: 'claims',
      items: [
        {
          title: 'All Claims',
          url: '/dashboard/claims',
          icon: ClipboardList,
          iconColor: 'text-orange-500',
        },
        {
          title: 'New Claim',
          url: '/dashboard/claims/new',
          icon: FileText,
          iconColor: 'text-orange-600',
        },
        {
          title: 'Pending',
          url: '/dashboard/claims/pending',
          icon: Clock,
          iconColor: 'text-yellow-600',
        },
        {
          title: 'Approved',
          url: '/dashboard/claims/approved',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
        },
        {
          title: 'Rejected',
          url: '/dashboard/claims/rejected',
          icon: AlertCircle,
          iconColor: 'text-red-600',
        },
        {
          title: 'Processing',
          url: '/dashboard/claims/processing',
          icon: Workflow,
          iconColor: 'text-orange-700',
        },
      ],
    },
    // Commission & Accounting Module
    {
      title: 'Finance & Accounting',
      url: '/dashboard/accounting',
      icon: Calculator,
      iconColor: 'text-teal-600 dark:text-teal-400',
      isActive: pathname?.startsWith('/dashboard/accounting') || pathname?.startsWith('/dashboard/commission'),
      module: 'accounting',
      items: [
        {
          title: 'Commission',
          url: '/dashboard/commission',
          icon: DollarSign,
          iconColor: 'text-teal-500',
        },
        {
          title: 'Payouts',
          url: '/dashboard/commission/payouts',
          icon: Wallet,
          iconColor: 'text-teal-600',
        },
        {
          title: 'Invoices',
          url: '/dashboard/accounting/invoices',
          icon: Receipt,
          iconColor: 'text-teal-700',
        },
        {
          title: 'Payments',
          url: '/dashboard/accounting/payments',
          icon: CreditCard,
          iconColor: 'text-teal-800',
        },
        {
          title: 'Transactions',
          url: '/dashboard/accounting/transactions',
          icon: Banknote,
          iconColor: 'text-teal-600',
        },
        {
          title: 'Reports',
          url: '/dashboard/accounting/reports',
          icon: FileSpreadsheet,
          iconColor: 'text-teal-700',
        },
      ],
    },
    // Workflow & Automation Module
    {
      title: 'Workflow & Tasks',
      url: '/dashboard/workflows',
      icon: GitBranch,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      isActive: pathname?.startsWith('/dashboard/workflows') || (pathname?.startsWith('/dashboard/tasks') && !pathname?.includes('/tasks')),
      module: 'workflows',
      items: [
        {
          title: 'Workflows',
          url: '/dashboard/workflows',
          icon: GitBranch,
          iconColor: 'text-indigo-500',
        },
        {
          title: 'Automations',
          url: '/dashboard/workflows/automations',
          icon: Workflow,
          iconColor: 'text-indigo-600',
        },
        {
          title: 'Templates',
          url: '/dashboard/workflows/templates',
          icon: Folder,
          iconColor: 'text-indigo-700',
        },
      ],
    },
    // Task Management (separate from workflows)
    {
      title: t('nav.tasks'),
      url: '/dashboard/tasks',
      icon: ListTodo,
      iconColor: 'text-pink-600 dark:text-pink-400',
      isActive: pathname?.startsWith('/dashboard/tasks'),
      module: 'tasks',
      items: [
        {
          title: t('tasks.allTasks'),
          url: '/dashboard/tasks',
          icon: ListTodo,
          iconColor: 'text-pink-500',
        },
        {
          title: t('tasks.createTask'),
          url: '/dashboard/tasks/new',
          icon: FileText,
          iconColor: 'text-pink-600',
        },
        {
          title: t('tasks.myTasks'),
          url: '/dashboard/tasks/my-tasks',
          icon: UserCheck,
          iconColor: 'text-pink-700',
        },
      ],
    },
    // Scheduler Module
    {
      title: 'Scheduler & Calendar',
      url: '/dashboard/scheduler',
      icon: CalendarIcon,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      isActive: pathname?.startsWith('/dashboard/scheduler'),
      module: 'scheduler',
      items: [
        {
          title: 'All Events',
          url: '/dashboard/scheduler',
          icon: CalendarIcon,
          iconColor: 'text-cyan-500',
        },
        {
          title: 'New Event',
          url: '/dashboard/scheduler/new',
          icon: FileText,
          iconColor: 'text-cyan-600',
        },
        {
          title: 'Calendar View',
          url: '/dashboard/scheduler?view=calendar',
          icon: Clock,
          iconColor: 'text-cyan-700',
        },
      ],
    },
    // Inventory Module (if applicable for insurance products)
    {
      title: 'Inventory & Products',
      url: '/dashboard/inventory',
      icon: Package,
      iconColor: 'text-amber-600 dark:text-amber-400',
      isActive: pathname?.startsWith('/dashboard/inventory'),
      module: 'inventory',
      items: [
        {
          title: 'All Products',
          url: '/dashboard/inventory',
          icon: Package,
          iconColor: 'text-amber-500',
        },
        {
          title: 'Categories',
          url: '/dashboard/inventory/categories',
          icon: Layers,
          iconColor: 'text-amber-600',
        },
        {
          title: 'Stock',
          url: '/dashboard/inventory/stock',
          icon: ShoppingCart,
          iconColor: 'text-amber-700',
        },
      ],
    },
    // Procurement Module
    {
      title: 'Procurement',
      url: '/dashboard/procurement',
      icon: TruckIcon,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      isActive: pathname?.startsWith('/dashboard/procurement'),
      module: 'procurement',
      items: [
        {
          title: 'Purchase Orders',
          url: '/dashboard/procurement/orders',
          icon: FileText,
          iconColor: 'text-yellow-500',
        },
        {
          title: 'Suppliers',
          url: '/dashboard/procurement/suppliers',
          icon: Building2,
          iconColor: 'text-yellow-600',
        },
        {
          title: 'Requisitions',
          url: '/dashboard/procurement/requisitions',
          icon: ClipboardList,
          iconColor: 'text-yellow-700',
        },
      ],
    },
    // User Management Module
    {
      title: t('nav.users'),
      url: '/dashboard/users',
      icon: Users,
      iconColor: 'text-violet-600 dark:text-violet-400',
      isActive: pathname?.startsWith('/dashboard/users'),
      module: 'users',
      items: [
        {
          title: t('users.allUsers'),
          url: '/dashboard/users',
          icon: Users,
          iconColor: 'text-violet-500',
        },
        {
          title: t('users.createUser'),
          url: '/dashboard/users/new',
          icon: UserPlus,
          iconColor: 'text-violet-600',
        },
        {
          title: t('dashboard.orgChart') || 'Org Chart',
          url: '/dashboard/users/chart',
          icon: Network,
          iconColor: 'text-violet-700',
        },
      ],
    },
    // Roles & Permissions Module
    {
      title: t('nav.roles'),
      url: '/dashboard/roles',
      icon: Shield,
      iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
      isActive: pathname?.startsWith('/dashboard/roles'),
      module: 'roles',
      items: [
        {
          title: t('roles.allRoles'),
          url: '/dashboard/roles',
          icon: Shield,
          iconColor: 'text-fuchsia-500',
        },
        {
          title: t('roles.permissions'),
          url: '/dashboard/roles/permissions',
          icon: Settings,
          iconColor: 'text-fuchsia-600',
        },
      ],
    },
    // Reports & Analytics Module
    {
      title: t('nav.reports'),
      url: '/dashboard/reports',
      icon: BarChart3,
      iconColor: 'text-slate-600 dark:text-slate-400',
      isActive: pathname?.startsWith('/dashboard/reports'),
      module: 'reports',
      items: [
        {
          title: 'Overview',
          url: '/dashboard/reports',
          icon: BarChart3,
          iconColor: 'text-slate-500',
        },
        {
          title: 'Sales Reports',
          url: '/dashboard/reports/sales',
          icon: TrendingUp,
          iconColor: 'text-slate-600',
        },
        {
          title: 'Financial Reports',
          url: '/dashboard/reports/financial',
          icon: DollarSign,
          iconColor: 'text-slate-700',
        },
        {
          title: 'Performance',
          url: '/dashboard/reports/performance',
          icon: Award,
          iconColor: 'text-slate-600',
        },
        {
          title: 'Custom Reports',
          url: '/dashboard/reports/custom',
          icon: PieChart,
          iconColor: 'text-slate-500',
        },
      ],
    },
  ]; 

  const allNavSecondary = [
    {
      title: t('nav.notifications'),
      url: '/dashboard/notifications',
      icon: Bell,
      iconColor: 'text-red-600 dark:text-red-400',
      module: 'notifications',
      badge: unreadCount > 0 ? unreadCount.toString() : undefined,
    },
    {
      title: t('nav.settings'),
      url: '/dashboard/settings',
      icon: Settings2,
      iconColor: 'text-zinc-600 dark:text-zinc-400',
      module: 'settings', // Settings is always accessible
    },
    {
      title: t('common.support'),
      url: '/dashboard/support',
      icon: LifeBuoy,
      iconColor: 'text-green-600 dark:text-green-400',
      module: 'support',
    },
  ];

  // Filter navigation based on permissions
  const data = {
    navMain: allNavItems.filter(item => 
      item.module === 'dashboard' || hasModuleAccess(item.module)
    ),
    navSecondary: allNavSecondary.filter(item => 
      item.module === 'settings' || hasModuleAccess(item.module)
    ),
  };

  return (
    <Sidebar collapsible="icon" side={dir === 'rtl' ? 'right' : 'left'} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ameen Hub</span>
                  <span className="truncate text-xs">{t('common.platform')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.mainMenu')}</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => {
              const isParentActive = pathname?.startsWith(item.url) || item.isActive;
              const hasActiveChild = item.items?.some(subItem => pathname === subItem.url);
              
              if (item.items) {
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isParentActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          tooltip={item.title}
                          isActive={hasActiveChild}
                          className={hasActiveChild ? 'bg-sidebar-accent' : ''}
                        >
                          {item.icon && <item.icon className={item.iconColor} />}
                          <span className={hasActiveChild ? 'font-bold' : ''}>{item.title}</span>
                          <ChevronRight className={`ml-auto transition-transform duration-200 ${dir === 'rtl' ? 'rotate-180 group-data-[state=open]/collapsible:rotate-90' : 'group-data-[state=open]/collapsible:rotate-90'}`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const isSubItemActive = pathname === subItem.url;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton 
                                  asChild 
                                  isActive={isSubItemActive}
                                >
                                  <Link href={subItem.url}>
                                    {subItem.icon && <subItem.icon className={subItem.iconColor} />}
                                    <span className={isSubItemActive ? 'font-bold' : ''}>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                    <Link href={item.url}>
                      {item.icon && <item.icon className={item.iconColor} />}
                      <span className={item.isActive ? 'font-bold' : ''}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>{t('common.more')}</SidebarGroupLabel>
          <SidebarMenu>
            {data.navSecondary.map((item) => {
              const isSecondaryActive = pathname?.startsWith(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm" isActive={isSecondaryActive}>
                    <Link href={item.url}>
                      <item.icon className={item.iconColor} />
                      <span className={isSecondaryActive ? 'font-bold' : ''}>{item.title}</span>
                      {item.badge && parseInt(item.badge) > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.avatar}
                      alt={user ? getLocalizedUserName(user, locale) : undefined}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user ? getUserInitials(user) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user ? getLocalizedUserName(user, locale) : 'User'}
                    </span>
                    {user && (locale === 'ar' ? user.fullNameEn : user.fullNameAr) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {locale === 'ar' ? user?.fullNameEn : user?.fullNameAr}
                      </span>
                    )}
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className={dir === 'rtl' ? 'mr-auto size-4' : 'ml-auto size-4'} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.avatar}
                        alt={user ? getLocalizedUserName(user, locale) : undefined}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user ? getUserInitials(user) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user ? getLocalizedUserName(user, locale) : 'User'}
                      </span>
                      {user && (locale === 'ar' ? user.fullNameEn : user.fullNameAr) && (
                        <span className="truncate text-xs text-muted-foreground">
                          {locale === 'ar' ? user?.fullNameEn : user?.fullNameAr}
                        </span>
                      )}
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                    <Users className="mr-2 h-4 w-4" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <div className="flex items-center justify-between w-full">
                      <span>{t('common.theme')}</span>
                      <ThemeToggle />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <div className="flex items-center justify-between w-full">
                      <span>{t('common.language')}</span>
                      <LanguageToggle />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
