'use client';

import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { cn } from '@/lib/utils';

interface UserLayoutProps {
  children: ReactNode;
  className?: string;
}

export function UserLayout({ children, className }: UserLayoutProps) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const hideFooter = pathname === '/validate-user';
  return (
    <div className="min-h-screen bg-background font-mono flex flex-col">
      {!hideFooter && <Navbar />}
      <main className={cn(
        'flex-1 container mx-auto px-4 py-6 space-y-6',
        className
      )}>
        {children}
      </main>
      {!hideFooter && (
        <footer className="border-t-2 border-dashed border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>&copy; 2025 Hedera Quest. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}