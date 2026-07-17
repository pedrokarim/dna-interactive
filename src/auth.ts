import NextAuth, { type NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { getDb, schema } from "@/db";
import { isConfiguredAdminDiscordId } from "@/lib/auth/admins";
import { verifyPassword } from "@/lib/auth/password";
import { loadAuthOverrides } from "@/lib/auth/config-store";
import { checkRateLimit } from "@/lib/rate-limit";

// Credentials OAuth pilotables via l'admin (BDD), avec fallback env. Lus au
// démarrage (cold-start). Sûr : si la BDD est absente/KO → env uniquement.
const overrides = await loadAuthOverrides();

// Providers construits dynamiquement : Google ne s'active que si ses clés sont
// présentes (BDD ou env) ET le toggle admin est actif.
const providers: NextAuthConfig["providers"] = [
  Discord({
    clientId: overrides.discordId ?? process.env.AUTH_DISCORD_ID,
    clientSecret: overrides.discordSecret ?? process.env.AUTH_DISCORD_SECRET,
    // Un même email Discord (vérifié) est rattaché au compte existant plutôt
    // que d'en créer un doublon → 1 personne = 1 compte.
    allowDangerousEmailAccountLinking: true,
    authorization: { params: { scope: "identify email" } },
  }),
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Mot de passe", type: "password" },
    },
    authorize: async (credentials, request) => {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      // Anti-brute-force : plafond de tentatives par (IP + email), partagé entre
      // instances via Postgres. Clé combinée pour ne pas verrouiller un compte
      // légitime derrière une IP mutualisée (NAT/mobile). Dépassement → on
      // renvoie null (indistinct d'un mauvais mot de passe côté attaquant).
      const ip =
        request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request?.headers?.get("x-real-ip") ||
        "unknown";
      // Journalisation A09 : on trace les tentatives sans PII en clair (email
      // haché, jamais l'adresse). Va dans les logs Vercel → détection brute-force.
      const emailHash = createHash("sha256").update(email).digest("hex").slice(0, 12);

      const rate = await checkRateLimit(`auth:login:${ip}:${email}`, 10, 15 * 60 * 1000);
      if (!rate.ok) {
        console.warn("[auth] login rate-limited", { emailHash, ip });
        return null;
      }

      const [user] = await getDb()
        .select()
        .from(schema.users)
        .where(sql`lower(${schema.users.email}) = ${email}`)
        .limit(1);

      // Refus si : pas de compte, pas de mot de passe défini (OAuth-only),
      // banni, ou email non vérifié (login natif bloqué avant vérification).
      if (!user || !user.passwordHash || user.banned || !user.emailVerified) {
        console.warn("[auth] login failed (compte inéligible/inexistant)", { emailHash, ip });
        return null;
      }

      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) {
        console.warn("[auth] login failed (mot de passe invalide)", { emailHash, ip, userId: user.id });
        return null;
      }

      console.info("[auth] login ok", { userId: user.id });
      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];

const googleId = overrides.googleId ?? process.env.AUTH_GOOGLE_ID;
const googleSecret = overrides.googleSecret ?? process.env.AUTH_GOOGLE_SECRET;
if (overrides.googleEnabled && googleId && googleSecret) {
  providers.push(Google({ clientId: googleId, clientSecret: googleSecret, allowDangerousEmailAccountLinking: true }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
    authenticatorsTable: schema.authenticators,
  }),
  // JWT obligatoire pour le provider Credentials (la table sessions devient
  // inutilisée mais reste définie côté adapter, sans effet).
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return true;

      const [dbUser] = await getDb()
        .select({
          role: schema.users.role,
          banned: schema.users.banned,
          discordId: schema.users.discordId,
        })
        .from(schema.users)
        .where(eq(schema.users.id, user.id))
        .limit(1);

      if (dbUser && isConfiguredAdminDiscordId(dbUser.discordId)) {
        if (dbUser.banned || dbUser.role !== "admin") {
          await getDb()
            .update(schema.users)
            .set({ role: "admin", banned: false, updatedAt: new Date() })
            .where(eq(schema.users.id, user.id));
        }
        return true;
      }

      return dbUser?.banned !== true;
    },
    async jwt({ token, user }) {
      // `user` n'est présent qu'à la connexion (OAuth ou Credentials).
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      const uid = token.uid as string | undefined;
      if (!session.user || !uid) return session;

      const [dbUser] = await getDb()
        .select({
          id: schema.users.id,
          role: schema.users.role,
          banned: schema.users.banned,
          discordId: schema.users.discordId,
        })
        .from(schema.users)
        .where(eq(schema.users.id, uid))
        .limit(1);

      const isConfiguredAdmin = isConfiguredAdminDiscordId(dbUser?.discordId);
      if (dbUser && isConfiguredAdmin && dbUser.role !== "admin") {
        await getDb()
          .update(schema.users)
          .set({ role: "admin", updatedAt: new Date() })
          .where(eq(schema.users.id, uid));
      }

      session.user.id = uid;
      session.user.role = isConfiguredAdmin ? "admin" : dbUser?.role ?? "user";
      session.user.banned = dbUser?.banned ?? false;
      session.user.discordId = dbUser?.discordId ?? null;
      return session;
    },
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider !== "discord" || !user.id) return;
      const isConfiguredAdmin = isConfiguredAdminDiscordId(account.providerAccountId);

      await getDb()
        .update(schema.users)
        .set({
          discordId: account.providerAccountId,
          ...(isConfiguredAdmin ? { role: "admin" as const } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id));
    },
  },
});
