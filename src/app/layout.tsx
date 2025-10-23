import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { Toaster } from "@/components/ui/sonner";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ameen Hub - User & Task Management System",
  description: "Enterprise-grade User Management and Task Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read locale from cookies on the server
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  
  return (
    <html suppressHydrationWarning lang={locale} dir={dir}>
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={true}
        >
          <I18nProvider>
            {children}
            <Toaster richColors position="top-center" />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
