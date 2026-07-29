"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { identifyAnalytics, resetAnalytics } from "@/lib/analytics";

export function SarutobiIdentity() {
  const { data: session, status } = useSession();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (status === "loading") return;

    const userId = status === "authenticated" ? session?.user?.id ?? null : null;

    if (userId) {
      identifyAnalytics(userId, { role: session?.user?.role ?? "user" });
    } else if (previousUserId.current) {
      // Réinitialiser uniquement après une vraie déconnexion. Un visiteur déjà
      // anonyme ne doit pas recevoir une nouvelle identité à chaque rendu.
      resetAnalytics();
    }

    previousUserId.current = userId;
  }, [session?.user?.id, session?.user?.role, status]);

  return null;
}
