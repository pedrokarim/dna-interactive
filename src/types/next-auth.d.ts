import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      role: "user" | "admin";
      banned: boolean;
      discordId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "admin";
    banned?: boolean;
    discordId?: string | null;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role?: "user" | "admin";
    banned?: boolean;
    discordId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // Sessions JWT : on stocke l'id utilisateur DB ; role/banned/discordId
    // sont relus en base dans le callback `session` pour rester frais.
    uid?: string;
  }
}
