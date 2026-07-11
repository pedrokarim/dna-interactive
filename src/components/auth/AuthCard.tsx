import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DnaPanel, DnaSectionLabel } from "@/components/dna";

/** Carte centrée réutilisée par les pages login / signup / mot de passe. */
export function AuthCard({
  kicker,
  title,
  subtitle,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-md">
        <DnaSectionLabel>{kicker}</DnaSectionLabel>
        <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 font-sans text-sm text-muted">{subtitle}</p> : null}
        <DnaPanel className="mt-6 p-6">{children}</DnaPanel>
        {footer ? <div className="mt-4 text-center font-sans text-sm text-muted">{footer}</div> : null}
      </div>
    </section>
  );
}

/** Lien stylé en bouton doré (évite un <button> dans un <a>). */
export function AuthLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="dna-shine inline-flex items-center justify-center gap-2 rounded-md border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-6 py-2.5 font-sans text-sm tracking-wide text-gold-bright shadow-[inset_0_1px_0_rgba(227,205,149,0.22)] transition-colors hover:border-gold-bright hover:text-[#fff6e6]"
    >
      {children}
    </Link>
  );
}
