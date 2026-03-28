'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/feed'); }, [router]);
  return null;
}
