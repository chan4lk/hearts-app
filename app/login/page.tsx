"use client";

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAzureLogin = async () => {
    try {
      setIsLoading(true);
      // Use redirect: true for Azure AD in production to avoid client-side handling issues
      // This will let the NextAuth handle the complete OAuth flow server-side
      await signIn('azure-ad', {
        redirect: true,
        callbackUrl: '/dashboard'
      });
      
      // The code below won't execute immediately as the page will redirect
      // It's kept for local development where redirect might be set to false
    } catch (error) {
      console.error('[Login] Error during Azure login:', error);
      toast.error('An error occurred during Azure login');
      setIsLoading(false);
    }
  };
  
  // Handle callback URL parameter - this helps when user is redirected back after login
  useEffect(() => {
    const callbackUrl = searchParams.get('callbackUrl');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('[Login] Error from auth provider:', error);
      toast.error('Authentication failed. Please try again.');
    }
    
    // Check if we're already authenticated
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user) {
          // Already logged in, redirect based on role
          if (session.user.role === 'ADMIN') {
            router.push('/dashboard/admin');
          } else if (session.user.role === 'MANAGER') {
            router.push('/dashboard/manager');
          } else {
            router.push('/dashboard/employee');
          }
        }
      } catch (err) {
        console.error('[Login] Error checking session:', err);
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
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white">
      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-b border-indigo-500/20" />}>
        <DynamicHeader />
      </Suspense>
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 md:py-12 mt-20">
        <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md bg-[#1e293b]/80 backdrop-blur-sm rounded-xl shadow-lg p-8 space-y-6 border border-indigo-500/20">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400">Sign in to access your dashboard</p>
          </div>
          
          <button
            onClick={handleAzureLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-2 rounded-lg transition-all duration-300 text-sm sm:text-base shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20" />}>
        <DynamicFooter />
      </Suspense>
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