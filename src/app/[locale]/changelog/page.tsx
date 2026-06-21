"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { changelogData } from "@/lib/changelogData";
import { typeConfig } from "@/lib/changelogConfig";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaDivider } from "@/components/dna/Divider";

export default function ChangelogPage() {
  const t = useTranslations("changelog");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center border border-gold/30 bg-gold/10 text-gold">
          <Sparkles className="h-7 w-7" />
        </span>
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">Journal</p>
        <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
        <p className="mt-5 text-lg text-parch/80">{t("description")}</p>
      </motion.div>

      <div className="space-y-6">
        {changelogData.map((entry, index) => {
          const config = typeConfig[entry.type];
          const IconComponent = config.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <DnaPanel className={`p-6 transition-colors hover:border-gold/40 ${config.borderColor}`}>
                <div className="mb-4 flex items-start gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center border ${config.borderColor} ${config.bgColor} text-parch`}>
                    <IconComponent className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl text-parch">{entry.title}</h2>
                      <span className={`rounded-sm border px-2.5 py-0.5 font-caps text-[0.56rem] uppercase tracking-[0.16em] ${config.borderColor} ${config.bgColor} text-parch`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="mb-3 flex items-center gap-3 text-sm text-muted">
                      <span className="font-caps font-semibold text-gold">v{entry.version}</span>
                      <span>•</span>
                      <span>{dateFormatter.format(new Date(entry.date))}</span>
                    </div>
                    <p className="leading-relaxed text-parch/85">{entry.description}</p>
                  </div>
                </div>

                <div className="ml-16 space-y-2">
                  {entry.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3 text-parch/85">
                      <span className="mt-1 shrink-0 text-gold">◇</span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </DnaPanel>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-12 text-center"
      >
        <Link
          href="/"
          className="dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
        >
          {tc("backToHome")}
        </Link>
      </motion.div>
    </div>
  );
}
