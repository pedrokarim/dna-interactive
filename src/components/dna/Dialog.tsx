"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";
import { DnaButton } from "./Button";

/**
 * Modale du design system — coque réutilisable (overlay + panneau aux coins
 * nets, liseré doré/cramoisi, fermeture ESC + clic backdrop). Remplace les
 * dialogues natifs du navigateur. `DnaConfirmDialog` ajoute confirmer/annuler.
 */
const DIALOG_MAX_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
} as const;

export type DnaDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Accent cramoisi (action destructive) au lieu du doré. */
  danger?: boolean;
  /** Largeur max du panneau. Défaut `md`. */
  size?: keyof typeof DIALOG_MAX_WIDTH;
  className?: string;
};

export function DnaDialog({ open, onClose, title, children, footer, danger, size = "md", className }: DnaDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input:not([disabled]),select,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    // Déplace le focus dans la modale (1er élément focusable, sinon le panneau).
    (focusables()[0] ?? panelRef.current)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const items = focusables();
        if (items.length === 0) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const accent = danger ? "#e0685a" : "#c2a86a";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative max-h-[88vh] w-full overflow-y-auto overscroll-contain border bg-[#0b0e14] shadow-[0_24px_60px_rgba(0,0,0,0.6)] outline-none",
          DIALOG_MAX_WIDTH[size],
          className,
        )}
        style={{ borderColor: `${accent}66` }}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ backgroundColor: accent }} />
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-3.5">
          {title ? <h2 className="font-display text-lg leading-tight text-parch">{title}</h2> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-7 w-7 shrink-0 place-items-center text-muted transition-colors hover:text-parch"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children != null ? <div className="px-5 py-4 font-sans text-sm leading-relaxed text-parch/85">{children}</div> : null}
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-3.5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export type DnaConfirmDialogProps = {
  open: boolean;
  title?: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** false = mode alerte (un seul bouton). */
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DnaConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Annuler",
  danger = false,
  showCancel = true,
  onConfirm,
  onCancel,
}: DnaConfirmDialogProps) {
  return (
    <DnaDialog
      open={open}
      onClose={onCancel}
      title={title}
      danger={danger}
      footer={
        <>
          {showCancel ? (
            <DnaButton variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </DnaButton>
          ) : null}
          <DnaButton variant={danger ? "danger" : "gold"} onClick={onConfirm}>
            {confirmLabel}
          </DnaButton>
        </>
      }
    >
      {message}
    </DnaDialog>
  );
}
