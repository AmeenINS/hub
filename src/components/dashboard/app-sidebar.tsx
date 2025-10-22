'use client';

import * as React from 'react';
import {
  Bot,
  ChevronRight,
  ChevronsUpDown,
  LifeBuoy,
  Settings2,
  SquareTerminal,
  Users,
  Shield,
  ListTodo,
  BarChart3,
  Bell,
  LogOut,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useAuthStore } from '@/store/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t, dir } = useI18n();
  const { user, logout, token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [permissions, setPermissions] = React.useState<Record<string, string[]>>({});
  const [loading, setLoading] = React.useState(true);

  // Fetch user permissions
  React.useEffect(() => {
    const fetchPermissions = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const modules = ['users', 'tasks', 'roles', 'reports', 'notifications', 'support'];
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
    return permissions[moduleName] && permissions[moduleName].length > 0;
  };

  // Navigation data based on user permissions
  const allNavItems = [
    {
      title: t('nav.dashboard'),
      url: '/dashboard',
      icon: SquareTerminal,
      isActive: pathname === '/dashboard',
      module: 'dashboard', // Dashboard is always accessible
    },
    {
      title: t('nav.users'),
      url: '/dashboard/users',
      icon: Users,
      isActive: pathname?.startsWith('/dashboard/users'),
      module: 'users',
      items: [
        {
          title: t('users.allUsers'),
          url: '/dashboard/users',
        },
        {
          title: t('users.createUser'),
          url: '/dashboard/users/new',
        },
      ],
    },
    {
      title: t('nav.tasks'),
      url: '/dashboard/tasks',
      icon: ListTodo,
      isActive: pathname?.startsWith('/dashboard/tasks'),
      module: 'tasks',
      items: [
        {
          title: t('tasks.allTasks'),
          url: '/dashboard/tasks',
        },
        {
          title: t('tasks.createTask'),
          url: '/dashboard/tasks/new',
        },
        {
          title: t('tasks.myTasks'),
          url: '/dashboard/tasks/my-tasks',
        },
      ],
    },
    {
      title: t('nav.roles'),
      url: '/dashboard/roles',
      icon: Shield,
      isActive: pathname?.startsWith('/dashboard/roles'),
      module: 'roles',
      items: [
        {
          title: t('roles.allRoles'),
          url: '/dashboard/roles',
        },
        {
          title: t('roles.permissions'),
          url: '/dashboard/roles/permissions',
        },
      ],
    },
    {
      title: t('nav.reports'),
      url: '/dashboard/reports',
      icon: BarChart3,
      isActive: pathname?.startsWith('/dashboard/reports'),
      module: 'reports',
    },
  ];

  const allNavSecondary = [
    {
      title: t('nav.notifications'),
      url: '/dashboard/notifications',
      icon: Bell,
      module: 'notifications',
    },
    {
      title: t('nav.settings'),
      url: '/dashboard/settings',
      icon: Settings2,
      module: 'settings', // Settings is always accessible
    },
    {
      title: t('common.support'),
      url: '/dashboard/support',
      icon: LifeBuoy,
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
              if (item.items) {
                return (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className={`${dir === 'rtl' ? 'mr-auto rotate-180' : 'ml-auto'} transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90`} />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
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
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
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
            {data.navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
                    <AvatarImage src={user?.avatar} alt={user?.firstName} />
                    <AvatarFallback className="rounded-lg">
                      {user?.firstName?.[0]?.toUpperCase()}
                      {user?.lastName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
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
                      <AvatarImage src={user?.avatar} alt={user?.firstName} />
                      <AvatarFallback className="rounded-lg">
                        {user?.firstName?.[0]?.toUpperCase()}
                        {user?.lastName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.firstName} {user?.lastName}
                      </span>
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
