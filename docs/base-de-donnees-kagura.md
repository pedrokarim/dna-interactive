# Base de données — serveur partagé Kagura (remplace Neon)

Depuis le 2026-06-28, DNA n'utilise plus Neon (limites de compute atteintes
trop vite). La base tourne maintenant sur le **serveur Postgres partagé** auto-
hébergé sur le VPS Kagura, mutualisé entre nos projets « génériques ».

## Connexion

```
DATABASE_URL=postgresql://dna:<password>@db.ascencia.re:5432/dna?sslmode=verify-full
```

- Hôte public : `db.ascencia.re:5432` (pgbouncer, transaction pooling).
- TLS **obligatoire** en `verify-full` : le cert Let's Encrypt de
  `db.ascencia.re` est reconnu par les CA système — rien à embarquer côté
  client (Node valide tout seul).
- Le mot de passe vit dans `~/shared-db/.secrets-dna` sur le serveur et dans la
  variable d'environnement Vercel (jamais commité).

## Driver

On est passé du driver Neon HTTP au driver standard **node-postgres** :

- `src/db/index.ts` : `drizzle-orm/node-postgres` + un `Pool` `pg` singleton
  (réutilisé entre invocations serverless chaudes ; pgbouncer fait le vrai
  pooling, donc `max` volontairement petit).
- Dépendances : `@neondatabase/serverless` retiré, `pg` + `@types/pg` ajoutés.
- `drizzle.config.ts` inchangé (dialect `postgresql`, agnostique du driver).

> pgbouncer est en **transaction pooling** : ne pas s'appuyer sur des
> *prepared statements* nommés persistants ni sur des fonctionnalités de
> session. node-postgres/drizzle n'en utilise pas par défaut → OK.

## Mettre à jour Vercel (à faire pour basculer la prod)

1. Vercel → projet DNA → **Settings → Environment Variables**.
2. Éditer `DATABASE_URL` (Production, et Preview/Development si voulu) avec la
   nouvelle valeur ci-dessus.
3. **Redeploy** (les variables ne sont prises qu'au prochain déploiement).

## Runner commissions (Raspberry Pi)

Le runner qui collecte les rotations écrit dans la même base. Repointer son
`DATABASE_URL` vers `postgresql://dna:<password>@db.ascencia.re:5432/dna?sslmode=verify-full`
puis relancer le service. La Pi ouvre une connexion **sortante** vers l'IP
publique — aucun souci de NAT.

## Exploitation serveur

Tout est dans `~/shared-db/` sur Kagura (voir `~/shared-db/README.md`) :
ajout d'une base projet (`scripts/add-project-db.sh`), renouvellement TLS,
logs pgbouncer, accès psql admin.
