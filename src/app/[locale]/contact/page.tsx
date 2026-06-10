"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { CONTACT_INFO } from "@/lib/constants";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaDivider } from "@/components/dna/Divider";

const INPUT_CLASS =
  "w-full rounded-sm border border-gold/30 bg-ink/40 px-4 py-3 text-parch placeholder-muted-2 outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold/60";

export default function ContactPage() {
  const t = useTranslations("contact");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      if (!executeRecaptcha) {
        throw new Error(t("errorRecaptcha"));
      }
      const recaptchaToken = await executeRecaptcha("contact_form");
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });
      const result = await response.json();

      if (response.ok) {
        setSubmitStatus({ type: "success", message: t("successMessage") });
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus({ type: "error", message: result.error || t("errorGeneric") });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setSubmitStatus({
        type: "error",
        message: error instanceof Error ? error.message : t("errorUnexpected"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const infoRows = [
    {
      d: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      title: t("emailLabel"),
      value: CONTACT_INFO.email,
    },
    {
      d: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      title: t("supportLabel"),
      value: t("supportDescription"),
    },
    {
      d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      title: t("responseTimeLabel"),
      value: t("responseTimeValue"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 text-center">
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">{t("title")}</p>
        <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
        <p className="mt-5 text-lg text-parch/80">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {/* Infos */}
        <div className="space-y-8">
          <DnaPanel className="p-7 md:p-8">
            <h2 className="mb-6 font-display text-2xl text-parch">{t("infoTitle")}</h2>
            <div className="space-y-6">
              {infoRows.map((row) => (
                <div key={row.title} className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold/30 bg-gold/10 text-gold">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={row.d} />
                    </svg>
                  </span>
                  <div>
                    <h4 className="font-medium text-parch">{row.title}</h4>
                    <p className="mt-0.5 text-muted">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </DnaPanel>

          <DnaPanel className="p-7 md:p-8">
            <h2 className="mb-3 font-display text-2xl text-parch">{t("joinCommunityTitle")}</h2>
            <p className="mb-6 text-muted">{t("joinCommunityDescription")}</p>
            <a
              href={CONTACT_INFO.discord.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dna-shine inline-flex items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.120.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {CONTACT_INFO.discord.label}
            </a>
          </DnaPanel>
        </div>

        {/* Formulaire */}
        <DnaPanel className="p-7 md:p-8">
          <h2 className="mb-6 font-display text-2xl text-parch">{t("formTitle")}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block font-caps text-[0.62rem] uppercase tracking-[0.16em] text-parch/80">
                  {t("labelName")}
                </label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={INPUT_CLASS} placeholder={t("placeholderName")} required />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block font-caps text-[0.62rem] uppercase tracking-[0.16em] text-parch/80">
                  {t("labelEmail")}
                </label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={INPUT_CLASS} placeholder={t("placeholderEmail")} required />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block font-caps text-[0.62rem] uppercase tracking-[0.16em] text-parch/80">
                {t("labelSubject")}
              </label>
              <select id="subject" name="subject" value={formData.subject} onChange={handleChange} className={INPUT_CLASS} required>
                <option value="">{t("placeholderSubject")}</option>
                <option value="bug">{t("subjectBug")}</option>
                <option value="suggestion">{t("subjectSuggestion")}</option>
                <option value="question">{t("subjectQuestion")}</option>
                <option value="partnership">{t("subjectPartnership")}</option>
                <option value="other">{t("subjectOther")}</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block font-caps text-[0.62rem] uppercase tracking-[0.16em] text-parch/80">
                {t("labelMessage")}
              </label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={6} className={`${INPUT_CLASS} resize-none`} placeholder={t("placeholderMessage")} required />
            </div>

            {submitStatus.type && (
              <div
                className={`flex items-center gap-2 rounded-sm border p-4 text-sm ${
                  submitStatus.type === "success"
                    ? "border-anemo/30 bg-anemo/10 text-anemo"
                    : "border-crimson-bright/30 bg-crimson/10 text-crimson-bright"
                }`}
              >
                {submitStatus.type === "success" ? (
                  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{submitStatus.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="dna-shine inline-flex w-full items-center justify-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-3 font-medium text-gold-bright transition-all duration-200 hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg className="-ml-1 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("submitting")}
                </>
              ) : (
                t("submitButton")
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-2">{t("requiredFieldsNote")}</p>
        </DnaPanel>
      </div>
    </div>
  );
}
