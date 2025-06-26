"use client";

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import LoadingComponent from '@/app/components/LoadingPage';

// Add dynamic import for client-side components
const DynamicHeader = dynamic(() => import('@/components/Header'), { 
  ssr: false,
  loading: () => <div className="h-16 bg-[#0f172a]/50 backdrop-blur-sm border-b border-indigo-500/20" />
});

const DynamicFooter = dynamic(() => import('@/components/Footer'), { 
  ssr: false,
  loading: () => <div className="h-16 bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20" />,
  suspense: true
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAzureLogin = async () => {
    try {
      // Set a flag to prevent redirect loops
      sessionStorage.setItem('isRedirecting', 'true');
      
      setIsLoading(true);
      setIsTransitioning(true);
      console.log('[Login] Starting Azure AD login process');
      
      // Get the callbackUrl from search params or determine based on role
      let callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      
      // Ensure we're not redirecting back to login
      if (callbackUrl.includes('/login')) {
        callbackUrl = '/dashboard';
      }
      
      console.log(`[Login] Using callback URL: ${callbackUrl}`);
      
      // Use redirect: true for production environment
      // This lets NextAuth handle the complete OAuth flow
      await signIn('azure-ad', {
        redirect: true,
        callbackUrl: callbackUrl
      });
      
      // The code below won't execute with redirect:true
      // It's kept as a fallback
    } catch (error) {
      console.error('[Login] Error during Azure login:', error);
      toast.error('An error occurred during Azure login');
      setIsLoading(false);
      setIsTransitioning(false);
      // Clear the redirecting flag on error
      sessionStorage.removeItem('isRedirecting');
    }
  };
  
  // Handle callback URL parameter and session check
  useEffect(() => {
    const callbackUrl = searchParams.get('callbackUrl');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('[Login] Error from auth provider:', error);
      toast.error('Authentication failed. Please try again.');
      setIsTransitioning(false);
    }
    
    // Check if we're already authenticated
    const checkSession = async () => {
      try {
        console.log('[Login] Checking session...');
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        console.log('[Login] Session data:', JSON.stringify(session));
        
        if (session?.user) {
          console.log(`[Login] User authenticated with role: ${session.user.role}`);
          setIsTransitioning(true);
          
          // Determine redirect path based on role
          let redirectPath = '/dashboard';
          
          if (session.user.role === 'ADMIN') {
            redirectPath = '/dashboard/admin';
          } else if (session.user.role === 'MANAGER') {
            redirectPath = '/dashboard/manager';
          } else {
            redirectPath = '/dashboard/employee';
          }
          
          console.log(`[Login] Redirecting to: ${redirectPath}`);
          // Use direct window location change instead of router.push
          if (!sessionStorage.getItem('isRedirecting')) {
            sessionStorage.setItem('isRedirecting', 'true');
            // Add a small delay to show the loading animation
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 1500);
          }
        } else {
          console.log('[Login] No active session found');
          setIsTransitioning(false);
        }
      } catch (err) {
        console.error('[Login] Error checking session:', err);
        setIsTransitioning(false);
      }
    };
    
    if (mounted) {
      checkSession();
    }
  }, [mounted, router, searchParams]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B]">
      
      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-b border-indigo-500/20" />}>
        <DynamicHeader />
      </Suspense>

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 md:py-12 mt-20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
          {/* Achievement Icons */}
          <div className="absolute top-20 left-10 animate-float-slow">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg rotate-12 flex items-center justify-center text-xl opacity-20">🎯</div>
          </div>
          <div className="absolute top-1/3 right-20 animate-float-medium">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg -rotate-12 flex items-center justify-center text-lg opacity-20">📈</div>
          </div>
          <div className="absolute bottom-20 left-1/4 animate-float-fast">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg rotate-45 flex items-center justify-center text-base opacity-20">⭐</div>
          </div>
          {/* Glowing Orbs */}
          <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-medium"></div>
        </div>

        <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md relative">
          {/* Card Background with Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-xl blur"></div>
          <div className="relative bg-[#1e293b]/90 backdrop-blur-xl rounded-xl shadow-2xl p-8 space-y-6 border border-white/10">
            {/* Login Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-ping"></span>
                <span className="text-indigo-400 text-sm font-medium">Bistec AspireHub Portal</span>
              </div>
              <h1 className="text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 animate-gradient">
                  Welcome Back
                </span>
              </h1>
              <p className="text-gray-400 text-sm">Sign in to track your performance journey</p>
            </div>
            
            {/* Login Button */}
            <button
              onClick={handleAzureLogin}
              disabled={isLoading}
              className="group w-full h-12 relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2">Signing in...</span>
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1h22v22H1V1z" fill="#F25022"/>
                    <path d="M1 1h10v10H1V1z" fill="#7FBA00"/>
                    <path d="M13 1h10v10H13V1z" fill="#00A4EF"/>
                    <path d="M1 13h10v10H1V13z" fill="#FFB900"/>
                  </svg>
                  <span>Sign in with Microsoft</span>
                </>
              )}
            </button>

            {/* Footer Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Access your performance Dashboard Securely with Microsoft
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20" />}>
        <DynamicFooter />
      </Suspense>
      <ToastContainer position="bottom-right" theme="dark" />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
} 