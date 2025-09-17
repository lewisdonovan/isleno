import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { BudgetProvider } from "@/contexts/BudgetContext"
import { NextIntlClientProvider } from 'next-intl';
import { cookies, headers } from 'next/headers';
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Isleño",
  description: "Monday.com integration with charts and analytics",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const locale = cookieStore.get('locale')?.value || 'en';
  
  // Get the current pathname to determine if we're on an auth page
  const pathname = headersList.get('x-pathname') || '';
  const isAuthPage = pathname.startsWith('/auth/');

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error('Failed to load messages for locale:', locale);
    messages = (await import(`../../messages/en.json`)).default;
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider>
              <BudgetProvider>
                {isAuthPage ? (
                  // Clean layout for auth pages - no sidebar or top bar
                  <main className="min-h-screen">
                    {children}
                  </main>
                ) : (
                  // Normal layout with sidebar and top bar for app pages
              <SidebarProvider defaultOpen={false}>
                <div className="flex min-h-screen w-full">
                  <AppSidebar />
                  <main className="flex-1 min-w-0">
                    {children}
                  </main>
                </div>
              </SidebarProvider>
                )}
              </BudgetProvider>
            </SessionProvider>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
