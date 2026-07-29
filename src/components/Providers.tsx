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
    // reCAPTCHA n'est PAS monté ici : il ne concerne que le formulaire de
    // contact et vit dans `src/app/[locale]/contact/layout.tsx`. Le remonter
    // à la racine rechargerait le script Google sur toutes les pages.
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
