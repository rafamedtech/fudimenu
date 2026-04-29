'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { initAnalytics } from '@/lib/analytics/events';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}
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
    </QueryClientProvider>
  );
}
