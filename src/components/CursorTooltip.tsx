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
    // Approximate tooltip height for overflow clamp — use 240 as a safe default
    // (content is narrow, always fits in ~240px).
    const approxH = 240;
    if (top + approxH + pad > vh) top = Math.max(pad, pos.y - approxH - 14);
    return {
      position: "fixed" as const,
      left,
      top,
      width,
      zIndex: 100,
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
          style={tooltipStyle}
          className="rounded-lg border border-slate-600/70 bg-slate-900/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.7)] backdrop-blur"
          role="tooltip"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
