'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Loading from './loading';

// Dynamic imports for header and footer
const DynamicHeader = dynamic(() => import('@/app/components/Header'), { ssr: false });
const DynamicFooter = dynamic(() => import('@/app/components/Footer'), { ssr: false });

import dynamic from 'next/dynamic';

function ErrorContent() {
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
    } else if (error === 'Verification') {
      setErrorMessage('The sign in link is no longer valid. It may have been used already or it may have expired.');
    } else if (error === 'OAuthSignin') {
      setErrorMessage('Error in the OAuth sign-in process. Please try again.');
    } else if (error === 'OAuthCallback') {
      setErrorMessage('Error in the OAuth callback process. Please try again.');
    } else if (error === 'OAuthCreateAccount') {
      setErrorMessage('Could not create OAuth provider account. Please try again.');
    } else if (error === 'EmailCreateAccount') {
      setErrorMessage('Could not create email provider account. Please try again.');
    } else if (error === 'Callback') {
      setErrorMessage('Error in the authentication callback. Please try again.');
    } else if (error === 'OAuthAccountNotLinked') {
      setErrorMessage('This email is already associated with another account. Please sign in with the original provider.');
    } else if (error === 'EmailSignin') {
      setErrorMessage('Error sending the email. Please try again.');
    } else if (error === 'CredentialsSignin') {
      setErrorMessage('Invalid credentials. Please check your username and password.');
    } else if (error === 'SessionRequired') {
      setErrorMessage('Authentication required. Please sign in to access this page.');
    } else {
      setErrorMessage('An unknown error occurred. Please try again.');
    }
    
    console.log(`[Error] Authentication error: ${error}`);
  }, [searchParams]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm" />}>
        <DynamicHeader />
      </Suspense>
      
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white/10 p-8 backdrop-blur-md">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-white">Authentication Error</h1>
            <div className="h-1 w-16 bg-red-500 mx-auto"></div>
          </div>
          
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg text-white">{errorMessage}</p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors">
              Return to Login
            </Link>
            <button 
              onClick={() => router.back()} 
              className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
      
      <Suspense fallback={<div className="h-14 bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20" />}>
        <DynamicFooter />
      </Suspense>
    </main>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ErrorContent />
    </Suspense>
  );
}
