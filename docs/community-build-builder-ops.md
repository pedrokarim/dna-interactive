# Builder communautaire — notes d'exploitation

## Auth Discord

Variables requises :

- `AUTH_SECRET`
- `AUTH_DISCORD_ID`
- `AUTH_DISCORD_SECRET`
- `DATABASE_URL`

Callback OAuth Discord à déclarer dans le Developer Portal :

```text
https://dna.ascencia.re/api/auth/callback/discord
```

En local :

```text
http://localhost:3000/api/auth/callback/discord
```

## Base de données

Le schéma Drizzle contient maintenant les tables Auth.js (`users`, `accounts`, `sessions`, `verification_tokens`, `authenticators`) et les tables du builder (`builds`, `build_drafts`, `build_votes`, `build_reports`).

Appliquer le schéma sur Neon :

```bash
bun run db:push
```

Le projet n'avait pas de dossier de migrations existant ; `drizzle-kit push` reste donc la voie la plus cohérente avec l'état actuel.

## Admin

L'accès `/admin` dépend de `users.role = 'admin'`. Le premier admin doit être promu directement en base après sa première connexion Discord.
