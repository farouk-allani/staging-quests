'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Star, Gift, Clock, Sparkles } from 'lucide-react';
import useStore from '@/lib/store';

export default function RewardsPage() {
  const { user, refreshUserProfile } = useStore();
  
  // Use total_points as the primary source with fallback for backward compatibility
  const pointsBalance = user?.total_points ?? user?.points ?? 0;
  const conversionRate = 0.001; // $0.001 per point (same as balance widget)
  const dollarBalance = (pointsBalance * conversionRate).toFixed(2);

  // Refresh user data on component mount and when user changes
  useEffect(() => {
    if (user) {
      console.log('RewardsPage - Refreshing user profile data on mount/user change');
      refreshUserProfile();
    }
  }, [user?.id, refreshUserProfile]);

  // Refresh user data when tab becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('RewardsPage - Tab became visible, refreshing user data');
        refreshUserProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, refreshUserProfile]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Gift className="w-8 h-8 text-purple-500" />
          <h1 className="text-4xl font-bold font-mono bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
            [REWARDS]
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto">
          Track your reward points and get ready for exciting redemption opportunities
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Points Balance Card */}
        <Card className="border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 font-mono text-purple-400">
              <Star className="w-5 h-5" />
              REWARD POINTS
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              Your accumulated quest rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold font-mono bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              {pointsBalance.toLocaleString()}
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-mono text-xs">
              POINTS EARNED
            </Badge>
          </CardContent>
        </Card>

        {/* USD Value Card */}
        <Card className="border-2 border-dashed border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 font-mono text-green-400">
              <DollarSign className="w-5 h-5" />
              USD VALUE
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              Equivalent monetary value
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold font-mono bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ${dollarBalance}
            </div>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-mono text-xs">
              $0.001/POINT
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Message */}
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-dashed border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-cyan-400 animate-pulse" />
                <div className="absolute inset-0 w-16 h-16 text-cyan-400 animate-ping opacity-20">
                  <Sparkles className="w-16 h-16" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                [REDEMPTION COMING SOON]
              </h2>
              <p className="text-lg font-mono text-muted-foreground leading-relaxed">
                You will soon be able to redeem your rewards
              </p>
              <p className="text-sm font-mono text-muted-foreground/80">
                Stay tuned for exciting redemption options including exclusive merchandise, 
                digital assets, and special privileges!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-4">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-sm text-cyan-400">
                FEATURE IN DEVELOPMENT
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="max-w-md mx-auto">
        <Card className="border-2 border-dashed border-slate-500/30 bg-gradient-to-br from-slate-500/10 to-slate-600/10 backdrop-blur-sm">
          <CardHeader className="text-center pb-3">
            <CardTitle className="font-mono text-slate-400 text-sm">
              [ACCOUNT SUMMARY]
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-muted-foreground">Total Points:</span>
              <span className="text-purple-400 font-bold">{pointsBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-muted-foreground">USD Equivalent:</span>
              <span className="text-green-400 font-bold">${dollarBalance}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-muted-foreground">Status:</span>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono text-xs">
                ACTIVE
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}