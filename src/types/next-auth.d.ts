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
