import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Sans `Accept-Language` (Googlebot et la plupart des robots), next-intl
  // retombe sur la locale par défaut, `fr`, alors que le `x-default` des
  // hreflang annonce `/en`. On aligne la redirection sur ce que l'on déclare.
  // Un cookie `NEXT_LOCALE` garde la priorité, comme avant.
  if (!request.headers.has('accept-language')) {
    const headers = new Headers(request.headers);
    headers.set('accept-language', 'en');
    return handleI18nRouting(new NextRequest(request, { headers }));
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|_next|assets|.*\\..*).*)'],
};
