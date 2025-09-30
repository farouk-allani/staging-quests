'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { QuestService } from '@/lib/services';
import { UserQuestService } from '@/lib/user-quest-service';
import { usePaginatedQuests } from '@/hooks/use-paginated-quests';
import { DashboardStats, Quest, User, Badge as BadgeType, Submission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {  ArrowRight, BookOpen } from 'lucide-react';
import { QuestCard } from '@/components/quests/quest-card';
import { QuestPagination } from '@/components/quests/quest-pagination';
import { FeaturedQuestsSection } from '@/components/quests/featured-quests-section';
import { TodoChecklist } from '@/components/onboarding/todo-checklist';
import { HeroCarousel } from '@/components/landing/hero-carousel';
import { FeatureHighlights } from '@/components/landing/feature-highlights';
import { StatsOverview } from '@/components/landing/stats-overview';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import useStore from '@/lib/store';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setUser } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [featuredQuests, setFeaturedQuests] = useState<Quest[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Use paginated quests hook for unstarted quests
  const unstartedQuests = usePaginatedQuests({
    initialPage: 1,
    itemsPerPage: 12,
    autoLoad: true, // Load immediately to get count for tab
    initialFilters: { status: 'unstarted' }
  });

  const user = currentUser || (session?.user?.userData as User | undefined);
  const isAuthenticated = !!session && !!user;

  const handleQuestSelect = (questId: string) => {
    router.push(`/quests/${questId}`);
  };

  // Redirect admin users to admin dashboard (fallback protection)
  useEffect(() => {
    if (user?.role === 'admin') {
      console.log('Dashboard: Admin user detected, redirecting to /admin');
      router.replace('/admin');
      return;
    }
  }, [user?.role, router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Dashboard: Loading data, session status:', status, 'user:', user);

        // Skip loading data if user is admin (admin dashboard doesn't need this data)
        if (user?.role === 'admin') {
          return;
        }

        // Load basic data for both authenticated and non-authenticated users
        const token = session?.user?.token;
        
        // Fetch fresh user profile if authenticated
        if (session && token) {
          try {
            const userProfile = await QuestService.getCurrentUser(token);
            if (userProfile) {
              setCurrentUser(userProfile);
              // Update the store with fresh user data
              setUser(userProfile);
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }
        }
        
        // Only load admin dashboard stats if user is admin
        const shouldLoadAdminStats = (user as any)?.role === 'admin';
        
        const [statsData, featuredQuestsResponse, completionsData] = await Promise.all([
          shouldLoadAdminStats ? QuestService.getDashboardStats(token).catch(() => null) : Promise.resolve(null),
          UserQuestService.getFeaturedQuests(1, 12, token).catch(() => ({ success: false, quests: [], page: 1, limit: 6, numberOfPages: 0 })),
          QuestService.getQuestCompletions(token).catch(() => ({ quests: [] })) // Fallback if API fails
        ]);

        // Extract featured quests from the new paginated response
        const featuredQuestsData = featuredQuestsResponse.quests || [];

        // Create a map of quest completions for quick lookup
        const completionsMap = new Map();
        if (completionsData.quests) {
          completionsData.quests.forEach((quest: any) => {
            completionsMap.set(String(quest.id), quest.completions?.length || 0);
          });
        }

        // Enhance featured quests with real completion data
        const enhancedFeaturedQuests = featuredQuestsData.map(quest => ({
          ...quest,
          completions: completionsMap.get(String(quest.id)) || quest.completions || 0
        }));

        setStats(statsData);
        // Filter featured quests to only show active ones
        const now = new Date();

        // const activeFeaturedQuests = enhancedFeaturedQuests.filter(quest =>
        //   (quest.status === 'active' || quest.status === 'published') &&
        //   quest.user_status === 'unstarted' &&
        //   quest.endDate && new Date(quest.endDate) > now
        // );

        setFeaturedQuests(enhancedFeaturedQuests);


        // Only load user-specific data if user is authenticated
        if (user) {
          try {
            // Use appropriate API based on user role:
            // - Admin users: Use getSubmissions (admin endpoint) to see all submissions
            // - Regular users: Use getUserCompletions (user-specific endpoint) to see only their own completions
            const isAdmin = (user as any)?.role === 'admin';
            
            const [badgesData, submissionsData] = await Promise.all([
              QuestService.getUserBadges(String(user.id), token).catch(() => []),
              isAdmin 
                ? QuestService.getSubmissions(undefined, String(user.id), token).catch(() => [])
                : QuestService.getUserCompletions(token).catch(() => [])
            ]);
            setBadges(badgesData || []);
            setSubmissions(submissionsData || []);
          } catch (error) {
            console.error('Failed to load user data:', error);
            setBadges([]);
            setSubmissions([]);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only load data when session is loaded
    if (status !== 'loading') {
      loadData();
    }
  }, [router, status, session]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading spinner while redirecting admin users (fallback)
  if (user?.role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-muted-foreground font-mono">Redirecting to admin dashboard...</p>
      </div>
    );
  }

  // Debug logging
  console.log('Dashboard render - Session status:', status);
  console.log('Dashboard render - Current user from state:', currentUser);
  console.log('Dashboard render - Session user data:', session?.user?.userData);
  console.log('Dashboard render - Final user object:', user);
  console.log('Dashboard render - Is authenticated:', isAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Hero Carousel for Non-Authenticated Users */}
        <div className="w-full">
          <HeroCarousel />
        </div>
        
        {/* Platform Statistics */}
        <StatsOverview />
        
        {/* Feature Highlights */}
        <FeatureHighlights />
        
        {/* Call to Action */}
        <div className="text-center py-8 sm:py-10 lg:py-12 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl sm:rounded-2xl border-2 border-dashed border-primary/20 mx-2 sm:mx-0">
          <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-2 sm:mb-4">ROCKET</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent leading-tight">
              Ready to Start Your Journey?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-mono max-w-2xl mx-auto px-2">
              {'>'} Join thousands of developers mastering Hedera blockchain development through interactive quests.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-mono border-dashed hover:border-solid transition-all duration-200 group text-sm sm:text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-mono border-dashed hover:border-solid transition-all duration-200 text-sm sm:text-base">
                  Sign In
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full sm:w-auto font-mono border-dashed hover:border-solid transition-all duration-200 text-sm sm:text-base"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quest filtering logic for authenticated users
  const completedQuestIds = submissions
    .filter(s => s.status === 'approved')
    .map(s => s.questId);

  // No need for manual loading since autoLoad is now true

  // Update search when search term changes
  useEffect(() => {
    if (activeTab === 'quests') {
      const timeoutId = setTimeout(() => {
        unstartedQuests.updateFilters({ status: 'unstarted', search: searchTerm });
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, activeTab]);

  const filteredQuests = unstartedQuests.quests.filter((quest: Quest) => {
    const matchesCategory = selectedCategory === 'all' || quest.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || quest.difficulty === selectedDifficulty;
    
    return matchesCategory && matchesDifficulty;
  });


  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Hero Carousel for All Users */}
      <div className="w-full">
        <HeroCarousel />
      </div>
      
      {/* Personalized Welcome Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-blue-500/10 rounded-lg" />
        <div className="relative bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary/20 rounded-lg p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent font-mono leading-tight">
                  Welcome back, {(() => {
                    if (user?.firstName && user?.lastName) {
                      return `${user.firstName} ${user.lastName}`;
                    }
                    return user?.username || user?.name || '';
                  })()}!
                </h1>
              </div>
              {/* <p className="text-muted-foreground font-mono text-sm">
                {'>'} Continue your quest journey • Streak: {user?.streak || 0} days
              </p> */}
            </div>
            <div className="flex-shrink-0 text-center sm:text-right bg-gradient-to-br from-primary/5 to-cyan-500/5 p-3 sm:p-4 rounded-lg border border-dashed border-primary/20">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                {(user?.total_points || user?.points || 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground text-xs sm:text-sm font-mono">TOTAL_POINTS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Todo Checklist - Setup Progress */}
      <TodoChecklist user={user} />



      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-lg p-1 h-auto">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm font-mono data-[state=active]:bg-background data-[state=active]:text-primary py-2 px-1 sm:px-3"
          >
            TOP QUESTS
          </TabsTrigger>
          <TabsTrigger 
            value="quests" 
            className="text-xs sm:text-sm font-mono data-[state=active]:bg-background data-[state=active]:text-primary py-2 px-1 sm:px-3"
          >
            QUESTS ({unstartedQuests.totalItems})
          </TabsTrigger>
          <TabsTrigger 
            value="progress" 
            className="text-xs sm:text-sm font-mono data-[state=active]:bg-background data-[state=active]:text-primary py-2 px-1 sm:px-3"
          >
            PROGRESS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">{/* Level Progress - Commented out */}
          {/* <Card className="border-2 border-dashed border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 hover:border-solid transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
              <CardTitle className="flex items-center gap-2 font-mono">
                <div className="p-1 bg-yellow-500/20 rounded border border-dashed border-yellow-500/40">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                LEVEL_PROGRESS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 mt-2">
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-mono">
                  <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent font-bold">
                    LVL_{user?.userLevel?.level || user?.level || 1}
                  </span>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent font-bold">
                    LVL_{(user?.userLevel?.level || user?.level || 1) + 1}
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={user?.userLevel ? (user.userLevel.progress / user.userLevel.max_progress) * 100 : 0} 
                    className="h-4 border border-dashed border-primary/20" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
                </div>
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>{user?.userLevel?.progress || 0} XP</span>
                  <span>{user?.userLevel?.max_progress || 100} XP</span>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Featured Quests */}
          <FeaturedQuestsSection
            quests={featuredQuests}
            completedQuestIds={completedQuestIds}
            onQuestSelect={(questId) => router.push(`/quests/${questId}`)}
          />


        </TabsContent>

        <TabsContent value="quests" className="space-y-4 sm:space-y-6">
          {/* Quest Filters */}
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:border-solid transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 font-mono text-sm sm:text-base">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                QUEST_EXPLORER
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-mono text-muted-foreground uppercase tracking-wider">SEARCH</label>
                  <div className="relative">
                    {/* Show loading indicator while search is being processed */}
                    {unstartedQuests.isLoading && searchTerm && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                    <Input
                      placeholder="Search unstarted quests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="font-mono border-dashed text-sm pr-10"
                    />
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">CATEGORY</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="font-mono border-dashed">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="capitalize">
                          {category?.replace('-', ' ') || category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">DIFFICULTY</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="font-mono border-dashed">
                      <SelectValue placeholder="All difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      {difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty} className="capitalize">
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Quest Grid */}
          {unstartedQuests.isLoading && unstartedQuests.quests.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-2 text-sm">Loading quests...</p>
            </div>
          ) : (
            <>
              {filteredQuests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredQuests.map((quest: Quest) => (
                    <QuestCard 
                      key={quest.id} 
                      quest={quest} 
                      isCompleted={completedQuestIds.includes(String(quest.id))}
                      onSelect={() => handleQuestSelect(String(quest.id))}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
                  <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
                    <div className="text-4xl sm:text-6xl mb-4">TARGET</div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 font-mono text-primary">NO_QUESTS_FOUND</h3>
                    <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                      {'>'} Try adjusting your filters or check back later for new quests.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Pagination */}
              {unstartedQuests.totalPages > 1 && (
                <div className="mt-8">
                  <QuestPagination
                    currentPage={unstartedQuests.currentPage}
                    totalPages={unstartedQuests.totalPages}
                    onPageChange={unstartedQuests.goToPage}
                    hasNextPage={unstartedQuests.hasNextPage}
                    hasPreviousPage={unstartedQuests.hasPreviousPage}
                    isLoading={unstartedQuests.isLoading}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 sm:space-y-6">
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-4">CHART</div>
            <h3 className="text-base sm:text-lg font-semibold mb-2 font-mono text-primary">PROGRESS_TRACKING</h3>
            <p className="text-muted-foreground font-mono text-xs sm:text-sm px-4">
              {'>'} Detailed progress analytics coming soon.
            </p>
            <Link href="/progress">
              <Button className="mt-4 font-mono border-dashed hover:border-solid transition-all duration-200 text-sm">
                View Full Progress <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}