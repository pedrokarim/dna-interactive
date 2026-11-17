import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
  // En-tête `Link` désactivé : next-intl y met nos codes de locale tels quels,
  // et `jp`, `kr`, `tc` ne sont pas des codes de langue valides (`ja`, `ko`,
  // `zh-Hant`). Google ignore une valeur invalide, et l'en-tête contredisait le
  // HTML, qui déclare les bons codes (`alternates.languages` dans
  // `[locale]/layout.tsx` et `lib/metadata.ts`).
  alternateLinks: false,
});
