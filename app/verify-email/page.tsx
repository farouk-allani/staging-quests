'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, Home, ArrowRight, Mail } from 'lucide-react';
import { AuthService } from '@/lib/api/auth';

type VerificationState = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [verificationState, setVerificationState] = useState<VerificationState>('loading');
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const result = await AuthService.verifyToken(verificationToken);
      
      if (result.success) {
        setVerificationState('success');
        toast({
          title: "Email Verification Successful",
          description: "Your email has been successfully verified!",
          variant: "default",
        });
      } else {
        throw new Error(result.message || 'Token verification failed. Please try again or request a new verification email.');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to verify token. Please try again or request a new verification email.';
      console.error('Email verification error:', error);
      
      setVerificationState('error');
      setErrorMessage(errorMsg);
      
      toast({
        title: "Email Verification Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Auto-redirect countdown effect
  useEffect(() => {
    if (verificationState === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (verificationState === 'success' && countdown === 0) {
      // Redirect to home if logged in, otherwise to login
      const redirectTo = session ? '/' : '/auth/login';
      router.push(redirectTo);
    }
  }, [verificationState, countdown, router, session]);

  // Extract token and auto-verify when page loads
  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyEmail(tokenParam);
    } else {
      setVerificationState('error');
      setErrorMessage('No verification token found in URL. Please check your email link.');
      toast({
        title: "Invalid Verification Link",
        description: "No verification token found in URL. Please check your email link.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const getRedirectDestination = () => {
    return session ? 'home' : 'login';
  };

  const getRedirectButtonText = () => {
    return session ? 'Go to Home' : 'Go to Login';
  };

  const getRedirectButtonIcon = () => {
    return session ? Home : Mail;
  };

  const handleRedirect = () => {
    const destination = session ? '/' : '/auth/login';
    router.push(destination);
  };

  const renderContent = () => {
    switch (verificationState) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-mono text-primary mb-4">
              Verifying Your Email
            </h1>
            <p className="text-lg font-mono text-muted-foreground mb-6">
              Please wait while we verify your email address...
            </p>
            <div className="bg-primary/10 rounded-lg p-4 border border-dashed border-primary/30">
              <p className="text-sm font-mono text-primary">
                {">"} PROCESSING_EMAIL_VERIFICATION...
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold font-mono text-green-600 mb-4">
              Email Verified Successfully!
            </h1>
            <p className="text-lg font-mono text-muted-foreground mb-6">
              Your email address has been successfully verified. {session ? 'Welcome back!' : 'You can now log in to your account.'}
            </p>
            <div className="bg-green-500/10 rounded-lg p-4 border border-dashed border-green-500/30 mb-6">
              <p className="text-sm font-mono text-green-600">
                {">"} EMAIL_VERIFIED ✓
              </p>
              <p className="text-sm font-mono text-green-600 mt-1">
                {">"} REDIRECTING_TO_{getRedirectDestination().toUpperCase()}_IN {countdown}s...
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              className="font-mono"
              onClick={handleRedirect}
            >
              {React.createElement(getRedirectButtonIcon(), { className: "w-4 h-4 mr-2" })}
              {getRedirectButtonText()} Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold font-mono text-red-600 mb-4">
              Email Verification Failed
            </h1>
            <p className="text-lg font-mono text-muted-foreground mb-4">
              We encountered an error while verifying your email address.
            </p>
            {errorMessage && (
              <div className="bg-red-500/10 rounded-lg p-4 border border-dashed border-red-500/30 mb-6">
                <p className="text-sm font-mono text-red-600 break-words">
                  {">"} ERROR: {errorMessage}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center flex-wrap">
              {!session && (
                <Button
                  variant="outline"
                  size="lg"
                  className="font-mono border-dashed"
                  onClick={handleGoToLogin}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Go to Login
                </Button>
              )}
              <Button
                variant="default"
                size="lg"
                className="font-mono"
                onClick={handleGoHome}
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-purple-500/10 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border-2 border-dashed border-primary/30 max-w-md w-full">
        {renderContent()}
      </div>
      
      {/* Progress indicator */}
      <div className="mt-6 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          HEDERA_QUEST_MACHINE v2.0
        </p>
      </div>
    </div>
  );
}