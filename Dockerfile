# DNA Interactive – image de production.
#
# Construite par GitHub Actions (`.github/workflows/deploy.yml`), poussée sur
# GHCR, tirée par ascencia-prod. Jamais construite sur le serveur : le build
# génère ~915 pages avec 15 workers.
#
# Prérequis dans le dépôt : `output: "standalone"` dans `next.config.ts`.

# Bun ÉPINGLÉ : Next 16.3 échoue au build sous une Bun antérieure à 1.3.14
# (« Expected CommonJS module to have a function wrapper »). Constaté sur
# sharex-manager ; toute montée de version se fait ici, sciemment.
ARG BUN_VERSION=1.3.14
# La version de Node qu'utilisait Vercel, hébergeur jusqu'en octobre 2026.
ARG NODE_VERSION=22

# ── Dépendances ─────────────────────────────────────────────────────────────
FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app
COPY package.json bun.lock ./
# puppeteer et playwright (outils de dev) téléchargent un navigateur à
# l'installation : inutile au build, et le postinstall échoue sans `unzip`.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN bun install --frozen-lockfile

# ── Build ───────────────────────────────────────────────────────────────────
# Compilé par Node, comme sur Vercel (`bun install`, puis `next build` sous
# Node) : Bun 1.3.14 plante en plein `next build` dans le conteneur (SIGILL).
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Les NEXT_PUBLIC_* sont FIGÉES dans le JavaScript au build : elles entrent
# ici, pas au démarrage du conteneur. Aucune n'est secrète.
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN
ARG NEXT_PUBLIC_SARUTOBI_HOST
ARG NEXT_PUBLIC_SARUTOBI_DEBUG
ARG NEXT_PUBLIC_SARUTOBI_ENABLE_LOCAL
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN=$NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN \
    NEXT_PUBLIC_SARUTOBI_HOST=$NEXT_PUBLIC_SARUTOBI_HOST \
    NEXT_PUBLIC_SARUTOBI_DEBUG=$NEXT_PUBLIC_SARUTOBI_DEBUG \
    NEXT_PUBLIC_SARUTOBI_ENABLE_LOCAL=$NEXT_PUBLIC_SARUTOBI_ENABLE_LOCAL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# La base est lue pendant le build (`src/auth.ts` l'ouvre au chargement, des
# pages sont pré-rendues avec les vraies données), comme sur Vercel. Elle entre
# par un secret BuildKit : jamais dans une couche de l'image.
RUN --mount=type=secret,id=database_url \
    DATABASE_URL="$(cat /run/secrets/database_url)" \
    node node_modules/next/dist/bin/next build

# ── Exécution ───────────────────────────────────────────────────────────────
# Debian et non Alpine : `sharp` (optimisation des images) y trouve ses
# binaires précompilés glibc, sans compilation.
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Utilisateur non root ; il doit pouvoir écrire dans .next/cache (volume).
RUN groupadd --system --gid 1001 nextjs \
 && useradd --system --uid 1001 --gid nextjs nextjs

# Le serveur autonome, puis ce que `standalone` ne copie pas :
#  - .next/static (scripts et styles du build) ;
#  - public/ (438 Mo), lu aussi à la requête par `existsSync` dans
#    src/lib/items/guide-images.ts.
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public
RUN mkdir -p .next/cache && chown -R nextjs:nextjs .next/cache

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
