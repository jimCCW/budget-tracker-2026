'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { PrimeReactProvider } from 'primereact/api';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
      })
  );

  return (
    <PrimeReactProvider
      value={{
        unstyled: true,
        pt: { button: { root: { className: 'cursor-pointer' } } },
      }}
    >
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </SessionProvider>
      </ThemeProvider>
    </PrimeReactProvider>
  );
}
