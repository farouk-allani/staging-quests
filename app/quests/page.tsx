'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Quest, FilterOptions, User } from '@/lib/types';
import { QuestService } from '@/lib/services';
import { QuestCard } from '@/components/quests/quest-card';
import { QuestFilters } from '@/components/quests/quest-filters';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter, Grid, List, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export default function QuestsPage() {
  const router = useRouter();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    difficulties: [],
    search: '',
    showCompleted: false
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
   const { data: session } = useSession();



  // useEffect(() => {
  //   const loadData = async () => {
  //     setIsLoading(true);
  //     try {
  //       const [questsData, userData] = await Promise.all([
  //         QuestService.getQuests(filters),
  //         QuestService.getCurrentUser()
  //       ]);
  //       setQuests(Array.isArray(questsData) ? questsData : []);
  //       setUser(userData);
  //     } catch (error) {
  //       console.error('Failed to load quests:', error);
  //       setQuests([]);
  //       setUser(null);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadData();
  // }, [filters]);

  
useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [questsData, userData] = await Promise.all([
        QuestService.getQuests({
          categories: [],
          difficulties: [],
          search: '',
          showCompleted: false
        },session?.user?.token), // charge TOUTES les quêtes une seule fois
        QuestService.getCurrentUser(session?.user?.token)
      ]);
      setQuests(Array.isArray(questsData) ? questsData : []);
      setUser(userData);
    } catch (error) {
      console.error('Failed to load quests:', error);
      setQuests([]);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  loadData();
}, []); // ⬅️ uniquement au montage


  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleQuestSelect = (quest: Quest) => {
    router.push(`/quests/${quest.id}`);
  };



const now = new Date();

// const activeQuests = enhancedQuests.filter(quest =>
//   (quest.status === 'active' || quest.status === 'published') &&
//   quest.user_status === 'unstarted' &&
//   quest.endDate && new Date(quest.endDate) > now
// );

const isExpired = (quest: Quest): boolean => {
  return !!quest.endDate && new Date(quest.endDate) < now;
};


const isQuestCompleted = (quest: Quest) =>
  quest.user_status === "validated";

// ✅ Vérifie si la quête est rejetée via user_status
const isQuestRejected = (quest: Quest) =>
  quest.user_status === "rejected";

// ✅ Vérifie si la quête est en attente via user_status
const isQuestPending = (quest: Quest) =>
  quest.user_status === "pending";

// ✅ Filtrage global (hors complété)
const baseFilteredQuests = quests.filter((quest) => {
  const isActive = quest.status === "active" || quest.status === "published";
  if (!isActive) return false;

  if (
    filters.search &&
    !(
      quest.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      quest.description?.toLowerCase().includes(filters.search.toLowerCase())
    )
  ) {
    return false;
  }

  if (
    filters.categories.length > 0 &&
    (!quest.category || !filters.categories.includes(quest.category))
  ) {
    return false;
  }

  if (
    filters.difficulties.length > 0 &&
    !filters.difficulties.includes(quest.difficulty)
  ) {
    return false;
  }

  return true;
});


// ✅ Filtrage global
const filteredQuests = quests.filter((quest) => {
  const isActive = quest.status === "active" || quest.status === "published";
  if (!isActive) return false;

  const isCompleted = isQuestCompleted(quest);

  if (filters.showCompleted) {
    // si on veut voir uniquement les complétées
    if (!isCompleted) return false;
  } else {
    // si on veut cacher les complétées
    if (isCompleted) return false;
  }

  if (
    filters.search &&
    !(
      quest.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      quest.description?.toLowerCase().includes(filters.search.toLowerCase())
    )
  ) {
    return false;
  }

  if (
    filters.categories.length > 0 &&
    (!quest.category || !filters.categories.includes(quest.category))
  ) {
    return false;
  }

  if (
    filters.difficulties.length > 0 &&
    !filters.difficulties.includes(quest.difficulty)
  ) {
    return false;
  }

  return true;
});



  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-lg" />
        <div className="relative bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary/20 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Discover Quests
              </h1>
              <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                {'>'} Explore {quests.length} quests to master the Hedera ecosystem
              </p>
            </div>
        
            {/* <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 border-2 border-dashed hover:border-solid transition-all duration-200 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] font-mono text-xs sm:text-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{showFilters ? '[Hide]' : '[Show]'} Filters</span>
                <span className="sm:hidden">{showFilters ? 'Hide' : 'Filter'}</span>
              </Button>
              
              <div className="flex border-2 border-dashed border-muted rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "rounded-none border-r border-dashed font-mono",
                    viewMode === 'grid' && "shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "rounded-none font-mono",
                    viewMode === 'list' && "shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative w-full sm:max-w-md lg:max-w-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-lg" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
         <Input
  placeholder="> Type to search quests..."
  className="pl-10 border-2 border-dashed hover:border-solid transition-all duration-200 font-mono bg-background/50 backdrop-blur-sm w-full"
  value={filters.search}
  onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
    }
  }}
/>

        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 relative">
        {/* Mobile Overlay for Filters */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowFilters(false)} />
        )}
        
        {/* Sidebar Filters */}
        {showFilters && (
          <div className={cn(
            "bg-background border rounded-lg p-4",
            // Mobile: fixed overlay
            "fixed top-4 left-4 right-4 bottom-4 z-50 overflow-y-auto md:static md:inset-auto md:z-auto md:overflow-visible",
            // Desktop: normal sidebar
            "md:w-80 md:flex-shrink-0"
          )}>
            {/* Mobile close button */}
            <div className="flex justify-between items-center mb-4 md:hidden">
              <h3 className="font-semibold">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <QuestFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              className="md:sticky md:top-4"
            />
          </div>
        )}

        {/* Quest Content */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="all" className="space-y-4 md:space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="bg-gradient-to-r from-background via-muted/50 to-background border-2 border-dashed border-muted p-1 w-max md:w-auto">
               
                <TabsTrigger 
                  value="all"
                  className="font-mono data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  All Quests ({baseFilteredQuests.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="available"
                  className="font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Available ({baseFilteredQuests.filter((q) => !isQuestCompleted(q) && !isQuestRejected(q) && !isExpired(q) && !isQuestPending(q)).length})
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className="font-mono data-[state=active]:bg-green-500 data-[state=active]:text-green-900 data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(0,255,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Completed ({baseFilteredQuests.filter((q) => isQuestCompleted(q)).length})
                </TabsTrigger>
                 <TabsTrigger 
                  value="pending"
                  className="font-mono data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-900 data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(255,255,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Pending ({baseFilteredQuests.filter((q) => isQuestPending(q)).length})
                </TabsTrigger>
           
                <TabsTrigger 
                  value="rejected"
                  className="font-mono data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-[inset_2px_2px_0px_0px_rgba(255,0,0,0.1)] transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  Rejected ({baseFilteredQuests.filter((q) => isQuestRejected(q)).length})
                </TabsTrigger>
             
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4 md:space-y-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
                  {baseFilteredQuests.map((quest) => (
                   <QuestCard
      key={quest.id}
      quest={quest}
      isCompleted={isQuestCompleted(quest)}
      isPending={isQuestPending(quest)}
      isRejected={isQuestRejected(quest)}
      isExpired={isExpired(quest)}
      onSelect={() => handleQuestSelect(quest)}
    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {baseFilteredQuests.map((quest) => (
                    <div key={quest.id} className="border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer"
                         onClick={() => handleQuestSelect(quest)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base md:text-lg font-semibold truncate">{quest.title}</h3>
                            {user?.completedQuests?.includes(String(quest.id)) && (
                              <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 md:w-3 md:h-3 text-white text-xs">✓</div>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-3 text-sm md:text-base overflow-hidden"
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical' as const
                             }}>{quest.description}</p>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                            <span className="capitalize">{(quest.category || 'general').replace('-', ' ')}</span>
                            <span className="capitalize">{quest.difficulty}</span>
                            <span>{quest.estimatedTime}</span>
                            <span>{quest.points} points</span>
                          </div>
                        </div>
                        <Button size="sm" className="flex-shrink-0">
                          {user?.completedQuests?.includes(String(quest.id)) ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredQuests.length === 0 && (
                <div className="text-center py-8 md:py-12 px-4">
                  <p className="text-muted-foreground mb-4 text-sm md:text-base">No quests found matching your criteria.</p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      categories: [],
                      difficulties: [],
                      search: '',
                      showCompleted: false
                    })}
                    className="text-sm"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </TabsContent>




            <TabsContent value="available">
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
                  : 'space-y-3 md:space-y-4'
              )}>
                {baseFilteredQuests
                 .filter((q) => !isQuestCompleted(q) && !isQuestRejected(q) && !isExpired(q) && !isQuestPending(q))
    .map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      isCompleted={false}
                      onSelect={() => handleQuestSelect(quest)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
                  : 'space-y-3 md:space-y-4'
              )}>
                {baseFilteredQuests
    .filter((q) => isQuestCompleted(q))
    .map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      isCompleted={true}
                      onSelect={() => handleQuestSelect(quest)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="pending">
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
                  : 'space-y-3 md:space-y-4'
              )}>
                {baseFilteredQuests
                  .filter((q) => isQuestPending(q))
                  .map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      isCompleted={false}
                      isPending={true}
                      onSelect={() => handleQuestSelect(quest)}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
                  : 'space-y-3 md:space-y-4'
              )}>
                {baseFilteredQuests
                  .filter((q) => isQuestRejected(q))
                  .map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      isCompleted={false}
                      isRejected={true}
                      onSelect={() => handleQuestSelect(quest)}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
