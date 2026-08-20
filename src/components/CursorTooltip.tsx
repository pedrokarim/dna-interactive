"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// Cursor-following tooltip (Enka-style)
// ---------------------------------------------------------------------------
// On devices with a hover-capable pointer (desktop mouse), the tooltip appears
// next to the cursor and follows it. On touch devices, it toggles on tap and
// docks near the target element, dismissing on any outside tap.
// Rendered into a body portal so it escapes parent overflow / transforms.
// ---------------------------------------------------------------------------

type Placement = "cursor" | "dock";

interface Props {
  content: ReactNode;
  children: ReactNode;
  // Optional fixed width for the bubble. Default 260.
  width?: number;
  // Keep the trigger inline by default. Pass "block" to wrap in a block div.
  as?: "inline" | "block";
}

export default function CursorTooltip({ content, children, width = 260, as = "inline" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [placement, setPlacement] = useState<Placement>("cursor");
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const hasHoverRef = useRef(true);
  // Hauteur réelle de la bulle, mesurée au montage. Sans ça on retombe sur une
  // estimation en dur : trop basse, la bulle déborde sous le pli au lieu de se
  // retourner au-dessus du curseur.
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

  // Touch mode: dismiss on outside tap.
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
    if (hasHoverRef.current) return; // desktop uses hover exclusively
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

  // Compute tooltip position — clamp to viewport so it never overflows.
  const tooltipStyle = (() => {
    if (!mounted) return { display: "none" as const };
    const pad = 12;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    let left = pos.x + 14;
    let top = pos.y + 14;
    // Flip to the left if it would overflow right edge.
    if (left + width + pad > vw) left = Math.max(pad, pos.x - width - 14);
    if (top + bubbleH + pad > vh) top = Math.max(pad, pos.y - bubbleH - 14);
    return {
      position: "fixed" as const,
      left,
      top,
      width,
      // Au-dessus de tout le contenu de page : les panneaux portent
      // `backdrop-blur`, qui crée un contexte d'empilement et masquait la bulle
      // à z-100. Doit aussi dépasser les pickers du builder (z-500) puisque la
      // bulle y est utilisée. Reste sous la visionneuse d'image (99999).
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
