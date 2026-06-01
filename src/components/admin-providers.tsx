'use client';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { OfflineConflictListener } from '@/components/admin/offline-conflict-listener';
import { initAnalytics } from '@/lib/analytics/events';

export function AdminProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <>
      {children}
      <OfflineConflictListener />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FFFCF5',
            color: '#1A1611',
            border: '1px solid #EDE7DB',
            borderRadius: '14px',
            fontFamily: 'inherit',
          },
        }}
      />
    </>
  );
}
