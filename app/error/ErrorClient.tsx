'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic imports for header and footer
const DynamicHeader = dynamic(() => import('@/components/Header'), { ssr: false });
const DynamicFooter = dynamic(() => import('@/components/Footer'), { ssr: false });

export default function ErrorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Get error details from URL parameters
    const error = searchParams.get('error');
    
    // Set appropriate error message based on error code
    if (error === 'AccessDenied') {
      setErrorMessage('Access denied. You do not have permission to access this resource.');
    } else if (error === 'Unauthorized') {
      setErrorMessage('Please log in to access this resource.');
    } else {
      setErrorMessage('An unexpected error occurred. Please try again later.');
    }
  }, [searchParams]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm" />}>
        <DynamicHeader userName="" />
      </Suspense>
      
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go Back
              </button>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm" />}>
        <DynamicFooter />
      </Suspense>
    </main>
  );
} 