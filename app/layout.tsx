import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Suspense } from 'react';
// import { ClientProvider } from '@/components/providers/client-provider';
import { NextAuthProvider } from '@/components/providers/nextauth-provider';
import { SessionSync } from '@/components/providers/session-sync';
import ErrorBoundary from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { AppContent } from '../components/app-content';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" attribute="class" enableSystem disableTransitionOnChange>
          <NextAuthProvider>
            <SessionSync />
            <ErrorBoundary>
              {/* <ClientProvider> */}
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }>
                  <AppContent>
                    {children}
                  </AppContent>
                </Suspense>
              {/* </ClientProvider> */}
            </ErrorBoundary>
          </NextAuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}