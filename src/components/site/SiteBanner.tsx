"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Megaphone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAppSettings } from "@/lib/settings/useAppSettings";

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Bandeau site : maintenance (prioritaire) ou annonce, piloté par les réglages admin. */
export function SiteBanner() {
  const s = useAppSettings();

  if (s.maintenanceMode) {
    return (
      <div className="border-b border-crimson-bright/40 bg-crimson/15 px-4 py-2.5 text-center sm:px-6">
        <p className="inline-flex items-center gap-2 font-sans text-sm text-[#ffb3a6]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {s.maintenanceMessage || "Site en maintenance — certaines actions sont temporairement désactivées."}
        </p>
      </div>
    );
  }

  if (s.announcementEnabled && s.announcementText.trim()) {
    const content: ReactNode = (
      <span className="inline-flex items-center gap-2 font-sans text-sm text-gold-bright">
        <Megaphone className="h-4 w-4 shrink-0" />
        {s.announcementText}
      </span>
    );
    return (
      <div className="border-b border-gold/30 bg-gold/8 px-4 py-2.5 text-center sm:px-6">
        {s.announcementLink ? (
          isExternal(s.announcementLink) ? (
            <a href={s.announcementLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {content}
            </a>
          ) : (
            <Link href={s.announcementLink} className="hover:underline">
              {content}
            </Link>
          )
        ) : (
          content
        )}
      </div>
    );
  }

  return null;
}
