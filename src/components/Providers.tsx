'use client';

import { Provider } from 'jotai';
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { MotionConfig } from 'framer-motion';
import { ConfirmProvider } from '@/components/dna';
import { SarutobiIdentity } from '@/components/analytics/SarutobiIdentity';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    // Pas de reCAPTCHA ici : il ne sert qu'au formulaire de contact et vit
    // dans `src/app/[locale]/contact/layout.tsx`. À la racine, il chargerait
    // le script Google sur toutes les pages.
    <SessionProvider>
      <SarutobiIdentity />
      <NuqsAdapter>
        <Provider>
          <MotionConfig reducedMotion="user">
            <ConfirmProvider>{children}</ConfirmProvider>
          </MotionConfig>
        </Provider>
      </NuqsAdapter>
    </SessionProvider>
  );
}
