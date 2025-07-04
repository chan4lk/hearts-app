"use client";

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import LoadingComponent from '@/app/components/LoadingPage';
import { Role } from '@prisma/client';

// Add dynamic import for client-side components
const DynamicHeader = dynamic(() => import('@/app/components/Header'), { 
  ssr: false,
  loading: () => <div className="h-16 bg-[#0f172a]/50 backdrop-blur-sm border-b border-indigo-500/20" />
});

const DynamicFooter = dynamic(() => import('@/app/components/Footer'), { 
  ssr: false,
  loading: () => <div className="h-16 bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20" />,
  suspense: true
});

// Map database roles to dashboard paths
const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee'
};

function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle session state changes
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      console.log('[Login] User session detected:', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      });

      // Get the role from session and ensure it's a valid Role type
      const userRole = session.user.role as Role;
      
      // Get the dashboard path from our map, fallback to employee dashboard
      const redirectPath = ROLE_DASHBOARD_MAP[userRole] || ROLE_DASHBOARD_MAP.EMPLOYEE;
      
      console.log(`[Login] Role "${userRole}" maps to dashboard: ${redirectPath}`);
      router.push(redirectPath);
    }
  }, [session, status, router]);

  const handleAzureLogin = async () => {
    try {
      setIsLoading(true);
      setIsTransitioning(true);
      console.log('[Login] Starting Azure AD login process');
      
      // Get the callbackUrl from search params or use default
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      
      await signIn('azure-ad', {
        redirect: true,
        callbackUrl: callbackUrl
      });
    } catch (error) {
      console.error('[Login] Error during Azure login:', error);
      toast.error('An error occurred during login. Please try again.');
      setIsLoading(false);
      setIsTransitioning(false);
    }
  };

  if (!mounted || status === 'loading') {
    return <LoadingComponent />;
  }

  // If user is already authenticated, show loading
  if (session?.user) {
    return <LoadingComponent />;
  }

  return (
    <main className="flex flex-col min-h-screen bg-[#0B1120]">
      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-b border-indigo-500/20" />}>
        <DynamicHeader userName="" />
      </Suspense>

      <div className="flex-1 flex items-center justify-center px-4 relative">
        <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md relative z-10">
          <div className="relative bg-[#1A1F2E] rounded-2xl p-8 space-y-8 shadow-xl">
            {/* Content */}
            <div className="relative">
              {/* Login Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10">
                  <svg className="w-5 h-5 text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  <span className="text-indigo-300 text-sm font-medium">Bistec AspireHub Portal</span>
                </div>
                <h1 className="text-4xl font-bold text-white">Welcome Back</h1>
                <p className="text-gray-400 text-sm">Sign in to track your performance journey</p>
              </div>
              
              {/* Login Button */}
              <div className="mt-8">
                <button
                  onClick={handleAzureLogin}
                  disabled={isLoading}
                  className="group w-full relative flex items-center justify-center gap-3 bg-indigo-600 text-white font-medium h-12 px-6 rounded-xl transition-all duration-300 transform hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                      <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4h12v12H11V4z" fill="#F25022"/>
                        <path d="M25 4h12v12H25V4z" fill="#7FBA00"/>
                        <path d="M11 18h12v12H11V18z" fill="#00A4EF"/>
                        <path d="M25 18h12v12H25V18z" fill="#FFB900"/>
                      </svg>
                      <span>Sign in with Microsoft</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer Text */}
              <div className="text-center mt-6">
                <p className="text-xs text-gray-500">
                  Access your performance Dashboard Securely with Microsoft
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20" />}>
      </Suspense>
      <ToastContainer position="bottom-right" theme="dark" />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <LoginForm />
    </Suspense>
  );
} 