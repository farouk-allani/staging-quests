'use client';

import { Quest } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface QuestCardProps {
  quest: Quest;
  isCompleted?: boolean;
  isRejected?: boolean;
  isPending?: boolean;
  isExpired?: boolean;
  progress?: number;
  onSelect: () => void;
}

const categoryColors = {
  'getting-started': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300',
  'defi': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300',
  'nfts': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300',
  'development': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300',
  'consensus': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-300',
  'smart-contracts': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300',
  'token-service': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
  'file-service': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300',
  'community': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-300',
};

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

export function QuestCard({ quest, isCompleted = false, isRejected = false, isPending = false, isExpired = false, progress = 0, onSelect }: QuestCardProps) {
  const categoryColor = quest.category ? categoryColors[quest.category] : '';
  const difficultyInfo = difficultyConfig[quest.difficulty] || { color: 'text-gray-600', stars: 1 };

  const handleQuestSelect = () => {
    onSelect();
  };

  return (
    <Card className={cn(
      'group cursor-pointer transition-all duration-200 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] border-2 border-dashed hover:border-solid',
      'bg-gradient-to-br from-background via-background to-muted/20',
      'ring-2 ring-green-500/20 bg-gradient-to-br from-green-50/50 via-background to-green-50/20 dark:from-blue-950/20 dark:to-blue-950/10 border-blue-300 dark:border-blue-700',
      'flex flex-col h-full',
      isCompleted && 'ring-2 ring-green-500/20 bg-gradient-to-br from-green-50/50 via-background to-green-50/20 dark:from-green-950/20 dark:to-green-950/10 border-green-300 dark:border-green-700',
      isRejected && 'ring-2 ring-red-500/20 bg-gradient-to-br from-red-50/50 via-background to-red-50/20 dark:from-red-950/20 dark:to-red-950/10 border-red-300 dark:border-red-700',
      isPending && 'ring-2 ring-yellow-500/20 bg-gradient-to-br from-yellow-50/50 via-background to-yellow-50/20 dark:from-yellow-950/20 dark:to-yellow-950/10 border-yellow-300 dark:border-yellow-700',
      isExpired && 'ring-2 ring-gray-500/20 bg-gradient-to-br from-gray-50/50 via-background to-gray-50/20 dark:from-gray-950/20 dark:to-gray-950/10 border-gray-300 dark:border-gray-700',
    )}>
      <div className="relative p-4">
        {isCompleted && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 border-2 border-green-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center animate-pulse z-10">
            <Trophy className="w-4 h-4 text-white" />
          </div>
        )}
        {isRejected && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded shadow z-10 animate-pulse">
            Rejected
          </div>
        )}
        {isPending && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded shadow z-10 animate-pulse">
            Pending
          </div>
        )}
        {isExpired && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-gray-600 text-white text-xs rounded shadow z-10 animate-pulse">
            Expired
          </div>
        )}
      </div>
      
      <CardContent className="p-4 relative bg-gradient-to-b from-transparent to-primary/5 flex-grow flex flex-col">
        
        <div className="flex items-start justify-between mb-2">
           {isCompleted && 
          <h3 className="font-semibold text-lg leading-tight group-hover:text-green-500 transition-colors font-mono">
            {quest.title}
          </h3>
          }
          {isRejected && (
            <h3 className="font-semibold text-lg leading-tight group-hover:text-red-500 transition-colors font-mono">
              {quest.title}
            </h3>
          )}
          {isPending && (
            <h3 className="font-semibold text-lg leading-tight group-hover:text-yellow-500 transition-colors font-mono">
              {quest.title}
            </h3>
          )}

          {!isCompleted && !isRejected && !isPending && !isExpired && (
            <h3 className="font-semibold text-lg leading-tight group-hover:text-blue-500 transition-colors font-mono">
              {quest.title}
            </h3>
          )}
          {isExpired && (
            <h3 className="font-semibold text-lg leading-tight group-hover:text-gray-500 transition-colors font-mono">
              {quest.title}
            </h3>
          )}

          <div className="flex items-center text-sm text-muted-foreground ml-2 bg-muted/30 px-2 py-1 rounded border border-dashed font-mono">
            <Trophy className="w-4 h-4 mr-1" />
{quest.reward || quest.points || (quest as any).points || 'TBD'} pts
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {quest.description}
        </p>
        
        <div className="flex items-center justify-between text-sm bg-muted/20 p-2 rounded border border-dashed">
          <div className="flex items-center space-x-4 font-mono">
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              {quest.estimatedTime || 'TBD'}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="w-4 h-4 mr-1" />
              {quest.completions || 0}
            </div>
          </div>
          
          <Badge className={cn(
            'font-mono font-semibold shadow-sm border',
            difficultyInfo.bgColor,
            difficultyInfo.color,
            difficultyInfo.borderColor,
            'dark:bg-opacity-20 dark:border-opacity-50'
          )}>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                difficultyInfo.color.replace('text-', 'bg-')
              )}></div>
              {quest.difficulty.toUpperCase()}
            </div>
          </Badge>
        </div>

        {/* Spacer to push progress to bottom */}
        <div className="flex-grow"></div>

        {progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto">
        {(isCompleted || isRejected || isPending || isExpired) ? (
          <Button 
            className={cn(
              "w-full font-mono border-2 border-dashed hover:border-solid transition-all duration-200",
              "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
              isCompleted && "bg-gradient-to-r from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20",
              isRejected && "bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20",
              isPending && "bg-gradient-to-r from-yellow-400/10 to-yellow-500/10 hover:from-yellow-400/20 hover:to-yellow-500/20",
              isExpired && "bg-gradient-to-r from-gray-500/10 to-gray-600/10 hover:from-gray-500/20 hover:to-gray-600/20"
            )}
            variant="outline"
            onClick={onSelect}
          >
            View Details
          </Button>
        ) : (
          <Button 
            className={cn(
              "w-full font-mono border-2 border-dashed hover:border-solid transition-all duration-200",
              "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            )}
            variant="default"
            onClick={onSelect}
          >
            Start Quest
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}