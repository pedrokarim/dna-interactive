import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
  // ==En-tête `Link` désactivé==. next-intl y reprend les codes de locale tels
  // quels, or les nôtres ne sont pas des codes de langue valides : `jp`, `kr`
  // et `tc` au lieu de `ja`, `ko` et `zh-Hant`. Google ignore une valeur
  // invalide, et l'en-tête contredisait le HTML, qui lui déclare les bons codes
  // (cf. `alternates.languages` dans `[locale]/layout.tsx` et `lib/metadata.ts`).
  // Deux annotations pour la même page valaient moins qu'une seule correcte.
  alternateLinks: false,
});
