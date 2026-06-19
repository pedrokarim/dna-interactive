"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { DnaButton } from "@/components/dna";

/**
 * Suppression de compte (RGPD). Confirmation en deux temps, puis appel
 * DELETE /api/account et déconnexion (le cookie de session est effacé).
 */
export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("La suppression a échoué. Réessaie plus tard.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <DnaButton variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirming(true)}>
        Supprimer mon compte
      </DnaButton>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-sans text-sm text-[#ffb3a6]">
        Cette action supprime définitivement ton compte, tes builds, tes brouillons et tes votes. Irréversible.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="inline-flex items-center gap-2 rounded-md border border-crimson-bright/60 bg-crimson/15 px-4 py-2 font-sans text-sm text-[#ffb3a6] transition-colors hover:border-crimson-bright disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {busy ? "Suppression..." : "Confirmer la suppression"}
        </button>
        <DnaButton variant="ghost" onClick={() => setConfirming(false)}>
          Annuler
        </DnaButton>
      </div>
      {error ? <p className="font-sans text-xs text-[#ffb3a6]">{error}</p> : null}
    </div>
  );
}
