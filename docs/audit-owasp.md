# Audit OWASP Top 10 (2021) — DNA Interactive

> Audit réalisé le 2026-07-11. Périmètre : 25 routes API, couche auth (Auth.js v5),
> DB (Drizzle / Postgres Kagura), emails (LWS), rendu de contenu utilisateur,
> config Vercel. Code lu ligne par ligne.

## Contexte d'hébergement (rappel)

- **Site** : Vercel serverless, domaine `dna.ascencia.re`.
- **DB** : Postgres auto-hébergé « Kagura » via `db.ascencia.re:5432` (pgbouncer,
  transaction pooling, TLS `verify-full`). **Base mutualisée entre projets.**
- **Runner commissions** : Raspberry Pi, écrit dans la même base.
- **SMTP** : LWS (`mail52.lwspanel.com:465`).

## Verdict global

Posture **solide**. Le cœur de la surface d'attaque utilisateur — contrôle
d'accès (A01) et validation des builds communautaires (A04) — est **exemplaire**.
Aucune vulnérabilité critique. Les faiblesses réelles sont **structurelles et
liées à l'hébergement serverless**, pas à des trous béants.

| # | Catégorie | Verdict | Pire sévérité |
|---|---|---|---|
| A01 | Broken Access Control | ✅ Sain (aucun IDOR) | — |
| A02 | Cryptographic Failures | ⚠️ | Moyenne |
| A03 | Injection | ✅ Quasi-sain | Faible |
| A04 | Insecure Design | ⚠️ | Moyenne |
| A05 | Security Misconfiguration | ⚠️ | Moyenne |
| A06 | Vulnerable Components | ⚠️ | Moyenne (suivi) |
| A07 | Auth Failures | 🔴 | Élevée |
| A08 | Data Integrity | ✅ Sain | Faible (archi) |
| A09 | Logging Failures | ⚠️ | Moyenne |
| A10 | SSRF | ✅ Sain | — |

---

## 🔴 Priorité haute

### A07 — Aucun rate-limiting sur le login (brute-force / credential stuffing)
`src/auth.ts` (`authorize` Credentials) — aucune limitation ni verrouillage.
Seul `/api/auth/login-status` (helper UI) est limité, pas la vérification réelle
du mot de passe. scrypt ralentit le débit mais ne remplace pas un lockout.
→ brute-force en ligne possible sur tout compte natif.

### ⚡ Rate-limiting en mémoire = inefficace sur Vercel (le point le plus important)
`src/lib/rate-limit.ts` — compteurs dans une `Map` en mémoire de process. Sur
Vercel, invocations réparties sur des instances multiples et éphémères (reset au
cold-start). **Conséquence : toutes les protections de débit (register, reset,
resend, votes, création de build) sont contournables** en répartissant les
requêtes. Protection anti-abus largement illusoire.
→ store partagé (table Postgres, déjà dispo sur Kagura).

---

## ⚠️ Priorité moyenne

- **A05 — Rate-limit du formulaire de contact calculé mais jamais appliqué**
  (`src/app/api/contact/route.ts`) : `clientIP` calculé, `checkRateLimit` jamais
  appelé. Seuls `content-length` + reCAPTCHA protègent. → relais de spam possible.
- **A02 / A09 — TLS SMTP sans vérification de certificat**
  (`src/lib/email/mailer.ts`, `src/app/api/contact/route.ts`) :
  `tls: { rejectUnauthorized: false }`. Chiffré mais cert non vérifié → MITM
  possible (interception liens reset/verify). Le cert LWS est valide → à retirer.
- **A05 — En-têtes de sécurité incomplets** (`next.config.ts`) : bons headers
  présents, mais **CSP et HSTS absents**.
- **A06 — Auth en prod sur une beta** (`next-auth@5.0.0-beta.31`). À suivre.
- **A07 — Énumération de comptes** (`login-status/route.ts`, `register/route.ts`
  409 explicite). `request-reset`/`resend-verification` sont eux corrects (200
  systématique). Incohérence à uniformiser.
- **A09 — Aucun log des événements d'authentification** : les actions admin sont
  auditées (`admin_actions`), mais rien ne trace les logins/resets.

---

## Points liés spécifiquement à l'hébergement

- **Fallback de clé si `AUTH_SECRET` absent** (`secret-crypto.ts`,
  `vote-identity.ts`) : secrets OAuth chiffrés sous une clé dérivée de chaîne vide,
  sel de vote → `"dna-vote-salt"` (public). Sur la **DB partagée Kagura**, tout
  accès lecture permettrait de les déchiffrer / dé-anonymiser. → `throw` au
  démarrage si `AUTH_SECRET` manque.
- **Frontière de confiance du runner Pi** (A08) : le Pi détient des identifiants
  d'écriture sur le même Postgres que le site. → rôle DB dédié restreint aux
  tables commissions, distinct du rôle applicatif.
- **`sslmode=require` dans `env.local.example`** : chiffre sans vérifier le cert.
  Prod en `verify-full` (OK), mais copier-coller dégradant. → corriger l'exemple.
- ✅ `.env.local` présent mais **non suivi par git** ; aucun endpoint cron/refresh
  exposé côté Next.

---

## ✅ Ce qui est solide (à ne pas casser)

- **A01 — aucun IDOR** : builds/drafts/compte vérifient toujours
  `userId === session` ou `role === admin`. Gating admin **re-vérifié en base à
  chaque `auth()`** → ban/rétrogradation immédiats, pas de privilège figé dans un JWT.
- **A03 — SQL 100 % paramétré** (Drizzle partout), **aucun XSS exploitable** par
  user standard (seul `dangerouslySetInnerHTML` = JSON-LD statique).
- **A04 — validation des builds exemplaire** : sets fermés serveur (Zod enums),
  bornes vérifiées, validation référentielle contre les vraies entités du perso,
  `≤3 builds/perso` appliqué **atomiquement** dans l'INSERT, pas de mass assignment.
- **A07 — crypto correcte** : mots de passe scrypt + `timingSafeEqual`, tokens
  reset/verify aléatoires stockés en SHA-256, usage unique + TTL.
- **A10 — pas de SSRF** : fetchs serveur = URLs en dur (reCAPTCHA),
  `remotePatterns` limité à un hôte, liens email depuis `AUTH_URL`.

---

## Plan d'action (par ROI)

1. **Rate-limit partagé** (table Postgres) + l'appliquer au **login** et brancher
   celui **oublié dans `/api/contact`** — corrige A07-haute + A05-moyenne.
2. Retirer `rejectUnauthorized: false` SMTP + désactiver `debug/logger` nodemailer.
3. Ajouter **CSP + HSTS** dans `next.config.ts`.
4. `throw` si `AUTH_SECRET` absent + corriger `sslmode` dans l'exemple.
5. Uniformiser l'anti-énumération (register/login-status) + logger les échecs de login.

## Suivi des correctifs

- [x] **Lot 1** — rate-limit partagé Postgres + login + fix contact + SMTP TLS/logs
      (voir table `rate_limits` ; `bun run db:push` requis pour créer la table).
- [x] **Lot 2** — HSTS + CSP. Directives sûres **enforcées**
      (`base-uri`/`object-src`/`frame-ancestors`/`form-action`/`upgrade-insecure-requests`) ;
      politique de ressources complète en **Report-Only** (à valider sur toutes
      les features puis promouvoir en `Content-Security-Policy`).
- [x] **Lot 3** — `throw` si `AUTH_SECRET` absent (`secret-crypto.ts`,
      `vote-identity.ts`) + `sslmode=verify-full` dans `env.local.example`.
- [x] **Lot 4** — logs d'authentification (login ok/échec/rate-limited, email
      haché, dans `auth.ts`). **Anti-énumération : NON modifié** — décision
      produit (cf. ci-dessous), l'abus de masse est déjà plafonné par le rate-limit.

## Décision en suspens — énumération de comptes (A07, Moyenne)

`login-status` (oracle `needsVerification`) et `register` (409 « email déjà
utilisé ») exposent l'existence d'un compte. Les **uniformiser casse l'UX** :
- `register` : il faudrait renvoyer un message générique (« si l'email est libre,
  tu recevras un lien ») + envoyer un email « quelqu'un a tenté de s'inscrire »
  au compte existant → refonte du flux + nouveau template.
- `login-status` : sa raison d'être est justement de dire à l'UI s'il faut
  proposer « renvoyer le lien de vérification ».

Le rate-limit partagé (lot 1) plafonne désormais l'énumération de masse. La
suppression complète de l'oracle est laissée comme **choix produit** à trancher.
