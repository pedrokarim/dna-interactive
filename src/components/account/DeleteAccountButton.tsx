"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { useConfirm } from "@/components/dna/ConfirmProvider";

/**
 * Suppression de compte (RGPD). Confirmation via le dialogue du design system,
 * puis appel DELETE /api/account et déconnexion (le cookie de session est effacé).
 */
export function DeleteAccountButton() {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const { confirm } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmed = await confirm({
      title: t("deleteAccount"),
      message: t("deleteWarning"),
      confirmLabel: t("confirmDelete"),
      cancelLabel: tCommon("cancel"),
      danger: true,
    });
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error("delete failed");
      await signOut({ callbackUrl: "/" });
    } catch {
      setError(t("deleteFailed"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <DnaButton variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={handleClick} disabled={busy}>
        {busy ? t("deleting") : t("deleteAccount")}
      </DnaButton>
      {error ? <p className="font-sans text-xs text-[#ffb3a6]">{error}</p> : null}
    </div>
  );
}
