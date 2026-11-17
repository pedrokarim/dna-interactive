"use client";
import { useEffect, type RefObject } from "react";

// Verrou de scroll avec compteur : deux modales peuvent être ouvertes en même temps
// (le sélecteur de pièce s'ouvre par-dessus la modale de config d'arme). Si chaque
// ouverture sauvegarde `document.body.style.overflow`, la seconde enregistre
// « hidden » et le remet en se fermant, et la page reste bloquée. On ne restaure
// qu'à la libération du dernier verrou.
let scrollLocks = 0;
let overflowBeforeFirstLock = "";

function lockScroll() {
  if (scrollLocks === 0) {
    overflowBeforeFirstLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLocks += 1;
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) document.body.style.overflow = overflowBeforeFirstLock;
}

/**
 * Accessibilité commune des modales : bloque le scroll du body, garde le focus dans
 * le panneau (Tab et Shift+Tab bouclent), l'y place à l'ouverture, ferme sur Échap
 * et rend le focus d'avant à la fermeture. Sert à `DnaDialog` et aux modales
 * maison (carte, grilles, builder…).
 *
 * Le panneau doit pouvoir prendre le focus en repli (`tabIndex={-1}`).
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
    lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panelRef]);
}
