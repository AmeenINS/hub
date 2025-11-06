'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lightbulb, Calculator } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { Spinner } from '@/components/ui/spinner';
import { RTLSidebarWrapper } from '@/components/ui/rtl-sidebar-wrapper';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import SchedulerNotificationService from '@/components/scheduler/notification-service';
import { NotificationButton } from '@/components/dashboard/notification-button';
import 'overlayscrollbars/overlayscrollbars.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

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
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2 px-4 w-full">
              {/* Mobile hamburger menu */}
              <SidebarTrigger className="md:hidden -ml-1 rtl:-ml-0 rtl:-mr-1" />
              {/* Desktop sidebar toggle */}
              <SidebarTrigger className="hidden md:flex -ml-1 rtl:-ml-0 rtl:-mr-1" />
              <Separator orientation="vertical" className="mr-2 rtl:mr-0 rtl:ml-2 h-4" />
              
              {/* Spacer to push buttons to the right */}
              <div className="flex-1" />
              
              {/* Calculator quick access button */}
              <Button variant="ghost" size="icon" asChild className="ml-2 rtl:ml-0 rtl:mr-2">
                <Link href="/dashboard/calculator">
                  <Calculator className="h-5 w-5" />
                </Link>
              </Button>

              {/* Notes quick access button */}
              <Button variant="ghost" size="icon" asChild className="ml-2 rtl:ml-0 rtl:mr-2">
                <Link href="/dashboard/notes">
                  <Lightbulb className="h-5 w-5" />
                </Link>
              </Button>
              
              {/* Notification button */}
              <NotificationButton />
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
