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
  Lightbulb,
  Radar,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
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
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/shared/components/ui/sidebar';
import { useI18n } from '@/shared/i18n/i18n-context';
import { getLocalizedUserName, getUserInitials } from '@/core/utils';
import { useAuthStore } from '@/shared/state/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { LanguageToggle } from '@/shared/components/theme/language-toggle';
import { useRealTimeNotifications } from '@/shared/hooks/use-real-time-notifications';
import { useModuleVisibility } from '@/shared/hooks/use-module-visibility';
import { VersionDisplay } from '@/shared/components/ui/version-display';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, dir, locale } = useI18n();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  // Use real-time notifications hook
  const { unreadCount } = useRealTimeNotifications();
  const { hasAccess: canAccessModule, isLoading: permissionsLoading } = useModuleVisibility();

  /**
   * Check if user has access to a module
   * Supports checking parent modules and sub-modules with aliases
   */
  const hasModuleAccess = React.useCallback(
    (moduleName: string | string[]) => {
      if (!moduleName) return false;
      return canAccessModule(moduleName);
    },
    [canAccessModule]
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
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
    {
      title: t('nav.liveTracking'),
      url: '/dashboard/live-tracking',
      icon: Radar,
      iconColor: 'text-sky-600 dark:text-sky-400',
      isActive: pathname?.startsWith('/dashboard/live-tracking'),
      module: 'liveTracking',
    },
    // CRM Module
    {
      title: t('modules.crm'),
      url: '/dashboard/crm',
      icon: Users2,
      iconColor: 'text-purple-600 dark:text-purple-400',
      isActive: pathname?.startsWith('/dashboard/crm'),
      module: 'crm',
      items: [
        {
          title: t('modules.contacts'),
          url: '/dashboard/crm/contacts',
          icon: UserCheck,
          iconColor: 'text-purple-500',
          module: ['crm', 'crm_contacts', 'contacts'],
        },
        {
          title: t('modules.companies'),
          url: '/dashboard/crm/companies',
          icon: Building2,
          iconColor: 'text-purple-600',
          module: ['crm', 'crm_companies', 'companies'],
        },
        {
          title: t('modules.leads'),
          url: '/dashboard/crm/leads',
          icon: Target,
          iconColor: 'text-purple-700',
          module: ['crm', 'crm_leads', 'leads'],
        },
        {
          title: t('modules.deals'),
          url: '/dashboard/crm/deals',
          icon: Briefcase,
          iconColor: 'text-purple-800',
          module: ['crm', 'crm_deals', 'deals'],
        },
        {
          title: t('modules.activities'),
          url: '/dashboard/crm/activities',
          icon: Activity,
          iconColor: 'text-purple-500',
          module: ['crm', 'crm_activities', 'activities'],
        },
        {
          title: t('modules.campaigns'),
          url: '/dashboard/crm/campaigns',
          icon: Mail,
          iconColor: 'text-purple-600',
          module: ['crm', 'crm_campaigns', 'campaigns'],
        },
      ],
    },
    // Policy Management Module
    {
      title: t('modules.policies'),
      url: '/dashboard/policies',
      icon: FileText,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      isActive: pathname?.startsWith('/dashboard/policies'),
      module: 'policies',
      items: [
        {
          title: t('modules.allPolicies'),
          url: '/dashboard/policies',
          icon: FileCheck,
          iconColor: 'text-emerald-500',
          module: 'policies',
        },
        {
          title: t('modules.newPolicy'),
          url: '/dashboard/policies/new',
          icon: FileText,
          iconColor: 'text-emerald-600',
          module: 'policies',
        },
        {
          title: t('modules.renewals'),
          url: '/dashboard/policies/renewals',
          icon: Clock,
          iconColor: 'text-emerald-700',
          module: 'policies',
        },
        {
          title: t('modules.expired'),
          url: '/dashboard/policies/expired',
          icon: AlertCircle,
          iconColor: 'text-red-500',
          module: 'policies',
        },
        {
          title: t('modules.policyTypes'),
          url: '/dashboard/policies/types',
          icon: Layers,
          iconColor: 'text-emerald-600',
          module: 'policies',
        },
      ],
    },
    // Claims Management Module
    {
      title: t('modules.claims'),
      url: '/dashboard/claims',
      icon: ClipboardList,
      iconColor: 'text-orange-600 dark:text-orange-400',
      isActive: pathname?.startsWith('/dashboard/claims'),
      module: 'claims',
      items: [
        {
          title: t('modules.allClaims'),
          url: '/dashboard/claims',
          icon: ClipboardList,
          iconColor: 'text-orange-500',
          module: 'claims',
        },
        {
          title: t('modules.newClaim'),
          url: '/dashboard/claims/new',
          icon: FileText,
          iconColor: 'text-orange-600',
          module: 'claims',
        },
        {
          title: t('modules.pending'),
          url: '/dashboard/claims/pending',
          icon: Clock,
          iconColor: 'text-yellow-600',
          module: 'claims',
        },
        {
          title: t('modules.approved'),
          url: '/dashboard/claims/approved',
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          module: 'claims',
        },
        {
          title: t('modules.rejected'),
          url: '/dashboard/claims/rejected',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          module: 'claims',
        },
        {
          title: t('modules.processing'),
          url: '/dashboard/claims/processing',
          icon: Workflow,
          iconColor: 'text-orange-700',
          module: 'claims',
        },
      ],
    },
    // Commission & Accounting Module
    {
      title: t('modules.accounting'),
      url: '/dashboard/accounting',
      icon: Calculator,
      iconColor: 'text-teal-600 dark:text-teal-400',
      isActive: pathname?.startsWith('/dashboard/accounting') || pathname?.startsWith('/dashboard/commission'),
      module: 'accounting',
      items: [
        {
          title: t('modules.commission'),
          url: '/dashboard/commission',
          icon: DollarSign,
          iconColor: 'text-teal-500',
          module: ['accounting', 'commission', 'calculator'],
        },
        {
          title: t('modules.payouts'),
          url: '/dashboard/commission/payouts',
          icon: Wallet,
          iconColor: 'text-teal-600',
          module: ['accounting', 'commission'],
        },
        {
          title: t('modules.invoices'),
          url: '/dashboard/accounting/invoices',
          icon: Receipt,
          iconColor: 'text-teal-700',
          module: 'accounting',
        },
        {
          title: t('modules.payments'),
          url: '/dashboard/accounting/payments',
          icon: CreditCard,
          iconColor: 'text-teal-800',
          module: 'accounting',
        },
        {
          title: t('modules.transactions'),
          url: '/dashboard/accounting/transactions',
          icon: Banknote,
          iconColor: 'text-teal-600',
          module: 'accounting',
        },
        {
          title: t('nav.reports'),
          url: '/dashboard/accounting/reports',
          icon: FileSpreadsheet,
          iconColor: 'text-teal-700',
          module: ['accounting', 'reports'],
        },
      ],
    },
    // Workflow & Automation Module
    {
      title: t('modules.workflows'),
      url: '/dashboard/workflows',
      icon: GitBranch,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      isActive: pathname?.startsWith('/dashboard/workflows') || (pathname?.startsWith('/dashboard/tasks') && !pathname?.includes('/tasks')),
      module: 'workflows',
      items: [
        {
          title: t('modules.workflows'),
          url: '/dashboard/workflows',
          icon: GitBranch,
          iconColor: 'text-indigo-500',
          module: 'workflows',
        },
        {
          title: t('modules.automations'),
          url: '/dashboard/workflows/automations',
          icon: Workflow,
          iconColor: 'text-indigo-600',
          module: 'workflows',
        },
        {
          title: t('modules.templates'),
          url: '/dashboard/workflows/templates',
          icon: Folder,
          iconColor: 'text-indigo-700',
          module: 'workflows',
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
          module: 'tasks',
        },
        {
          title: t('tasks.createTask'),
          url: '/dashboard/tasks/new',
          icon: FileText,
          iconColor: 'text-pink-600',
          module: 'tasks',
        },
        {
          title: t('tasks.myTasks'),
          url: '/dashboard/tasks/my-tasks',
          icon: UserCheck,
          iconColor: 'text-pink-700',
          module: 'tasks',
        },
      ],
    },
    // Notes Module
    {
      title: t('nav.notes'),
      url: '/dashboard/notes',
      icon: Lightbulb,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      isActive: pathname === '/dashboard/notes',
      module: 'notes',
    },
    // Scheduler Module
    {
      title: t('modules.scheduler'),
      url: '/dashboard/scheduler',
      icon: CalendarIcon,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      isActive: pathname?.startsWith('/dashboard/scheduler'),
      module: 'scheduler',
      items: [
        {
          title: t('modules.allEvents'),
          url: '/dashboard/scheduler',
          icon: CalendarIcon,
          iconColor: 'text-cyan-500',
          module: 'scheduler',
        },
        {
          title: t('modules.newEvent'),
          url: '/dashboard/scheduler/new',
          icon: FileText,
          iconColor: 'text-cyan-600',
          module: 'scheduler',
        },
        {
          title: t('modules.calendarView'),
          url: '/dashboard/scheduler?view=calendar',
          icon: Clock,
          iconColor: 'text-cyan-700',
          module: 'scheduler',
        },
      ],
    },
    // Inventory Module (if applicable for insurance products)
    {
      title: t('modules.inventory'),
      url: '/dashboard/inventory',
      icon: Package,
      iconColor: 'text-amber-600 dark:text-amber-400',
      isActive: pathname?.startsWith('/dashboard/inventory'),
      module: 'inventory',
      items: [
        {
          title: t('modules.allProducts'),
          url: '/dashboard/inventory',
          icon: Package,
          iconColor: 'text-amber-500',
          module: 'inventory',
        },
        {
          title: t('modules.categories'),
          url: '/dashboard/inventory/categories',
          icon: Layers,
          iconColor: 'text-amber-600',
          module: 'inventory',
        },
        {
          title: t('modules.stock'),
          url: '/dashboard/inventory/stock',
          icon: ShoppingCart,
          iconColor: 'text-amber-700',
          module: 'inventory',
        },
      ],
    },
    // Procurement Module
    {
      title: t('modules.procurement'),
      url: '/dashboard/procurement',
      icon: TruckIcon,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      isActive: pathname?.startsWith('/dashboard/procurement'),
      module: 'procurement',
      items: [
        {
          title: t('modules.purchaseOrders'),
          url: '/dashboard/procurement/orders',
          icon: FileText,
          iconColor: 'text-yellow-500',
          module: 'procurement',
        },
        {
          title: t('modules.suppliers'),
          url: '/dashboard/procurement/suppliers',
          icon: Building2,
          iconColor: 'text-yellow-600',
          module: 'procurement',
        },
        {
          title: t('modules.requisitions'),
          url: '/dashboard/procurement/requisitions',
          icon: ClipboardList,
          iconColor: 'text-yellow-700',
          module: 'procurement',
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
          module: 'users',
        },
        {
          title: t('users.createUser'),
          url: '/dashboard/users/new',
          icon: UserPlus,
          iconColor: 'text-violet-600',
          module: 'users',
        },
        {
          title: t('dashboard.orgChart') || 'Org Chart',
          url: '/dashboard/users/chart',
          icon: Network,
          iconColor: 'text-violet-700',
          module: 'users',
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
          module: 'roles',
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
          module: 'reports',
        },
        {
          title: 'Sales Reports',
          url: '/dashboard/reports/sales',
          icon: TrendingUp,
          iconColor: 'text-slate-600',
          module: 'reports',
        },
        {
          title: 'Financial Reports',
          url: '/dashboard/reports/financial',
          icon: DollarSign,
          iconColor: 'text-slate-700',
          module: 'reports',
        },
        {
          title: 'Performance',
          url: '/dashboard/reports/performance',
          icon: Award,
          iconColor: 'text-slate-600',
          module: 'reports',
        },
        {
          title: 'Custom Reports',
          url: '/dashboard/reports/custom',
          icon: PieChart,
          iconColor: 'text-slate-500',
          module: 'reports',
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

  /**
   * Filter navigation items based on permissions
   * - Filters parent modules without access
   * - Filters submenu items without access
   * - Hides parent menu if all subitems are filtered out
   */
  const filterNavItems = React.useMemo(() => {
    if (permissionsLoading) return [];
    
    const filtered = allNavItems
      .map((item) => {
        // If item has subitems, filter them based on permissions
        if (item.items && item.items.length > 0) {
          const filteredSubItems = item.items.filter((subItem: any) => {
            // If subitem has module defined, check permission
            if (subItem.module) {
              return canAccessModule(subItem.module);
            }
            // If no module defined, inherit parent permission
            return canAccessModule(item.module);
          });
          
          // If all subitems are filtered out, hide the parent entirely
          if (filteredSubItems.length === 0) {
            return null;
          }
          
          return {
            ...item,
            items: filteredSubItems,
          };
        }
        
        // For items without subitems, check parent module access
        return canAccessModule(item.module) ? item : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    
    return filtered;
  }, [permissionsLoading, allNavItems, canAccessModule]);

  // Filter navigation based on permissions
  const navMain = filterNavItems;
  const navSecondary = permissionsLoading
    ? []
    : allNavSecondary.filter((item) => canAccessModule(item.module));

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
            {permissionsLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <SidebarMenuSkeleton key={`nav-main-skeleton-${index}`} showIcon />
              ))
            ) : (
              navMain.map((item) => {
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
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>{t('common.more')}</SidebarGroupLabel>
          <SidebarMenu>
            {permissionsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <SidebarMenuSkeleton key={`nav-secondary-skeleton-${index}`} showIcon />
              ))
            ) : (
              navSecondary.map((item) => {
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
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Version Info */}
        <div className="px-3 py-2 border-t border-sidebar-border">
          <VersionDisplay variant="simple" className="text-xs text-muted-foreground" />
        </div>
        
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
                      src={user?.avatarUrl || user?.avatar}
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
                        src={user?.avatarUrl || user?.avatar}
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
