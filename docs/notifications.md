# Notifications et annonces

Trois canaux, une seule rédaction. Une annonce est écrite une fois dans l'admin,
puis distribuée sur les canaux que l'on choisit, annonce par annonce.

| Canal | Portée | Réversible |
|---|---|---|
| Cloche du site | Tout le monde, **visiteurs anonymes compris** | oui (dépublier) |
| Push navigateur | Abonnés opt-in, même site fermé | non |
| Email | Comptes vérifiés n'ayant pas coupé les annonces | non |

La cloche n'est pas un « envoi » : elle lit la table. Une annonce publiée y
apparaît sans qu'on diffuse quoi que ce soit. C'est pour ça que le back-office
sépare **Publier** (réversible) de **Diffuser** (irréversible) – confondre les
deux, c'est envoyer un email à toute la base en corrigeant une coquille.

## Mise en service

### 1. Tables

`drizzle-kit push` reste inutilisable sur cette base (il détecte un écart sur
`email_events` et propose une troncature destructive). Les tables se créent en
SQL ciblé, rejouable :

```bash
# base locale de dev
node scripts/migrate-notifications.mjs --env .env.development.local

# base partagée
node scripts/migrate-notifications.mjs
```

Le script affiche la base ciblée avant d'écrire, et n'utilise que
`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`. Il crée
`announcements`, `notification_reads`, `push_subscriptions`, et ajoute
`users.announcement_emails`.

> Le port 5432 de `db.ascencia.re` est filtré depuis le poste de dev. Pour la
> base partagée, passer par `ssh kagura-prod` (cf. `docs/base-de-donnees-kagura.md`).

### 2. Clés VAPID (push navigateur)

Sans elles, le module se met en retrait : l'option d'activation n'apparaît pas
et le bouton « Push » de l'admin reste désactivé. Rien ne casse.

```bash
bunx web-push generate-vapid-keys
```

Puis dans l'environnement (local **et** Vercel) :

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<clé publique>
VAPID_PRIVATE_KEY=<clé privée>
VAPID_SUBJECT=mailto:contact@ascencia.re
```

La paire ne change jamais : régénérer les clés invalide **tous** les
abonnements existants, sans possibilité de prévenir les abonnés.

### 3. Email

Rien à faire : le transport SMTP existant est réutilisé. L'admin affiche
« SMTP non configuré » si `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` manquent.

## Ce qui est envoyé, et à qui

`audience` borne la visibilité d'une annonce :

- `everyone` – tout le monde, visiteurs anonymes compris ;
- `authenticated` – comptes connectés ;
- `admins` – équipe seulement (notes internes).

Le filtrage se fait côté serveur : une annonce réservée aux admins ne transite
jamais par le réseau vers un autre visiteur.

Pour l'email, trois garde-fous s'ajoutent : adresse **vérifiée**, compte non
banni, et `announcement_emails` à vrai. Le lien de désabonnement pointe vers le
profil.

## État « lu »

Deux dépôts, fusionnés à l'affichage – lu ici **ou** lu là-bas vaut lu :

- `notification_reads` pour les comptes connectés (suit l'utilisateur d'un
  appareil à l'autre) ;
- `localStorage` (`dna:notif-read`) pour tout le monde, anonymes compris.

L'ancienne clé `dna:notif-last-seen` (un simple horodatage « tout vu jusqu'à »)
est encore lue pour ne pas ressusciter un fil déjà consulté ; elle n'est plus
écrite.

Ouvrir la cloche ne marque rien comme lu. Une notification devient lue quand on
clique dessus, ou via « Tout marquer lu ». C'est la seule façon d'avoir un
compteur qui veuille dire quelque chose.

## Service worker

`public/sw.js` ne fait **que** du push : pas de cache, pas d'interception de
`fetch`. Un service worker qui met en cache une application Next.js casse plus
qu'il n'apporte (routes RSC, revalidation, déploiements).

Il n'est enregistré qu'au moment où l'utilisateur active le push. La permission
navigateur n'est jamais demandée d'elle-même : un site qui appelle
`Notification.requestPermission()` au chargement se fait refuser une fois pour
toutes, et le blocage est définitif côté navigateur.

## Notifications dérivées

En plus des annonces, le fil intègre ce qui dépend du compte qui regarde
(`src/lib/notifications/derive.ts`) : modération d'un de ses builds,
signalements en attente pour les admins. Elles n'ont pas de ligne en base ;
leur identifiant sert de clé dans `notification_reads`.
