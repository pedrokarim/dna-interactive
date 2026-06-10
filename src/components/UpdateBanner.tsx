"use client";

import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Boxes, Map, Sparkles, X, MapPin } from "lucide-react";
import { useAtom } from "jotai";
import {
  dismissHomeAnnouncementAtom,
  dismissedHomeAnnouncementsAtom,
} from "@/lib/store";
import { useTranslations } from "next-intl";

type HomeAnnouncement = {
  id: string;
  // Date de sortie du patch (ISO YYYY-MM-DD). Le bandeau disparaît
  // automatiquement BANNER_LIFETIME_DAYS jours après cette date.
  releaseDate: string;
  badge?: string;
  badgeKey?: string;
  icon: typeof MapPin;
  titleKey: string;
  desktopDetailsKey: string;
  href: string;
  ctaLabelKey: string;
  gradientClassName: string;
  borderClassName: string;
  accentTextClassName: string;
  ctaIcon: typeof Map;
};

// Les bandeaux d'annonce d'un patch deviennent invisibles 4 semaines après la
// sortie du patch — passé ce délai, on considère que les joueurs ont eu le
// temps d'explorer la nouveauté. Les entrées restent dans le code pour
// l'historique mais ne s'affichent plus.
const BANNER_LIFETIME_DAYS = 28;

function isAnnouncementExpired(announcement: HomeAnnouncement): boolean {
  const release = new Date(announcement.releaseDate);
  if (Number.isNaN(release.getTime())) {
    return false;
  }
  const expiry = release.getTime() + BANNER_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > expiry;
}

const HOME_ANNOUNCEMENTS: HomeAnnouncement[] = [
  // Patch 1.4 "Silver Torrent / Racing Stars" — 2 juin 2026
  {
    id: "home-patch-v1-4",
    releaseDate: "2026-06-02",
    badge: "v1.4",
    icon: Sparkles,
    titleKey: "patchV14Title",
    desktopDetailsKey: "patchV14Details",
    href: "/changelog",
    ctaLabelKey: "patchV14Cta",
    gradientClassName:
      "bg-linear-to-r from-gold/85 via-pyro/85 to-crimson-bright/85",
    borderClassName: "border-gold/30",
    accentTextClassName: "text-gold-bright",
    ctaIcon: Sparkles,
  },
  {
    id: "home-maps-v1-4",
    releaseDate: "2026-06-02",
    badge: "v1.4",
    icon: MapPin,
    titleKey: "newMapsV14Title",
    desktopDetailsKey: "newMapsV14Details",
    href: "/map?mapId=bloomfield-station",
    ctaLabelKey: "newMapsV14Cta",
    gradientClassName:
      "bg-linear-to-r from-crimson/85 via-crimson-bright/80 to-gold/80",
    borderClassName: "border-gold/30",
    accentTextClassName: "text-gold-bright",
    ctaIcon: Map,
  },
  // Patch 1.3 "Firmament Unbound" — 7 avril 2026 (auto-expirés depuis le 5 mai)
  {
    id: "home-map-haojing-v1-3",
    releaseDate: "2026-04-07",
    badge: "v1.3",
    icon: MapPin,
    titleKey: "newMapTitle",
    desktopDetailsKey: "newMapDetails",
    href: "/map?mapId=haojing",
    ctaLabelKey: "newMapCta",
    gradientClassName:
      "bg-linear-to-r from-gold/90 via-pyro/90 to-crimson-bright/90",
    borderClassName: "border-gold/30",
    accentTextClassName: "text-gold",
    ctaIcon: Map,
  },
  {
    id: "home-items-library-v1-3",
    releaseDate: "2026-04-07",
    badgeKey: "badgeNew",
    icon: Boxes,
    titleKey: "itemsLibraryTitle",
    desktopDetailsKey: "itemsLibraryDetails",
    href: "/items",
    ctaLabelKey: "itemsLibraryCta",
    gradientClassName:
      "bg-linear-to-r from-gold/90 via-electro/90 to-electro/90",
    borderClassName: "border-gold/30",
    accentTextClassName: "text-gold",
    ctaIcon: Boxes,
  },
];

const BANNER_PARTICLES = [
  { leftPercent: 8, duration: 3.2, delay: 0 },
  { leftPercent: 26, duration: 3.9, delay: 0.8 },
  { leftPercent: 44, duration: 3.4, delay: 1.6 },
  { leftPercent: 68, duration: 4.1, delay: 2.4 },
  { leftPercent: 86, duration: 3.6, delay: 3.2 },
];

export default function UpdateBanner() {
  const t = useTranslations("banner");
  const tCommon = useTranslations("common");
  const [dismissedAnnouncements] = useAtom(dismissedHomeAnnouncementsAtom);
  const [, dismissAnnouncement] = useAtom(dismissHomeAnnouncementAtom);

  const visibleAnnouncements = HOME_ANNOUNCEMENTS.filter(
    (announcement) =>
      !dismissedAnnouncements[announcement.id] &&
      !isAnnouncementExpired(announcement)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="relative z-40">
      <AnimatePresence initial={false}>
        {visibleAnnouncements.map((announcement, index) => {
          const BannerIcon = announcement.icon;
          const CtaIcon = announcement.ctaIcon;
          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`relative backdrop-blur-sm border-b ${announcement.borderClassName} ${announcement.gradientClassName} ${
                index === 0 ? "" : "border-t border-white/10"
              }`}
            >
              <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Badge animé */}
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                      className="shrink-0"
                    >
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-sm text-xs font-bold text-parch border border-white/30">
                        <Sparkles className="w-3 h-3" />
                        {announcement.badgeKey ? t(announcement.badgeKey) : announcement.badge}
                      </span>
                    </motion.div>

                    {/* Texte */}
                    <div className="flex items-center gap-2 text-parch">
                      <BannerIcon
                        className={`w-4 h-4 shrink-0 ${announcement.accentTextClassName}`}
                      />
                      <p className="text-sm md:text-base font-medium">
                        <span className="font-bold">{t(announcement.titleKey)}</span>
                        <span className="hidden sm:inline">
                          {" "}
                          —{" "}
                          <span
                            className={`font-bold ${announcement.accentTextClassName}`}
                          >
                            {t(announcement.desktopDetailsKey)}
                          </span>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Bouton Explorer + Fermer */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={announcement.href}
                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-sm text-sm font-semibold text-parch transition-all duration-200 border border-white/20 hover:border-white/40"
                    >
                      <CtaIcon className="w-4 h-4" />
                      {t(announcement.ctaLabelKey)}
                    </Link>
                    <button
                      onClick={() => dismissAnnouncement(announcement.id)}
                      className="p-1.5 hover:bg-white/20 rounded-sm transition-colors"
                      aria-label={tCommon("close")}
                    >
                      <X className="w-4 h-4 text-parch/80 hover:text-parch" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Particules animées en arrière-plan */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {BANNER_PARTICLES.map((particle, particleIndex) => (
                  <motion.div
                    key={`${announcement.id}-particle-${particleIndex}`}
                    className="absolute w-1 h-1 bg-white/30 rounded-full"
                    initial={{
                      x: `${particle.leftPercent}%`,
                      y: "100%",
                      opacity: 0,
                    }}
                    animate={{
                      y: "-100%",
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: particle.duration,
                      repeat: Infinity,
                      delay: particle.delay,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
