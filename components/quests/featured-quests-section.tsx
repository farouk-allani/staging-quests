'use client';

import { useState } from 'react';
import { Quest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Grid3X3, 
  List, 
  LayoutGrid, 
  ArrowRight, 
  Clock, 
  Users, 
  Trophy, 
  Star,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { QuestCard } from './quest-card';

interface FeaturedQuestsSectionProps {
  quests: Quest[];
  completedQuestIds: string[];
  onQuestSelect: (questId: string) => void;
}

type ViewMode = 'card' | 'list' | 'compact';

const difficultyConfig = {
  beginner: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', stars: 1 },
  easy: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', stars: 1 },
  intermediate: { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', stars: 2 },
  medium: { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', stars: 2 },
  advanced: { color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', stars: 3 },
  hard: { color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', stars: 3 },
  expert: { color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', stars: 4 },
  master: { color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', stars: 5 },
};

export function FeaturedQuestsSection({ quests, completedQuestIds, onQuestSelect }: FeaturedQuestsSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 auto-rows-fr">
      {quests.map((quest) => {
        const isCompleted = completedQuestIds.includes(String(quest.id));
        
        return (
          <QuestCard
            key={quest.id}
            quest={quest}
            isCompleted={isCompleted}
            onSelect={() => onQuestSelect(String(quest.id))}
          />
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4 mt-6">
      {quests.map((quest) => {
        const isCompleted = completedQuestIds.includes(String(quest.id));
        const difficultyInfo = difficultyConfig[quest.difficulty] || { color: 'text-gray-600', stars: 1 };
        
        return (
          <Card 
            key={quest.id} 
            className={cn(
              'group cursor-pointer transition-all duration-300 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] border-2 border-dashed hover:border-solid',
              'bg-gradient-to-r from-background via-background to-muted/20',
              isCompleted && 'ring-2 ring-green-500/30 bg-gradient-to-r from-green-50/60 via-background to-green-50/30 dark:from-green-950/30 dark:to-green-950/20 border-green-300 dark:border-green-700'
            )}
            onClick={() => onQuestSelect(String(quest.id))}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-bold text-lg font-mono bg-gradient-to-r from-foreground to-primary/80 bg-clip-text group-hover:text-primary transition-colors">
                      {quest.title}
                    </h3>
                    {isCompleted && (
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center animate-pulse rounded">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {quest.description}
                  </p>
                  <div className="flex items-center space-x-6 text-sm font-mono">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {quest.estimatedTime || 'TBD'}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      {quest.completions || 0}
                    </div>
                    <Badge className={cn(
                      'font-mono font-semibold',
                      difficultyInfo.bgColor,
                      difficultyInfo.color,
                      difficultyInfo.borderColor
                    )}>
                      {quest.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-6">
                  <div className="text-right">
                    <div className="flex items-center text-sm text-muted-foreground bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-2 rounded-lg border border-dashed border-yellow-500/30 font-mono">
                      <Trophy className="w-4 h-4 mr-1 text-yellow-600" />
                      <span className="font-bold text-yellow-700 dark:text-yellow-400">
                        {quest.reward || quest.points || (quest as any).points || 'TBD'} pts
                      </span>
                    </div>
                  </div>
                  <Button 
                    className={cn(
                      "font-mono border-2 border-dashed hover:border-solid transition-all duration-300",
                      "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
                      isCompleted && "bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30"
                    )}
                    variant={isCompleted ? "outline" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuestSelect(String(quest.id));
                    }}
                  >
                    {isCompleted ? 'View' : 'Start'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderCompactView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 auto-rows-fr">
      {quests.map((quest) => {
        const isCompleted = completedQuestIds.includes(String(quest.id));
        const difficultyInfo = difficultyConfig[quest.difficulty] || { color: 'text-gray-600', stars: 1 };
        
        return (
          <Card 
            key={quest.id} 
            className={cn(
              'group cursor-pointer transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-1px] hover:translate-y-[-1px] border-2 border-dashed hover:border-solid',
              'bg-gradient-to-br from-background to-muted/20 flex flex-col h-full',
              isCompleted && 'ring-2 ring-green-500/30 bg-gradient-to-br from-green-50/60 to-green-50/30 dark:from-green-950/30 dark:to-green-950/20 border-green-300 dark:border-green-700'
            )}
            onClick={() => onQuestSelect(String(quest.id))}
          >
            <CardContent className="p-4 flex flex-col h-full">
              <div className="relative mb-3 flex-shrink-0">
                <h3 className="font-bold text-sm font-mono line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] leading-tight">
                  {quest.title}
                </h3>
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 border border-green-300 shadow-sm flex items-center justify-center rounded">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <Badge className={cn(
                      'text-xs font-semibold',
                      difficultyInfo.bgColor,
                      difficultyInfo.color
                    )}>
                      {quest.difficulty.charAt(0).toUpperCase()}
                    </Badge>
                    <div className="flex items-center text-muted-foreground">
                      <Trophy className="w-3 h-3 mr-1 text-yellow-600" />
                      <span className="font-bold text-yellow-700 dark:text-yellow-400">
                        {quest.reward || quest.points || (quest as any).points || 'TBD'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {quest.completions || 0}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {quest.estimatedTime || 'TBD'}
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="sm"
                  className={cn(
                    "w-full text-xs font-mono border border-dashed hover:border-solid transition-all duration-300 mt-3",
                    "hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
                    isCompleted && "bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30"
                  )}
                  variant={isCompleted ? "outline" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuestSelect(String(quest.id));
                  }}
                >
                  {isCompleted ? 'View' : 'Start'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'list':
        return renderListView();
      case 'compact':
        return renderCompactView();
      default:
        return renderCardView();
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:border-solid transition-all duration-200">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10">
        <div className="flex items-center justify-between max-sm:flex-wrap">
          <CardTitle className="font-mono bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            FEATURED_QUESTS
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* View Toggle Controls */}
            {/* <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-dashed border-primary/20">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className={cn(
                  'h-8 w-8 p-0 font-mono transition-all duration-200',
                  viewMode === 'card' && 'shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  'h-8 w-8 p-0 font-mono transition-all duration-200',
                  viewMode === 'list' && 'shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                )}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('compact')}
                className={cn(
                  'h-8 w-8 p-0 font-mono transition-all duration-200',
                  viewMode === 'compact' && 'shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div> */}
            <Link href="/quests">
              <Button variant="outline" size="sm" className="font-mono border-dashed hover:border-solid transition-all duration-200">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="transition-all duration-300">
        {renderCurrentView()}
      </CardContent>
    </Card>
  );
}