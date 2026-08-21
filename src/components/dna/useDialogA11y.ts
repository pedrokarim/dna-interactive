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
// Verrou de scroll a compteur. Deux modales peuvent etre ouvertes en meme temps
// (le selecteur de piece s'ouvre PAR-DESSUS la modale de configuration d'arme).
// En sauvegardant `document.body.style.overflow` a chaque ouverture, la seconde
// enregistrait « hidden » et le restaurait en se fermant : la page restait
// bloquee. On ne restaure donc qu'au tout dernier verrou libere.
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
