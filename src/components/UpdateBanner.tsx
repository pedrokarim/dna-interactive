"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Boxes, Map, Sparkles, X, MapPin } from "lucide-react";
import { useAtom } from "jotai";
import {
  dismissHomeAnnouncementAtom,
  dismissedHomeAnnouncementsAtom,
} from "@/lib/store";

type HomeAnnouncement = {
  id: string;
  badge: string;
  icon: typeof MapPin;
  title: string;
  desktopDetails: string;
  href: string;
  ctaLabel: string;
  gradientClassName: string;
  borderClassName: string;
  accentTextClassName: string;
  ctaIcon: typeof Map;
};

const HOME_ANNOUNCEMENTS: HomeAnnouncement[] = [
  {
    id: "home-map-huaxu-v1-1",
    badge: "v1.1",
    icon: MapPin,
    title: "Nouvelle map disponible !",
    desktopDetails: "Explorez Huaxu avec 371 nouveaux marqueurs",
    href: "/map",
    ctaLabel: "Explorer",
    gradientClassName:
      "bg-linear-to-r from-emerald-600/90 via-teal-600/90 to-cyan-600/90",
    borderClassName: "border-emerald-400/30",
    accentTextClassName: "text-emerald-200",
    ctaIcon: Map,
  },
  {
    id: "home-items-library-v1-3",
    badge: "NOUVEAU",
    icon: Boxes,
    title: "Bibliothèque Items disponible !",
    desktopDetails: "Parcourez Demon Wedges, ressources, armes et plans de forge",
    href: "/items",
    ctaLabel: "Voir les items",
    gradientClassName:
      "bg-linear-to-r from-indigo-600/90 via-violet-600/90 to-fuchsia-600/90",
    borderClassName: "border-indigo-400/30",
    accentTextClassName: "text-indigo-200",
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
  const [dismissedAnnouncements] = useAtom(dismissedHomeAnnouncementsAtom);
  const [, dismissAnnouncement] = useAtom(dismissHomeAnnouncementAtom);

  const visibleAnnouncements = HOME_ANNOUNCEMENTS.filter(
    (announcement) => !dismissedAnnouncements[announcement.id]
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white border border-white/30">
                        <Sparkles className="w-3 h-3" />
                        {announcement.badge}
                      </span>
                    </motion.div>

                    {/* Texte */}
                    <div className="flex items-center gap-2 text-white">
                      <BannerIcon
                        className={`w-4 h-4 shrink-0 ${announcement.accentTextClassName}`}
                      />
                      <p className="text-sm md:text-base font-medium">
                        <span className="font-bold">{announcement.title}</span>
                        <span className="hidden sm:inline">
                          {" "}
                          —{" "}
                          <span
                            className={`font-bold ${announcement.accentTextClassName}`}
                          >
                            {announcement.desktopDetails}
                          </span>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Bouton Explorer + Fermer */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={announcement.href}
                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white transition-all duration-200 border border-white/20 hover:border-white/40"
                    >
                      <CtaIcon className="w-4 h-4" />
                      {announcement.ctaLabel}
                    </Link>
                    <button
                      onClick={() => dismissAnnouncement(announcement.id)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      aria-label="Fermer"
                    >
                      <X className="w-4 h-4 text-white/80 hover:text-white" />
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
