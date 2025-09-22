'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';

import { Quest, User } from '@/lib/types';
import { QuestService } from '@/lib/services';
import { api, createApiClientWithToken } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SocialLinkModal } from '@/components/quests/social-link-modal';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
  Clock,
  Users,
  Trophy,
  Star,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  Target,
  BookOpen,
  Award,
  Calendar,
  UserCheck,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Instagram,
  Eye,
  Shield,
  CheckSquare,
  Heart,
  MessageCircle,
  Share,
  XCircle,
  Info,
  Upload,
  X,
  FileText,
  Image,
  UserPlus,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'development':
      return <BookOpen className="w-8 h-8" />;
    case 'social':
      return <Users className="w-8 h-8" />;
    case 'education':
      return <Award className="w-8 h-8" />;
    default:
      return <Trophy className="w-8 h-8" />;
  }
};

export default function QuestDetailPage() {
  const params = useParams();
  const questId = params?.id as string;
  const { toast } = useToast();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [questStats, setQuestStats] = useState<{
    validated: number;
    all: number;
    approvedRate: number;
    rejected: number;
  } | null>(null);
    const { data: session } = useSession();

  const now = new Date();
  const availableQuests = quest &&
                          quest.endDate &&
                          new Date(quest.endDate) > now && quest.user_status === "unstarted"

  const rejectedQuests = quest && quest.user_status === "rejected"

  const pendingQuests = quest && quest.user_status === "pending"

  const completedQuests = quest && quest.user_status === "validated";

   const isExpired = quest && quest.endDate && new Date(quest.endDate) < now;

  // Check if quest has requirements to show info icon
  const hasRequirements = quest && (
    ((quest as any).quest_steps && (quest as any).quest_steps.trim()) ||
    (quest.requirements && quest.requirements.length > 0)
  );

  // Smooth scroll to requirements section
  const scrollToRequirements = () => {
    const requirementsElement = document.getElementById('requirements-panel');
    if (requirementsElement) {
      requirementsElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Also switch to requirements tab if not already active
      const requirementsTab = document.querySelector('[data-state="inactive"][value="requirements"]') as HTMLButtonElement;
      if (requirementsTab) {
        requirementsTab.click();
      }
    }
  };

  // Check if social media account is linked for the quest platform
  const isAccountLinked = (platformType: string) => {
    if (!user || !platformType) return true; // Return true for non-social platforms
    
    switch (platformType.toLowerCase()) {
      case 'twitter':
        return !!user.twitterProfile;
      case 'facebook':
        return !!user.facebookProfile;
      case 'discord':
        return !!user.discordProfile;
      case 'linkedin':
        return !!user.linkedInProfile;
        
      default:
        return true; 
    }
  };

  // Sanitize and validate evidence URL
  const sanitizeUrl = (url: string): string => {
    const trimmedUrl = url.trim();
    // Use DOMPurify if available, otherwise fallback to basic sanitization
    if (typeof window !== "undefined" && DOMPurify) {
      return DOMPurify.sanitize(trimmedUrl, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
    return trimmedUrl.replace(/[<>"'&]/g, '');
  };

  const validateEvidenceUrl = (url: string): boolean => {
    if (!url || url.trim() === '') {
      setEvidenceError('Evidence URL is required for manual submission quests');
      return false;
    }

    const sanitizedUrl = sanitizeUrl(url);
    
    // Basic URL validation
    try {
      const urlObj = new URL(sanitizedUrl);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setEvidenceError('Please provide a valid HTTP or HTTPS URL');
        return false;
      }
      setEvidenceError(null);
      return true;
    } catch {
      setEvidenceError('Please provide a valid URL (e.g., https://example.com/evidence)');
      return false;
    }
  };

  const handleEvidenceUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEvidenceUrl(value);
    if (evidenceError) {
      setEvidenceError(null); // Clear error on input change
    }
  };

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'application/pdf'
  ];

  const validateAttachmentFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setAttachmentError('File size must be less than 10MB');
      return false;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setAttachmentError('Only images (JPEG, PNG, GIF, WebP, BMP, SVG) and PDF files are allowed');
      return false;
    }

    return true;
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAttachmentError(null);
    
    if (!file) {
      setAttachmentFile(null);
      return;
    }

    if (validateAttachmentFile(file)) {
      setAttachmentFile(file);
    } else {
      // Clear the input
      e.target.value = '';
      setAttachmentFile(null);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentError(null);
    // Clear file input
    const fileInput = document.getElementById('attachment-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStartQuest = (e: React.MouseEvent) => {
    if (quest?.platform_type && ['twitter', 'facebook', 'discord', 'linkedin'].includes(quest.platform_type.toLowerCase())) {
      if (!isAccountLinked(quest.platform_type)) {
        e.preventDefault();
        setModalPlatform(quest.platform_type);
        setShowSocialLinkModal(true);
        return;
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [questData, userData] = await Promise.all([
          QuestService.getQuest(questId,session?.user.token),
          QuestService.getCurrentUser(session?.user?.token),
        ]);

        console.log('Quest and user data loaded:', questData);

        const questDetails =
          questData && (questData as any).success ? (questData as any).data : questData;

        if (!questDetails) {
          throw new Error('Quest not found');
        }

        console.log('Quest data loaded:', questDetails);
        console.log('Quest reward:', questDetails.reward);
        console.log('Quest points:', (questDetails as any).points);

        // Add fallback reward/points if missing
        if (!questDetails.reward && !questDetails.points && !(questDetails as any).points) {
          // Set reward based on difficulty
          // Reward values should be provided by the API, not hardcoded
          // questDetails.reward will use the value from the API
        }

        setQuest(questDetails);
        setUser(userData);

     
        if (session?.user?.token) {
          try {
            const apiWithToken = createApiClientWithToken(session.user.token);
            const statsResponse = await apiWithToken.get(`/quest-completions/quest/stats/${questId}`);
            
            if (statsResponse.data && statsResponse.data.success) {
              setQuestStats(statsResponse.data.data);
              console.log('Quest stats loaded:', statsResponse.data.data);
            }
          } catch (statsError) {
            console.error('Failed to load quest stats:', statsError);
           
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quest data');
        console.error('Quest loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (questId) {
      loadData();
    }
  }, [questId]);

  const handleVerifyQuest = async () => {
    if (!quest || !session?.user?.token) return;

    // Validate evidence URL for manual submission quests
    if (quest.with_evidence) {
      if (!validateEvidenceUrl(evidenceUrl)) {
        return; // Stop if validation fails
      }
    }

    // Validate attachment for quests that require it
    if (quest.requires_attachment) {
      if (!attachmentFile) {
        setAttachmentError('Please upload an attachment file');
        return;
      }
    }

    setVerifying(true);
    setVerifyMessage(null);
    setShowVerifyDialog(false);

    // Show loading toast
    const loadingToast = toast({
      title: "Verifying Quest...",
      description: "Please wait while we verify your quest completion.",
      variant: "default"
    });

    try {
      const apiWithToken = createApiClientWithToken(session.user.token);
      
      // Check if we need to use FormData (for file uploads)
      if (quest.requires_attachment && attachmentFile) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add evidence URL if provided
        if (quest.with_evidence && evidenceUrl) {
          formData.append('evidence', sanitizeUrl(evidenceUrl));
        }
        
        // Add attachment file
        formData.append('attachment', attachmentFile);

        // Send FormData request
        await apiWithToken.post(`/quest-completions/quests/${quest.id}/verify`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Use regular JSON payload for non-file requests
        const payload: any = {};
        if (quest.with_evidence && evidenceUrl) {
          payload.evidence = sanitizeUrl(evidenceUrl);
        }

        await apiWithToken.post(`/quest-completions/quests/${quest.id}/verify`, payload);
      }
      
      // Dismiss loading toast
      loadingToast.dismiss();
      
      // Show success toast
      toast({
        title: "Quest Submitted for Verification! 📋",
        description: `Your completion of "${quest.title}" has been submitted and is pending for review.`,
        variant: "default"
      });
      
      setVerifyMessage('Quest submitted for verification!');
      
      // Update quest status to pending instead of reloading
      setQuest(prev => prev ? { ...prev, user_status: "pending" } : prev);
      
      // Reset form data
      setEvidenceUrl('');
      setEvidenceError(null);
      setAttachmentFile(null);
      setAttachmentError(null);
      
      // Clear file input
      const fileInput = document.getElementById('attachment-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      // Dismiss loading toast
      loadingToast.dismiss();
      
      console.error('Verification failed:', error);
      console.error('Error structure:', {
        message: error?.message,
        responseData: error?.response?.data,
        data: error?.data
      });
      
      // Extract error message from the API error structure
      // The API client transforms errors, so we check multiple possible locations
      const errorMessage = error?.message || 
                           error?.response?.data?.message || 
                           error?.data?.message ||
                           'Verification failed. Please try again.';
      
      console.log('Extracted error message:', errorMessage);
      setVerifyMessage(errorMessage);
      
      // Show appropriate error toast based on error type
      let toastTitle = "Quest Verification Failed";
      let toastDescription = errorMessage;
      
      if (errorMessage.toLowerCase().includes('already')) {
        toastTitle = "Quest Already Completed";
        toastDescription = "You have already completed this quest.";
      } else if (errorMessage.toLowerCase().includes('requirements')) {
        toastTitle = "Requirements Not Met";
        toastDescription = "Please ensure you've completed all quest requirements before verifying.";
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
        toastTitle = "Connection Error";
        toastDescription = "Unable to verify quest due to connection issues. Please try again.";
      } else if (errorMessage.toLowerCase().includes('not verified')) {
        toastTitle = "User Not Verified";
        toastDescription = "Please verify your account before completing quests.";
      } else if (errorMessage.toLowerCase().includes('evidence')) {
        toastTitle = "Evidence Required";
        toastDescription = "Please provide valid evidence URL for this quest.";
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyClick = () => {
    // Reset evidence URL and error when opening dialog
    setEvidenceUrl('');
    setEvidenceError(null);
    // Reset attachment state
    setAttachmentFile(null);
    setAttachmentError(null);
    setShowVerifyDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !quest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Quest not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isCompleted = user?.completedQuests?.includes(String(quest.id)) || false;
 
 

  const difficultyStars: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 4,
  };

  // const now = new Date();

  return (
    <TooltipProvider>
      <main className="max-w-6xl mx-auto  sm:px-6 space-y-4 sm:space-y-6" role="main" aria-label="Quest Details">
      {/* Back Button */}
      <Link href="/quests">
        <Button
          variant="ghost"
          size="sm"
          className="border-2 border-dashed border-gray-400 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 font-mono text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md gap-2 h-8 sm:h-9"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
           Back to Quests
        </Button>
      </Link>

      {/* Quest Header */}
      <header aria-label="Quest Information">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            <Card className="overflow-hidden border-4 border-dashed border-gray-400 dark:border-gray-600 shadow-lg bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-950/30 dark:to-purple-950/30">
              <CardHeader className="bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                  {/* Quest Title and Category */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg sm:text-xl lg:text-2xl shadow-lg flex-shrink-0">
                          {getCategoryIcon(quest.category as any)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1
                          className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 leading-tight break-words"
                          id="quest-title"
                        >
                          {quest.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {/* <Badge className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border-0 shadow-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {(quest.category || 'general')
                              .replace('-', ' ')
                              .replace(/^./, (c) => c.toUpperCase())}
                          </Badge> */}
                          <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-sm">
                            {Array.from({ length: 4 }, (_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  'text-sm sm:text-lg',
                                  i < (difficultyStars[quest.difficulty as any] || 0)
                                    ? 'text-yellow-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                )}
                              >
                                {i < (difficultyStars[quest.difficulty as any] || 0) ? '★' : '☆'}
                              </span>
                            ))}
                            <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-semibold text-yellow-700 dark:text-yellow-300 capitalize">
                              {quest?.difficulty}
                            </span>
                          </div>
                          {completedQuests && (
                            <Badge className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border-0 shadow-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1 sm:gap-2">
                              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                              Completed
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border-0 shadow-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-1 sm:gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              Expired
                            </Badge>
                          )}
                          {rejectedQuests && (
                            <Badge className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border-0 shadow-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1 sm:gap-2">
                              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              Rejected
                            </Badge>
                          )}

                          {pendingQuests && (
                            <Badge className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border-0 shadow-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 flex items-center gap-1 sm:gap-2">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              Pending
                            </Badge>
                          )}
                          {availableQuests && (
                            <Badge className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border-0 shadow-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1 sm:gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quest Points/Rewards Section */}
                  <div className="flex items-center justify-center mt-4 sm:mt-6">
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground ml-2 bg-muted/30 px-2 py-1 rounded border border-dashed font-mono">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {(() => {
                        const reward = quest.reward;
                        const points = quest.points || (quest as any).points;

                        // Try reward first (could be string or number)
                        if (reward !== undefined && reward !== null && reward !== '') {
                          return typeof reward === 'string' ? (isNaN(Number(reward)) ? reward : Number(reward)) : reward;
                        }

                        // Try points
                        if (points !== undefined && points !== null && points !== 0) {
                          return points;
                        }

                        // Default fallback
                        return 'TBD';
                      })()} pts
                    </div>
                  </div>


                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                {/* Quest Description */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      Description
                    </h2>
                    {hasRequirements && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={scrollToRequirements}
                              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              aria-label="View quest requirements"
                            >
                              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to view requirements</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300" aria-describedby="quest-title">
                    {quest.description}
                  </p>
                  
                  {/* Manual Submission Indicator */}
                  {/* {quest.with_evidence && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <Shield className="w-5 h-5" />
                        <span className="font-semibold">Manual Submission Quest</span>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                        This quest requires evidence submission. Please provide a URL to your evidence below.
                      </p>
                    </div>
                  )} */}

                  {/* Evidence URL Input Section */}
                  {quest.with_evidence && (
                    <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                          <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <h3 className="font-semibold text-base sm:text-lg">Submit Evidence</h3>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="evidence-url-main" className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                            Evidence URL *
                          </Label>
                          <Input
                            id="evidence-url-main"
                            type="url"
                            placeholder="https://example.com/your-evidence"
                            value={evidenceUrl}
                            onChange={handleEvidenceUrlChange}
                            className={cn(
                              "w-full bg-white dark:bg-gray-800 text-xs sm:text-sm h-8 sm:h-10",
                              evidenceError && "border-red-500 focus:ring-red-500"
                            )}
                            aria-describedby={evidenceError ? "evidence-error-main" : "evidence-help"}
                          />
                          {evidenceError && (
                            <p 
                              id="evidence-error-main" 
                              className="text-xs sm:text-sm text-red-600 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              {evidenceError}
                            </p>
                          )}
                          {/* <div id="evidence-help" className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                            <p className="font-medium mb-2">Acceptable evidence formats:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Screenshots of completed tasks</li>
                              <li>Social media post links</li>
                              <li>Document or file sharing links</li>
                              <li>Any publicly accessible URL that proves completion</li>
                            </ul>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attachment Upload Section */}
                  {quest.requires_attachment && (
                    <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                          <h3 className="font-semibold text-base sm:text-lg">Upload Attachment</h3>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <Label htmlFor="attachment-file" className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
                            Attachment File *
                          </Label>
                          
                          {!attachmentFile ? (
                            <div className="relative">
                              <input
                                id="attachment-file"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleAttachmentChange}
                                className="hidden"
                                aria-describedby={attachmentError ? "attachment-error" : "attachment-help"}
                              />
                              <label
                                htmlFor="attachment-file"
                                className={cn(
                                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                  attachmentError 
                                    ? "border-red-300 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30" 
                                    : "border-green-300 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30"
                                )}
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-4 text-green-500 dark:text-green-400" />
                                  <p className="mb-2 text-sm text-green-700 dark:text-green-300">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-green-600 dark:text-green-400">
                                    Images or PDF (MAX. 10MB)
                                  </p>
                                </div>
                              </label>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                  {attachmentFile.type.startsWith('image/') ? (
                                    <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {attachmentFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatFileSize(attachmentFile.size)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeAttachment}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                aria-label="Remove attachment"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                          {attachmentError && (
                            <p 
                              id="attachment-error" 
                              className="text-xs sm:text-sm text-red-600 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              {attachmentError}
                            </p>
                          )}

                          {/* <div id="attachment-help" className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                            <p className="font-medium mb-2">Supported file formats:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Images: JPEG, PNG, GIF, WebP, BMP, SVG</li>
                              <li>Documents: PDF</li>
                              <li>Maximum file size: 10MB</li>
                            </ul>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quest Details Grid */}
                { !(quest.quest_type === "hedera_profile_completion") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        {quest.platform_type === 'facebook' ? (
                          <Facebook className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                        ) : quest.platform_type === 'twitter' ? (
                          <Twitter className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                        ) : quest.platform_type === 'instagram' ? (
                          <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-base break-words">
                          {quest.platform_type || 'Web Platform'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Platform</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                        {(quest as any).interaction_type === 'like' ? (
                          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                        ) : (quest as any).interaction_type === 'comment' ? (
                          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                           ) : (quest as any).interaction_type === 'follow' ? (
                          <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                        ) : (quest as any).interaction_type === 'share' ? (
                          <Share className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />

                        ) : (
                          <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                          
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize text-sm sm:text-base break-words">
                          {(quest as any).interaction_type || 'View Content'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Required action</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base break-words">
                          {questStats?.all || (quest as any).currentParticipants || 0} / {(quest as any).maxParticipants || '∞'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Participants</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base break-words">
                          {quest.startDate
                            ? formatDistanceToNow(new Date(quest.startDate), { addSuffix: true })
                            : 'Available now'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Started</p>
                      </div>
                    </div>
                  </div>
                </div>)
  }



                {/* Action Buttons */}
                <section
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 mt-8"
                  aria-label="Quest Actions"
                >
             <div className="flex flex-col gap-4">
  {quest.quest_link && !isExpired ? (
    !(quest.quest_type === "hedera_profile_completion") && (
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-sm sm:text-base"
        onClick={handleStartQuest}
        aria-label="Start quest on external platform"
      >
        <a
          href={quest.quest_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full"
          onClick={(e) => {
            // Check if we need to show the modal
            if (quest?.platform_type && ['twitter', 'facebook', 'discord', 'linkedin'].includes(quest.platform_type.toLowerCase())) {
              if (!isAccountLinked(quest.platform_type)) {
                e.preventDefault();
                setModalPlatform(quest.platform_type);
                setShowSocialLinkModal(true);
                return;
              }
            }
          }}
        >
          <ExternalLink className="w-5 h-5" />
          Start Quest
        </a>
      </Button>
    )
  ) : (
    <Button
      size="lg"
      className="w-full bg-purple-400 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl cursor-not-allowed text-sm sm:text-base"
      disabled
      aria-label={isExpired ? "Quest expired" : "Quest link not available"}
    >
      <ExternalLink className="w-5 h-5" />
      {isExpired ? "Quest Expired" : "Quest Link Not Available"}
    </Button>
  )}

  <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
    <AlertDialogTrigger asChild>
      <Button
        size="lg"
        variant="outline"
        className={cn(
          "w-full text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base",
          completedQuests
            ? "border-green-500"
            : rejectedQuests
            ? "border-red-500"
            : pendingQuests
            ? "border-yellow-500"
            : isExpired
            ? "border-purple-500"
            : "border-green-500"
        )}
        disabled={
          !!isExpired || !!pendingQuests || !!rejectedQuests || !!completedQuests
        }
        aria-label={
          verifying
            ? "Verifying quest completion"
            : completedQuests
            ? "Quest already completed"
            : "Verify quest completion"
        }
      >
        {pendingQuests ? (
          <span className="flex items-center gap-2 sm:gap-3 text-yellow-600">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            Under Review
          </span>
        ) : completedQuests ? (
          <span className="flex items-center gap-2 sm:gap-3 text-green-600">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Completed
          </span>
        ) : rejectedQuests ? (
          <span className="flex items-center gap-3 text-red-600">
            <XCircle className="w-5 h-5 text-red-600" />
            Rejected
          </span>
        ) : isExpired ? (
          <span className="flex items-center gap-3 text-purple-600">
            <XCircle className="w-5 h-5 text-purple-600" />
            Expired
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5" />
            Verify Completion
          </span>
        )}
      </Button>
    </AlertDialogTrigger>

    <AlertDialogContent
      className="sm:max-w-md"
      aria-labelledby="verify-dialog-title"
      aria-describedby="verify-dialog-description"
    >
      <AlertDialogHeader>
        <AlertDialogTitle
          id="verify-dialog-title"
          className="flex items-center gap-2"
        >
          <CheckSquare className="w-5 h-5 text-green-600" />
          Verify Quest Completion
        </AlertDialogTitle>
        <AlertDialogDescription
          id="verify-dialog-description"
          className="text-base leading-relaxed"
        >
          {quest?.with_evidence || quest?.requires_attachment
            ? `Please confirm that you have completed all quest requirements${quest?.with_evidence ? ' and provided evidence' : ''}${quest?.requires_attachment ? ' and uploaded the required attachment' : ''} above. This action will submit your completion for verification.`
            : "Please confirm that you have completed all quest requirements. This action will submit your completion for verification."
          }
        </AlertDialogDescription>
      </AlertDialogHeader>
      
      <AlertDialogFooter>
        <AlertDialogCancel 
          className="px-6" 
          aria-label="Cancel verification"
        >
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={handleVerifyQuest}
          className="px-6 bg-green-600 hover:bg-green-700"
          aria-label="Confirm quest verification"
          disabled={
            (quest?.with_evidence && (!evidenceUrl || !!evidenceError)) ||
            (quest?.requires_attachment && (!attachmentFile || !!attachmentError))
          }
        >
          {quest?.with_evidence || quest?.requires_attachment ? 'Submit Evidence' : 'Verify Now'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>


                  {verifyMessage && (
                    <Alert
                      className={cn(
                        'mt-4',
                        verifyMessage.includes('successful')
                          ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                          : 'border-red-200 bg-red-50 dark:bg-red-950/20'
                      )}
                    >
                      {verifyMessage.includes('successful') ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription
                        className={cn(
                          verifyMessage.includes('successful')
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        )}
                      >
                        {verifyMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </section>
              </CardContent>
            </Card>

            {/* Quest Details */}
            <section aria-label="Quest Details">
              <Tabs defaultValue="requirements" className="space-y-6" aria-label="Quest Information Tabs">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" role="tablist">
                  <TabsTrigger
                    value="requirements"
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 text-xs sm:text-sm"
                    role="tab"
                    aria-controls="requirements-panel"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Requirements</span>
                    <span className="sm:hidden">Req</span>
                  </TabsTrigger>
                  {/* <TabsTrigger
                    value="resources"
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 text-xs sm:text-sm"
                    role="tab"
                    aria-controls="resources-panel"
                  >
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Resources</span>
                    <span className="sm:hidden">Res</span>
                  </TabsTrigger> */}
                  <TabsTrigger
                    value="badges"
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 text-xs sm:text-sm"
                    role="tab"
                    aria-controls="badges-panel"
                  >
                    <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Badges</span>
                    <span className="sm:hidden">Bad</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="requirements" role="tabpanel" id="requirements-panel" aria-labelledby="requirements-tab">
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <CardTitle id="status-card-title" className="flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-white">
                        <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold">Quest Requirements</h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Follow these step-by-step instructions to complete the quest</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Show quest steps if available */}
                        {(quest as any).quest_steps ? (
                          (quest as any).quest_steps.split('#quest_ending#').filter((step: string) => step.trim()).map((step: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mt-0.5">
                                {index + 1}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base break-words">{step.trim()}</p>
                            </div>
                          ))
                        ) : (
                          /* Fallback to requirements if quest_steps not available */
                          (quest.requirements || []).map((requirement: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="p-1 sm:p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full mt-0.5 flex-shrink-0">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base break-words">{requirement}</p>
                            </div>
                          ))
                        )}
                        
                        {/* Show message if no steps or requirements */}
                        {!(quest as any).quest_steps && (!quest.requirements || quest.requirements.length === 0) && (
                          <div className="text-center py-6 sm:py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                            <div className="text-muted-foreground text-sm sm:text-base">
                              No specific instructions provided. Complete the quest as described.
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" role="tabpanel" id="resources-panel" aria-labelledby="resources-tab">
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 p-6">
                      <CardTitle id="prerequisites-card-title" className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Quest Resources</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Helpful links and materials</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <a
                          href="https://docs.hedera.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                              Hedera Documentation
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Official development documentation
                            </p>
                          </div>
                        </a>
                        <a
                          href="https://portal.hedera.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                            <ExternalLink className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors">
                              Hedera Portal
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Developer portal and tools
                            </p>
                          </div>
                        </a>
                        <a
                          href="https://hashscan.io/testnet"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                            <Eye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
                              HashScan Explorer
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Blockchain explorer for Hedera
                            </p>
                          </div>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="badges" role="tabpanel" id="badges-panel" aria-labelledby="badges-tab">
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <CardTitle id="progress-stats-title" className="flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-white">
                        <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold">Quest Badges</h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Achievements you can earn</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {(quest.badges || []).map((badge: any, index: number) => (
                          <div
                            key={badge.id || index}
                            className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                          >
                            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex-shrink-0">
                              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base break-words">
                                {badge.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                                {badge.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {badge.points || 0} points
                                  </span>
                                </div>
                                <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1">
                                  {badge.rarity || 'common'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}

                        {(!quest.badges || quest.badges.length === 0) && (
                          <div className="text-center py-8 sm:py-12">
                            <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">
                              No badges available for this quest
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
                              Complete the quest to see if any badges are earned
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:space-y-6" aria-label="Quest Information Sidebar">
            {/* Quest Status Card */}
            <Card
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden"
              role="region"
              aria-labelledby="status-card-title"
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-white">
                  {isCompleted ? (
                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">
                      {isCompleted ? 'Quest Completed' : 'Quest Status'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {isCompleted ? 'Well done!' : 'Ready to start'}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {isCompleted ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-700 dark:text-green-300">Points Earned</span>
                      </div>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {quest.reward || (quest as any).points || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completion verified ✓</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-700 dark:text-blue-300">Reward</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {quest.reward || (quest as any).points || 0}
                      </span>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Complete quest to earn reward</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prerequisites */}
            {(quest.prerequisites || []).length > 0 && (
              <Card
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden"
                role="region"
                aria-labelledby="prerequisites-card-title"
              >
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-white">
                    <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">Prerequisites</h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Required quests</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-2 sm:space-y-3">
                    {(quest.prerequisites || []).map((prereqId: string | number) => (
                      <div
                        key={prereqId}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="p-1 sm:p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">Quest #{prereqId}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Stats */}
            <Card
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden"
              role="region"
              aria-labelledby="progress-stats-title"
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-white">
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">Progress Stats</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Community metrics</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                        Completion Rate
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                      {questStats?.approvedRate || (quest as any).completionRate || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                        Total Completions
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                      {questStats?.all || quest.completions || 0}
                    </span>
                  </div>
                  {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-3">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                        Average Rating
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-yellow-600 dark:text-yellow-400">
                      {(quest as any).averageRating || 4.8}/5
                    </span>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </header>

      {/* Social Link Modal */}
      <SocialLinkModal
        user={user}
        platform={modalPlatform}
        isOpen={showSocialLinkModal}
        onClose={() => setShowSocialLinkModal(false)}
      />
    </main>
    </TooltipProvider>
  );
}