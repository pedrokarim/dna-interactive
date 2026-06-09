"use client";
import { useState, type ReactNode } from "react";
import { cn } from "./cn";

/** Section repliable ◆ (en-tête doré + filet, corps en sérif). */
export function DnaAccordion({
  title,
  children,
  defaultOpen = true,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("border-b border-white/6", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="relative flex w-full items-center gap-2.5 py-3 text-left font-caps text-[0.82rem] tracking-[0.08em] text-gold-bright after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-gold-deep after:to-transparent"
      >
        <span className="text-[0.7rem] text-gold">◆</span>
        <span className="flex-1">{title}</span>
        <span className={cn("text-[0.7rem] text-gold transition-transform duration-300", open && "rotate-90")}>▶</span>
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr] pb-4 pt-2 opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden font-display text-[1.05rem] leading-relaxed text-[#d8cdb6]">{children}</div>
      </div>
    </div>
  );
}
