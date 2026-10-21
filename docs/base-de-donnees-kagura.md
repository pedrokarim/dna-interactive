# Base de données — serveur Postgres partagé (remplace Neon)

Depuis le 2026-06-28, DNA n'utilise plus Neon (limites de compute atteintes
trop vite). La base tourne maintenant sur le **serveur Postgres partagé** auto-
hébergé sur notre VPS, mutualisé entre nos projets « génériques ».

> Hôte, identifiants et chemins réels ne sont **jamais** écrits ici : ce dépôt
> est public. Les valeurs ci-dessous sont des exemples ; les vraies vivent dans
> le gestionnaire de secrets (`.env` du serveur d'application, secret GitHub
> `DATABASE_URL` pour le build, fichier secret du serveur de base).

## Connexion

```
DATABASE_URL=postgresql://<utilisateur>:<password>@<hote-db>:5432/<base>?sslmode=verify-full
```

- Hôte public : `<hote-db>:5432` (pgbouncer, transaction pooling).
- TLS **obligatoire** en `verify-full` : le cert Let's Encrypt de l'hôte est
  reconnu par les CA système — rien à embarquer côté client (Node valide seul).
- Le mot de passe vit dans le fichier secret du serveur de base, dans le `.env`
  du serveur d'application et dans le secret GitHub `DATABASE_URL` (jamais
  commité, jamais cité dans ce dépôt).

## Driver

On est passé du driver Neon HTTP au driver standard **node-postgres** :

- `src/db/index.ts` : `drizzle-orm/node-postgres` + un `Pool` `pg` singleton
  par processus ; pgbouncer fait le vrai pooling, donc `max` reste petit
  (`DB_POOL_MAX`, 3 par défaut, 10 en production).
- Dépendances : `@neondatabase/serverless` retiré, `pg` + `@types/pg` ajoutés.
- `drizzle.config.ts` inchangé (dialect `postgresql`, agnostique du driver).

> pgbouncer est en **transaction pooling** : ne pas s'appuyer sur des
> *prepared statements* nommés persistants ni sur des fonctionnalités de
> session. node-postgres/drizzle n'en utilise pas par défaut → OK.

## Changer la chaîne de connexion

1. Le `.env` du serveur d'application, puis redémarrer le conteneur.
2. Le secret GitHub `DATABASE_URL` : `next build` lit la base (des pages sont
   pré-rendues avec les vraies données), le prochain build doit la joindre.

## Runner commissions (Raspberry Pi)

Le runner qui collecte les rotations écrit dans la même base. Repointer son
`DATABASE_URL` vers la même chaîne de connexion que ci-dessus
puis relancer le service. La Pi ouvre une connexion **sortante** vers l'IP
publique — aucun souci de NAT.

## Exploitation serveur

Tout est dans le répertoire d'exploitation du serveur (voir son README) :
ajout d'une base projet (`scripts/add-project-db.sh`), renouvellement TLS,
logs pgbouncer, accès psql admin.
