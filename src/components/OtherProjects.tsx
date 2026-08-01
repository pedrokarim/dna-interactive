import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SITE_CONFIG } from "@/lib/constants";
import { OTHER_PROJECTS, ECOSYSTEM_HUB } from "@/lib/other-projects";
import { DnaDivider } from "@/components/dna/Divider";
import { DnaTag } from "@/components/dna/Tag";
import { DnaNouveau } from "@/components/dna/Badges";

/**
 * Promotion croisée des autres projets de l'écosystème Ascencia.
 *
 * Reprend la facture des cartes de la page « À propos » (coins nets, liseré
 * `line/20`, fond `ink/40`, accent or au survol) pour se lire comme une suite
 * de la page et non comme un encart publicitaire greffé. Placée en bas de
 * `/about` : les visiteurs qui arrivent là cherchent déjà à en savoir plus sur
 * le site, alors que l'accueil et les pages outil doivent rester sur leur sujet.
 *
 * Composant serveur : aucune interactivité, donc rien à envoyer au client.
 */
export async function OtherProjects() {
  const t = await getTranslations("otherProjects");

  return (
    <section id="autres-projets" aria-labelledby="autres-projets-titre" className="pt-4">
      <DnaDivider className="mx-auto max-w-[14rem]" />

      <div className="mt-10 text-center">
        <h2 id="autres-projets-titre" className="font-display text-2xl text-parch">
          {t("title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          {t("subtitle", { siteName: SITE_CONFIG.name })}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {OTHER_PROJECTS.map((project) => (
          <a
            key={project.id}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col border border-line/20 bg-ink/40 p-5 transition-colors duration-200 hover:border-gold/45"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden border border-gold/30 bg-gold/10">
                {/* Demandé en 88 px pour un rendu à 32 : net sur les écrans à
                    haute densité. `alt` vide : le nom du projet suit dans le
                    titre, l'annoncer deux fois n'apporte rien. */}
                <Image
                  src={project.logo}
                  alt=""
                  width={88}
                  height={88}
                  className="h-8 w-8 object-contain"
                />
              </span>
              {project.isNew ? (
                <DnaNouveau>{t("new")}</DnaNouveau>
              ) : (
                <DnaTag>{t(`items.${project.id}.tag`)}</DnaTag>
              )}
            </div>

            <h3 className="font-display text-lg leading-tight text-parch transition-colors duration-200 group-hover:text-gold-bright">
              {project.name}
            </h3>

            <p className="mt-2 grow text-sm leading-relaxed text-muted">
              {t(`items.${project.id}.description`)}
            </p>

            <span className="mt-4 inline-flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold">
              {t("discover")}
              <svg
                className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M7 7h10v10" />
              </svg>
            </span>
          </a>
        ))}
      </div>

      <div className="mt-8 text-center">
        <a
          href={ECOSYSTEM_HUB.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-gold"
        >
          {t("hubLink", { hubName: ECOSYSTEM_HUB.name })}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      </div>
    </section>
  );
}
