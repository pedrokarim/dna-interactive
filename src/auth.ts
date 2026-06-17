import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isConfiguredAdminDiscordId } from "@/lib/auth/admins";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
    authenticatorsTable: schema.authenticators,
  }),
  session: { strategy: "database" },
  providers: [
    Discord({
      authorization: { params: { scope: "identify email" } },
    }),
  ],
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
    async session({ session, user }) {
      if (!session.user || !user.id) return session;

      const [dbUser] = await getDb()
        .select({
          id: schema.users.id,
          role: schema.users.role,
          banned: schema.users.banned,
          discordId: schema.users.discordId,
        })
        .from(schema.users)
        .where(eq(schema.users.id, user.id))
        .limit(1);

      const isConfiguredAdmin = isConfiguredAdminDiscordId(dbUser?.discordId);
      if (dbUser && isConfiguredAdmin && dbUser.role !== "admin") {
        await getDb()
          .update(schema.users)
          .set({ role: "admin", updatedAt: new Date() })
          .where(eq(schema.users.id, user.id));
      }

      session.user.id = user.id;
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
