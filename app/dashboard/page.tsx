'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('[DashboardRedirect] Status:', status);
    console.log('[DashboardRedirect] Session:', session);
    
    if (status === 'loading') {
      console.log('[DashboardRedirect] Still loading...');
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log('[DashboardRedirect] User not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      console.log(`[DashboardRedirect] User authenticated with role: ${session.user.role}`);
      
      // Determine redirect path based on role
      let redirectPath = '/dashboard/employee'; // Default fallback
      
      if (session.user.role === 'ADMIN') {
        redirectPath = '/dashboard/admin';
      } else if (session.user.role === 'MANAGER') {
        redirectPath = '/dashboard/manager';
      } else if (session.user.role === 'EMPLOYEE') {
        redirectPath = '/dashboard/employee';
      }
      
      console.log(`[DashboardRedirect] Redirecting to: ${redirectPath}`);
      router.replace(redirectPath);
    }
  }, [session, status, router]);

  // Show loading state
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-indigo-400">Loading dashboard...</p>
      </div>
    </div>
  );
} 