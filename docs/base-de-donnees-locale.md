# Base de données locale (développement)

L'accès à la base de production est fermé depuis l'extérieur. Le développement
tourne donc sur une **base Postgres jetable**, dans un conteneur Docker hébergé
par WSL, et ne contient aucune donnée réelle.

Pour la base de production, voir [base-de-donnees-kagura.md](./base-de-donnees-kagura.md).

## Le serveur Next reste sur Windows

WSL 2 relaie sur le `localhost` de Windows tout port publié à l'intérieur de la
distribution. Un conteneur qui expose `5433` dans WSL est donc joignable en
`127.0.0.1:5433` depuis Windows, sans tunnel et sans rien configurer.

Autrement dit : **il n'y a pas besoin de déplacer le dépôt, bun, node ou
`node_modules` dans WSL.** Seule la base y vit ; `bun run dev` continue de
tourner sur le poste, avec ses `node_modules` Windows.

## Démarrer / arrêter

Le conteneur est décrit par [`docker-compose.dev.yml`](../docker-compose.dev.yml)
à la racine du dépôt. Toutes les commandes se lancent depuis WSL :

```powershell
# démarrer (la première fois, ou après un redémarrage du poste)
wsl -d Ubuntu-24.04 -- bash -lc "cd /mnt/c/Users/karim/Desktop/programming-laboratory/dna-test && docker compose -f docker-compose.dev.yml up -d"

# raccourci, une fois le conteneur créé
wsl -d Ubuntu-24.04 -- docker start dna-dev-db
wsl -d Ubuntu-24.04 -- docker stop  dna-dev-db

# console psql
wsl -d Ubuntu-24.04 -- docker exec -it dna-dev-db psql -U dna -d dna
```

| | |
|---|---|
| Image | `postgres:18-alpine` |
| Conteneur | `dna-dev-db` |
| Port hôte | **5433** (le 5432 de WSL est déjà pris par `grand-oral-db`) |
| Volume | `dna-dev-pgdata`, monté sur `/var/lib/postgresql` |
| Identifiants | `dna` / `dna_dev_local`, base `dna` |

> **Postgres 18 déplace son répertoire de données.** Le volume se monte sur
> `/var/lib/postgresql`, plus sur `/var/lib/postgresql/data` — même piège que
> sur le serveur partagé.

### Piège : WSL s'éteint tout seul

WSL arrête sa machine virtuelle dès qu'aucun processus ne l'occupe, et le
relais de ports tombe avec elle : la connexion depuis Windows échoue alors en
`ECONNREFUSED`, alors que `docker start` semblait avoir réussi.

Le conteneur est en `restart: unless-stopped`, donc **toucher WSL suffit à tout
relancer** (n'importe quelle commande `wsl -d Ubuntu-24.04 -- …`). Pour garder
la VM en vie pendant une session de travail, au choix :

```powershell
# ancrage le temps de la session (à laisser tourner dans un terminal)
wsl -d Ubuntu-24.04 -- sleep infinity
```

…ou, en réglage permanent, ajouter dans `%USERPROFILE%\.wslconfig` :

```ini
[experimental]
vmIdleTimeout=-1
```

Ce second réglage vaut pour **toutes** les distributions de la machine.

## Câblage côté application

`.env.development.local` (non versionné) porte la seule variable qui change :

```
DATABASE_URL=postgresql://dna:dna_dev_local@127.0.0.1:5433/dna
```

Next charge `.env.development.local` **avant** `.env.local` : la base est donc
redirigée vers le local, tandis que toutes les autres clés (SMTP, reCAPTCHA,
`AUTH_SECRET`…) continuent de venir de `.env.local`. Au démarrage, `next dev`
confirme les deux fichiers :

```
- Environments: .env.development.local, .env.local
```

`drizzle.config.ts` suit le même ordre : il charge `.env.development.local`
puis `.env.local`, et `dotenv` n'écrase jamais une variable déjà posée — donc
une variable donnée dans le shell l'emporte sur les deux.

## Créer ou mettre à jour le schéma

`bun run db:push` **ne fonctionne pas ici** : la commande s'arrête sur
« Pulling schema from database… », sort en code 0 et ne crée rien. Passer par
une génération SQL, puis l'appliquer :

```bash
# 1. produire le SQL hors du dépôt (le projet ne versionne pas de migrations)
npx drizzle-kit generate --dialect postgresql --schema ./src/db/schema.ts --out <dossier-temporaire>

# 2. l'appliquer sur la base locale (instructions séparées par `--> statement-breakpoint`)
```

L'état de référence reste `src/db/schema.ts`. Le schéma complet compte
**20 tables** : `users`, `accounts`, `sessions`, `authenticators`,
`verification_tokens`, `auth_tokens`, `builds`, `build_drafts`,
`build_ip_votes`, `build_reports`, `calendar_events`, `announcements`,
`app_settings`, `admin_actions`, `commission_entries`, `commission_snapshots`,
`email_events`, `notification_reads`, `push_subscriptions`, `rate_limits`.

## Remplir la base

```bash
bun run scripts/seed-calendar-events.ts   # 37 événements (liste curée)
```

Le reste (comptes, builds communautaires, votes) se crée à la main depuis le
site : la base démarre vide, c'est voulu.

> Bun ne lit pas `.env.development.local`. Pour un script lancé via `bun run`,
> passer la variable explicitement :
> `DATABASE_URL="postgresql://dna:dna_dev_local@127.0.0.1:5433/dna" bun run …`
