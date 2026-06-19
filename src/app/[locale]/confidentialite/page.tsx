import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { DnaPanel, DnaSectionLabel } from "@/components/dna";

export const metadata: Metadata = {
  title: "Confidentialité & conditions - DNA Interactive",
  description:
    "Politique de confidentialité et conditions d'utilisation du builder de builds communautaire de DNA Interactive.",
};

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-ink text-parch">
      <SiteHeader />
      <section className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-3xl">
          <DnaSectionLabel>Légal</DnaSectionLabel>
          <h1 className="mt-2 font-display text-3xl leading-tight text-parch md:text-4xl">
            Confidentialité &amp; conditions
          </h1>
          <p className="mt-2 font-sans text-sm text-muted">
            S&apos;applique à la connexion Discord et au builder de builds communautaire.
          </p>

          <div className="mt-6 space-y-4">
            <DnaPanel className="p-5">
              <DnaSectionLabel>Données collectées</DnaSectionLabel>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 font-sans text-sm leading-relaxed text-parch/85">
                <li>Identifiant Discord, pseudo et avatar (pour t&apos;identifier comme auteur).</li>
                <li>Adresse e-mail Discord, si tu l&apos;autorises à la connexion.</li>
                <li>Les builds, brouillons et votes que tu crées sur le site.</li>
              </ul>
              <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">
                Aucune autre donnée n&apos;est collectée. Nous n&apos;utilisons pas tes données à des
                fins publicitaires et ne les revendons pas.
              </p>
            </DnaPanel>

            <DnaPanel className="p-5">
              <DnaSectionLabel>Finalité &amp; conservation</DnaSectionLabel>
              <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">
                Ces données servent uniquement à faire fonctionner les comptes et le partage de
                builds (authentification, attribution d&apos;un build à son auteur, votes, modération).
                Elles sont conservées tant que ton compte existe et sont supprimées lorsque tu
                supprimes ton compte.
              </p>
            </DnaPanel>

            <DnaPanel className="p-5">
              <DnaSectionLabel>Tes droits</DnaSectionLabel>
              <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">
                Tu peux à tout moment consulter tes données, modifier ou supprimer tes builds, et
                <strong className="text-parch"> supprimer définitivement ton compte</strong> (avec
                l&apos;ensemble de tes builds, brouillons et votes) depuis ton{" "}
                <Link href="/profile" className="text-gold underline underline-offset-2 hover:text-gold-bright">
                  profil
                </Link>
                . La suppression est immédiate et irréversible.
              </p>
            </DnaPanel>

            <DnaPanel className="p-5">
              <DnaSectionLabel>Contenu publié par les utilisateurs</DnaSectionLabel>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 font-sans text-sm leading-relaxed text-parch/85">
                <li>Tu restes responsable des builds et des noms que tu publies.</li>
                <li>
                  Les noms et notes de build ne doivent pas contenir de propos haineux, de
                  harcèlement, de contenu illégal ou de spam.
                </li>
                <li>
                  Un build peut être signalé par la communauté ; un administrateur peut le masquer
                  ou le supprimer, et bannir un compte en cas d&apos;abus répété.
                </li>
                <li>
                  En publiant un build, tu acceptes qu&apos;il soit affiché publiquement sur le site
                  avec ton pseudo et ton avatar Discord.
                </li>
              </ul>
            </DnaPanel>

            <DnaPanel className="p-5">
              <DnaSectionLabel>Contact</DnaSectionLabel>
              <p className="mt-3 font-sans text-sm leading-relaxed text-parch/85">
                Pour toute question relative à tes données ou au retrait d&apos;un contenu, utilise la
                page{" "}
                <Link href="/contact" className="text-gold underline underline-offset-2 hover:text-gold-bright">
                  contact
                </Link>
                .
              </p>
            </DnaPanel>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
