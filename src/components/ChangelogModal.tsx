"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { changelogData } from "@/lib/changelogData";
import { typeConfig } from "@/lib/changelogConfig";
import { useLocale, useTranslations } from "next-intl";
import { DnaButton, DnaDialog } from "@/components/dna";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const t = useTranslations("changelog");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  return (
    <DnaDialog
      open={isOpen}
      onClose={onClose}
      size="4xl"
      title={
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-gold to-gold-deep">
            <Sparkles className="h-5 w-5 text-ink" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-2xl text-parch">{t("title")}</span>
            <span className="font-sans text-sm text-muted">{t("description")}</span>
          </span>
        </span>
      }
      footer={
        <DnaButton variant="gold" onClick={onClose} className="w-full px-4 py-2">
          {tCommon("close")}
        </DnaButton>
      }
    >
      <div className="space-y-6">
        {changelogData.map((entry, index) => {
          const config = typeConfig[entry.type];
          const IconComponent = config.icon;

          return (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border ${config.borderColor} p-5 transition-colors duration-300 hover:border-gold/40`}
            >
              <div className="mb-4 flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center bg-linear-to-br ${config.color}`}>
                  <IconComponent className="h-6 w-6 text-parch" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h4 className="font-display text-xl text-parch">{entry.title}</h4>
                    <span
                      className={`px-2.5 py-1 font-caps text-[0.56rem] uppercase tracking-[0.16em] ${config.bgColor} border ${config.borderColor} text-parch`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-gold">v{entry.version}</span>
                    </span>
                    <span>•</span>
                    <span>{dateFormatter.format(new Date(entry.date))}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-parch/85">{entry.description}</p>
                </div>
              </div>

              <div className="ml-16 space-y-1.5">
                {entry.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-3 text-sm text-parch/85">
                    <span className="mt-1 shrink-0 text-gold">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </DnaDialog>
  );
}
