import { auth } from "@/auth";

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "user" | "admin";
  banned: boolean;
  discordId?: string | null;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.banned) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: session.user.role,
    banned: session.user.banned,
    discordId: session.user.discordId,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}
