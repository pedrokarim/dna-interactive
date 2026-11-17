"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// Infobulle qui suit le curseur, façon Enka. À la souris, elle colle au
// curseur. Au tactile, un tap l'ouvre sous l'élément et un tap ailleurs la
// ferme. Rendue dans un portal sur body pour échapper aux overflow et
// transform des parents.

type Placement = "cursor" | "dock";

interface Props {
  content: ReactNode;
  children: ReactNode;
  // Largeur fixe de la bulle, 260 par défaut.
  width?: number;
  // Déclencheur inline par défaut, "block" pour l'envelopper dans un div bloc.
  as?: "inline" | "block";
}

export default function CursorTooltip({ content, children, width = 260, as = "inline" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [placement, setPlacement] = useState<Placement>("cursor");
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const hasHoverRef = useRef(true);
  // Hauteur réelle de la bulle, mesurée au montage. Avec une estimation en dur
  // trop basse, la bulle débordait en bas au lieu de passer au-dessus du curseur.
  const [bubbleH, setBubbleH] = useState(240);
  const measureRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    const h = node.getBoundingClientRect().height;
    if (h > 0 && Math.abs(h - bubbleH) > 1) setBubbleH(h);
  };

  useEffect(() => {
    setMounted(true);
    hasHoverRef.current =
      typeof window !== "undefined"
        ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
        : true;
  }, []);

  // Tactile : un tap hors du déclencheur ferme la bulle.
  useEffect(() => {
    if (!show || placement !== "dock") return;
    const handler = (e: Event) => {
      if (!triggerRef.current) return;
      if (!triggerRef.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("pointerdown", handler, { capture: true });
    return () => document.removeEventListener("pointerdown", handler, { capture: true });
  }, [show, placement]);

  const onMouseEnter = (e: ReactMouseEvent) => {
    if (!hasHoverRef.current) return;
    setPlacement("cursor");
    setPos({ x: e.clientX, y: e.clientY });
    setShow(true);
  };

  const onMouseMove = (e: ReactMouseEvent) => {
    if (!hasHoverRef.current || !show) return;
    setPos({ x: e.clientX, y: e.clientY });
  };

  const onMouseLeave = () => {
    if (!hasHoverRef.current) return;
    setShow(false);
  };

  const onClick = (e: ReactMouseEvent) => {
    if (hasHoverRef.current) return; // à la souris, seul le survol compte
    e.stopPropagation();
    if (show) {
      setShow(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    }
    setPlacement("dock");
    setShow(true);
  };

  // Position de la bulle, bornée à l'écran.
  const tooltipStyle = (() => {
    if (!mounted) return { display: "none" as const };
    const pad = 12;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    let left = pos.x + 14;
    let top = pos.y + 14;
    // Passe à gauche (ou au-dessus) si elle sort de l'écran.
    if (left + width + pad > vw) left = Math.max(pad, pos.x - width - 14);
    if (top + bubbleH + pad > vh) top = Math.max(pad, pos.y - bubbleH - 14);
    return {
      position: "fixed" as const,
      left,
      top,
      width,
      // Les panneaux en `backdrop-blur` créent un contexte d'empilement qui
      // masquait la bulle à z-100. Il faut aussi passer au-dessus des pickers
      // du builder (z-500), mais rester sous la visionneuse d'image (99999).
      zIndex: 9000,
      pointerEvents: "none" as const,
    };
  })();

  const Trigger = as === "block" ? "div" : "span";

  return (
    <>
      <Trigger
        ref={triggerRef as React.Ref<HTMLDivElement & HTMLSpanElement>}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        className={as === "block" ? "block" : "inline-block"}
      >
        {children}
      </Trigger>
      {mounted && show && createPortal(
        <div
          ref={measureRef}
          style={tooltipStyle}
          className="border border-line/25 bg-panel/95 p-3 text-sm shadow-[0_20px_40px_rgba(0,0,0,0.7)] backdrop-blur"
          role="tooltip"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
