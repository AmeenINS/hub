'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { Spinner } from '@/components/ui/spinner';
import { RTLSidebarWrapper } from '@/components/ui/rtl-sidebar-wrapper';
import { Separator } from '@/components/ui/separator';
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
            </div>
          </header>
          
          {/* Main content with bottom padding for mobile nav */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
              {children}
            </div>
          </main>
        </SidebarInset>
        
        {/* Mobile bottom navigation */}
        <MobileNav />
      </SidebarProvider>
    </RTLSidebarWrapper>
  );
}
