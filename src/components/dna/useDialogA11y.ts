"use client";
import { useEffect, type RefObject } from "react";

/**
 * Accessibilité de modale réutilisable : verrouille le scroll du body, piège le
 * focus (Tab/Shift+Tab cyclent dans le panneau), déplace le focus dans la modale
 * à l'ouverture, ferme sur Échap, et restaure le focus précédent à la fermeture.
 * Utilisé par `DnaDialog` et par les modales custom (carte, grilles, builder…).
 *
 * Le panneau référencé doit être focusable en repli (`tabIndex={-1}`).
 */
export function useDialogA11y(
  panelRef: RefObject<HTMLElement | null>,
  options: { open?: boolean; onClose: () => void },
) {
  const { open = true, onClose } = options;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input:not([disabled]),select,[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

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
  }, [open, onClose, panelRef]);
}
