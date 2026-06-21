"use client";

import { useTranslations } from "next-intl";
import { DnaConfirmDialog } from "@/components/dna";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Confirmation de la carte — délègue au dialogue du design system
 * (`DnaConfirmDialog`). On garde cette API (`isOpen`/`onConfirm`…) pour ne pas
 * toucher aux appelants existants.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  return (
    <DnaConfirmDialog
      open={isOpen}
      title={title}
      message={message}
      confirmLabel={confirmText ?? t("confirm")}
      cancelLabel={cancelText ?? t("cancel")}
      danger
      onConfirm={() => {
        onConfirm();
        onClose();
      }}
      onCancel={onClose}
    />
  );
}
