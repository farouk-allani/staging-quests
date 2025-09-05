'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { AuthPage } from '@/components/auth/auth-page';
import { SocialMediaPromptModal } from '@/components/admin/social-media-prompt-modal';
import { User } from '@/lib/types';
import { BalanceWidget } from '@/components/ui/balance-widget';

export function AppContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSocialMediaPrompt, setShowSocialMediaPrompt] = useState(false);
  const [hasCheckedSocialMedia, setHasCheckedSocialMedia] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log('AppContent: Session status:', status, 'Session exists:', !!session);

  const isLoading = status === 'loading';
  const isAuthenticated = !!session && !!session.user;
  const user = (session?.user?.userData as User | undefined) || (session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    role: session.user.role || 'user',
    avatar: session.user.image || '/logo.png',
  } as User : undefined);

  console.log('AppContent: isAuthenticated:', isAuthenticated, 'user exists:', !!user, 'user role:', user?.role);

  // Debug session user object
  if (session?.user) {
    console.log('AppContent: Session user keys:', Object.keys(session.user));
    console.log('AppContent: Session user data:', session.user);
    console.log('AppContent: Session user has userData:', !!session.user.userData);
  }

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const hideFooter = pathname === '/validate-user';

  // Redirect admin users to admin dashboard immediately
  useEffect(() => {
    if (user && user.role === 'admin' && isAuthenticated && !isLoading) {
      // Only redirect if not already on an admin page
      if (!pathname.startsWith('/admin')) {
        router.push('/admin');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);

  // Check for missing social media connections for admin users
  useEffect(() => {
    if (user && user.role === 'admin' && isAuthenticated && !isLoading && !hasCheckedSocialMedia) {
      const userData = user as any; // Cast to any to access social media properties
      const hasMissingSocialMedia = !userData.twitterProfile || !userData.facebookProfile || !userData.discordProfile;
      const isDismissed = localStorage.getItem('socialMediaPromptDismissed') === 'true';

      if (hasMissingSocialMedia && !isDismissed) {
        // Small delay to ensure the admin interface is fully loaded
        const timer = setTimeout(() => {
          setShowSocialMediaPrompt(true);
        }, 1000);

        return () => clearTimeout(timer);
      }

      setHasCheckedSocialMedia(true);
    }
  }, [user, isAuthenticated, isLoading, hasCheckedSocialMedia]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('AppContent: Not authenticated, showing AuthPage');
    return <AuthPage />;
  }

  if (!user) {
    console.log('AppContent: Session exists but no userData, showing AuthPage');
    return <AuthPage />;
  }

  if (user.role === 'admin') {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={user?.role || 'user'}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Social Media Prompt Modal */}
        <SocialMediaPromptModal
          user={user as any}
          isOpen={showSocialMediaPrompt}
          onClose={() => {
            setShowSocialMediaPrompt(false);
            setHasCheckedSocialMedia(true);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <ConditionalLayout>
        {children}
      </ConditionalLayout>

      {/* Balance Widget - Shows for all authenticated users except loading states */}
      {isAuthenticated && user && !isLoading && !hideFooter && (
        <BalanceWidget />
      )}
    </>
  );
}