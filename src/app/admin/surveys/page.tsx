'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSurveysPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/home');
  }, [router]);

  return null;
}
