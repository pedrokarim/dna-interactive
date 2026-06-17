# Builder communautaire — notes d'exploitation

## Auth Discord

Variables requises :

- `AUTH_SECRET`
- `AUTH_DISCORD_ID`
- `AUTH_DISCORD_SECRET`
- `DATABASE_URL`
- `ADMIN_DISCORD_IDS` : IDs Discord autorisés comme administrateurs racine, séparés par virgules.

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

L'accès `/admin` dépend de `users.role = 'admin'`.

La façon recommandée de déclarer les administrateurs racine est :

```env
ADMIN_DISCORD_IDS=123456789012345678,987654321098765432
```

À la connexion Discord, tout utilisateur dont l'ID Discord est listé dans `ADMIN_DISCORD_IDS` est automatiquement promu en `admin`. Si la variable est ajoutée après coup, la prochaine lecture de session remet aussi le rôle à `admin`.

Ces admins configurés par variable d'environnement sont protégés dans le back-office : ils ne peuvent pas être rétrogradés ni bannis depuis l'UI admin.

Les autres admins peuvent être promus/rétrogradés depuis `/admin`.
