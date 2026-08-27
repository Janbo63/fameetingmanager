'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { TemplateNavProvider } from '@/context/TemplateNavContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TemplateNavProvider>
        {children}
      </TemplateNavProvider>
    </SessionProvider>
  );
}
