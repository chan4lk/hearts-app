// Server Component
import { Suspense } from 'react';
import ErrorClient from './ErrorClient';
import Loading from './loading';

export default function ErrorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ErrorClient />
    </Suspense>
  );
}
