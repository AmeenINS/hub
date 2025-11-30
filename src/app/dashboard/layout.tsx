'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lightbulb, Calculator, Settings2, LogOut, ChevronsUpDown, Users } from 'lucide-react';
import { useAuthStore } from '@/shared/state/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ThemeToggle } from '@/shared/components/theme/theme-toggle';
import { LanguageToggle } from '@/shared/components/theme/language-toggle';
import { useI18n } from '@/shared/i18n/i18n-context';
import { getLocalizedUserName, getUserInitials } from '@/core/utils';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/shared/components/ui/sidebar';
import { AppSidebar } from '@/features/dashboard/components/app-sidebar';
import { MobileNav } from '@/features/dashboard/components/mobile-nav';
import { Spinner } from '@/shared/components/ui/spinner';
import { RTLSidebarWrapper } from '@/shared/components/ui/rtl-sidebar-wrapper';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import SchedulerNotificationService from '@/features/scheduler/components/notification-service';
import { NotificationButton } from '@/features/dashboard/components/notification-button';
import { useModuleVisibility } from '@/shared/hooks/use-module-visibility';
import { BackButton } from '@/shared/components/navigation/back-button';
import 'overlayscrollbars/overlayscrollbars.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuthStore();
  const { t, dir, locale } = useI18n();
  const { hasAccess: canAccessModule, isLoading: permissionsLoading } = useModuleVisibility();

  const showCalculatorShortcut = !permissionsLoading && canAccessModule('accounting');
  const showNotesShortcut = !permissionsLoading && canAccessModule('notes');
  const showNotificationButton = !permissionsLoading && canAccessModule('notifications');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  useEffect(() => {
    // Wait for store to rehydrate
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <RTLSidebarWrapper>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header with hamburger menu */}
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/50">
            <div className="flex items-center gap-2 px-4 w-full">
              {/* Mobile hamburger menu */}
              <SidebarTrigger className="md:hidden -ml-1 rtl:ml-0 rtl:-mr-1" />
              {/* Desktop sidebar toggle */}
              <SidebarTrigger className="hidden md:flex -ml-1 rtl:ml-0 rtl:-mr-1" />
              <Separator orientation="vertical" className="mr-2 rtl:mr-0 rtl:ml-2 h-4" />
              
              {/* Back Button */}
              <BackButton className="ml-1 rtl:ml-0 rtl:mr-1" />
              
              {/* Spacer to push buttons to the right */}
              <div className="flex-1" />
              
              {/* Calculator quick access button */}
              {showCalculatorShortcut && (
                <Button variant="ghost" size="icon" asChild className="ml-2 rtl:ml-0 rtl:mr-2">
                  <Link href="/dashboard/calculator">
                    <Calculator className="h-5 w-5" />
                  </Link>
                </Button>
              )}

              {/* Notes quick access button */}
              {showNotesShortcut && (
                <Button variant="ghost" size="icon" asChild className="ml-2 rtl:ml-0 rtl:mr-2">
                  <Link href="/dashboard/notes">
                    <Lightbulb className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              
              {/* Notification button */}
              {showNotificationButton && <NotificationButton />}
              
              {/* User menu dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-2 rtl:ml-0 rtl:mr-2 h-10 px-2 gap-2 hover:bg-accent/50">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.avatarUrl || user?.avatar}
                        alt={user ? getLocalizedUserName(user, locale) : undefined}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user ? getUserInitials(user) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user ? getLocalizedUserName(user, locale) : 'User'}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg backdrop-blur-xl bg-background/95 supports-backdrop-filter:bg-background/80"
                  side="bottom"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                      <Avatar className="h-10 w-10 rounded-lg">
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
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                      <Users className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                      {t('nav.profile')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                      <Settings2 className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                      {t('nav.settings')}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <div className="flex items-center justify-between w-full cursor-pointer">
                        <span>{t('common.theme')}</span>
                        <ThemeToggle />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <div className="flex items-center justify-between w-full cursor-pointer">
                        <span>{t('common.language')}</span>
                        <LanguageToggle />
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Main content with bottom padding for mobile nav */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
              {children}
            </div>
          </main>
          
          {/* Background scheduler notification service */}
          <SchedulerNotificationService />
        </SidebarInset>
        
        {/* Mobile bottom navigation */}
        <MobileNav />
      </SidebarProvider>
    </RTLSidebarWrapper>
  );
}
