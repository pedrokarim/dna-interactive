/**
 * Code passé dans `?error=` à la page de login quand une connexion Discord ou
 * Google est refusée parce que le fournisseur n'atteste pas l'email.
 * Partagé entre `auth.ts`, qui redirige, et la page, qui affiche le message.
 */
export const OAUTH_EMAIL_UNVERIFIED_ERROR = "OAuthEmailNotVerified";
