"use client";

import { signIn, useSession } from 'next-auth/react';
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
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAzureLogin = async () => {
    try {
      setIsLoading(true);
      setIsTransitioning(true);
      console.log('[Login] Starting Azure AD login process');
      
      // Redirect to dashboard after successful login
      await signIn('azure-ad', {
        redirect: true,
        callbackUrl: '/dashboard'
      });
    } catch (error) {
      console.error('[Login] Error during Azure login:', error);
      toast.error('An error occurred during Azure login');
      setIsLoading(false);
      setIsTransitioning(false);
    }
  };
  
  // Handle session check and redirection
  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error) {
      console.error('[Login] Error from auth provider:', error);
      toast.error('Authentication failed. Please try again.');
      setIsTransitioning(false);
      setIsLoading(false);
      return;
    }
    
    // If user is already authenticated, redirect to appropriate dashboard
    if (status === 'authenticated' && session?.user) {
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
      
      // Store the initial role
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeRole', session.user.role);
      }
      
      console.log(`[Login] Redirecting to: ${redirectPath}`);
      router.push(redirectPath);
    } else if (status === 'unauthenticated') {
      setIsTransitioning(false);
      setIsLoading(false);
    }
  }, [session, status, router, searchParams]);

  if (!mounted) {
    return null;
  }

  // Show loading state while checking session
  if (status === 'loading' || isTransitioning) {
    return (
      <main className="flex flex-col min-h-screen bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-indigo-400">Loading...</p>
          </div>
        </div>
      </main>
    );
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
                <span className="text-indigo-400 text-sm font-medium">Performance Portal</span>
              </div>
              <h1 className="text-3xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 animate-gradient">
                  Welcome Back
                </span>
              </h1>
              <p className="text-gray-400 text-sm">Sign in with your Microsoft account</p>
            </div>
            
            {/* Azure Login Button */}
            <button
              onClick={handleAzureLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.5 12.5H7V11h4.5V6.5H13v4.5h4.5v1.5H13v4.5h-1.5v-4.5z"/>
                  </svg>
                  Sign in with Microsoft
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Need help? Contact your system administrator
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20" />}>
        <DynamicFooter />
      </Suspense>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
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