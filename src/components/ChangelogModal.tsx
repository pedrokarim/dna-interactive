"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { changelogData } from "@/lib/changelogData";
import { typeConfig } from "@/lib/changelogConfig";
import { useTranslations } from "next-intl";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({
  isOpen,
  onClose,
}: ChangelogModalProps) {
  const t = useTranslations("changelog");
  const tCommon = useTranslations("common");
  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
        <div
          className="bg-ink/95 backdrop-blur-md rounded-lg border border-gold/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gold/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-gold to-electro rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-parch" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-parch">{t("title")}</h3>
                <p className="text-sm text-gray-400">
                  {t("description")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-parch transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-6">
              {changelogData.map((entry, index) => {
                const config = typeConfig[entry.type];
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`bg-linear-to-br from-panel/50 to-panel/50 backdrop-blur-sm border ${config.borderColor} rounded-xl p-5 hover:border-gold/40 transition-all duration-300`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`w-12 h-12 bg-linear-to-br ${config.color} rounded-lg flex items-center justify-center shrink-0`}
                      >
                        <IconComponent className="w-6 h-6 text-parch" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="text-lg font-bold text-parch">
                            {entry.title}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} border ${config.borderColor} text-parch`}
                          >
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-gold">
                              v{entry.version}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(entry.date).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    </div>

                    <div className="ml-16 space-y-1.5">
                      {entry.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex items-start gap-3 text-sm text-gray-300"
                        >
                          <span className="text-gold mt-1 shrink-0">
                            •
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gold/20">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-parch bg-gold/80 hover:bg-gold rounded-md transition-colors border border-gold/50"
            >
              {tCommon("close")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
