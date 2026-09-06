"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";

/** Conversion base64url → Uint8Array, format attendu par `applicationServerKey`. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export type PushState =
  /** Navigateur sans Push API, ou serveur sans clés VAPID. */
  | "unsupported"
  /** Disponible, pas encore demandé. */
  | "idle"
  /** L'utilisateur a refusé au niveau du navigateur – irrécupérable côté site. */
  | "denied"
  | "subscribing"
  | "subscribed";

/**
 * Abonnement Web Push, côté navigateur.
 *
 * Principe non négociable : **on ne demande jamais la permission tout seul**.
 * `enable()` n'est appelé que sur un geste explicite. Un site qui déclenche
 * `Notification.requestPermission()` au chargement se fait refuser une fois
 * pour toutes par l'utilisateur – et le blocage est définitif côté navigateur.
 */
export function usePushNotifications() {
  const locale = useLocale();
  const [state, setState] = useState<PushState>("unsupported");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function detect() {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) return;

      // Le serveur peut tourner sans clés VAPID (dev, ou déploiement sans push) :
      // dans ce cas on n'affiche même pas l'option.
      const config = await fetch("/api/notifications/push")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (!alive || !config?.configured || !config.publicKey) return;

      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration().catch(() => null);
      const existing = await registration?.pushManager.getSubscription().catch(() => null);
      if (!alive) return;
      setState(existing ? "subscribed" : "idle");
    }

    void detect();
    return () => {
      alive = false;
    };
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    setState("subscribing");
    try {
      const config = await fetch("/api/notifications/push").then((r) => r.json());
      if (!config?.publicKey) throw new Error("Service de push indisponible.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          // Sans charge utile visible, Chrome affiche une notification générique
          // « ce site a été mis à jour en arrière-plan » : `userVisibleOnly` est
          // donc obligatoire, et impose d'afficher quelque chose à chaque push.
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey) as BufferSource,
        }));

      const json = subscription.toJSON();
      const response = await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, locale }),
      });
      if (!response.ok) throw new Error("Enregistrement refusé par le serveur.");
      setState("subscribed");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Activation impossible.");
      setState("idle");
    }
  }, [locale]);

  const disable = useCallback(async () => {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/notifications/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {});
        await subscription.unsubscribe();
      }
      setState("idle");
    } catch {
      setError("Désactivation impossible.");
    }
  }, []);

  return { state, error, enable, disable };
}
