// Server Component
import { Suspense } from 'react';
import ErrorClient from './ErrorClient';
import LoadingComponent from '../components/LoadingPage';

export default function ErrorPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ErrorClient />
    </Suspense>
  );
}
