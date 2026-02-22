import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeInfo,
  BookOpenText,
  Calculator,
  Database,
  Languages,
  Layers,
  SlidersHorizontal,
  Sparkles,
  Wrench,
} from "lucide-react";
import { getItemCatalog, getItemCategoryBySlug } from "@/lib/items/catalog";
import { generatePageMetadata } from "@/lib/metadata";

type CategoryAboutPageProps = {
  params: Promise<{ category: string }>;
};

function GuideBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-950/60 px-3 py-1 text-xs text-slate-200">
      {icon}
      {label}
    </span>
  );
}

function ModsAboutContent({ categorySlug }: { categorySlug: string }) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-cyan-400/25 bg-slate-900/65 p-8 shadow-[0_24px_55px_rgba(8,47,73,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la liste
          </Link>
          <GuideBadge icon={<BookOpenText className="h-3.5 w-3.5 text-cyan-300" />} label="Guide DEMON WEDGE / MOD" />
        </div>

        <h1 className="mt-5 text-4xl font-semibold text-white">Comment fonctionnent les Demon Wedges</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Dans le jeu, les Demon Wedges sont nommes <span className="text-cyan-200">MOD</span> dans les
          donnees. Cette page explique les champs importants utilises sur le site: niveau, affinite, tolerance,
          effets dynamiques et correspondance des assets.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <GuideBadge icon={<Layers className="h-3.5 w-3.5 text-indigo-300" />} label="Niveaux 0 -> MaxLevel" />
          <GuideBadge icon={<Calculator className="h-3.5 w-3.5 text-amber-300" />} label="Tolerance = Cost + Level * CostChange" />
          <GuideBadge icon={<Languages className="h-3.5 w-3.5 text-emerald-300" />} label="Traductions FR/EN/..." />
          <GuideBadge icon={<Database className="h-3.5 w-3.5 text-violet-300" />} label="Infos de reference gameplay" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <BadgeInfo className="h-5 w-5 text-cyan-300" />
            1) Structure d&apos;un MOD
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>
              Chaque MOD possede un nom, une description, une rarete, une affinite et un niveau max.
            </li>
            <li>
              Le nom affiche dans le jeu est <code>Demon Wedge</code>, mais le nom technique est <code>MOD</code>.
            </li>
            <li>
              Les textes (nom, description, effets passifs) changent selon la langue selectionnee.
            </li>
            <li>
              Le site expose ces infos en JSON pour pouvoir filtrer, comparer les langues et ouvrir les details.
            </li>
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="text-lg font-semibold text-white">Affinite et icones</h2>
          <p className="mt-3 text-sm text-slate-300">
            Le champ <code>Polarity</code> definit le type d&apos;affinite. Ces icones servent de repere visuel rapide.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 p-2 text-xs text-slate-200">
              <img src="/assets/items/mods/T_Armory_Polarity01.png" alt="Polarity 1" className="h-6 w-6 object-contain" />
              Polarity 1
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 p-2 text-xs text-slate-200">
              <img src="/assets/items/mods/T_Armory_Polarity02.png" alt="Polarity 2" className="h-6 w-6 object-contain" />
              Polarity 2
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 p-2 text-xs text-slate-200">
              <img src="/assets/items/mods/T_Armory_Polarity03.png" alt="Polarity 3" className="h-6 w-6 object-contain" />
              Polarity 3
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 p-2 text-xs text-slate-200">
              <img src="/assets/items/mods/T_Armory_Polarity04.png" alt="Polarity 4" className="h-6 w-6 object-contain" />
              Polarity 4
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <SlidersHorizontal className="h-5 w-5 text-indigo-300" />
            2) Niveaux et valeurs dynamiques
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Les valeurs <code>#1</code>, <code>#2</code>, etc. changent selon le niveau du MOD. Le slider dans la
            page detail applique ces valeurs depuis la table de croissance et affiche l&apos;effet au niveau choisi.
          </p>
          <div className="mt-4 rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4 text-sm text-indigo-100">
            Niveau par defaut = <code>0</code> (piece non montee)<br />
            Niveau max = <code>MaxLevel</code>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Calculator className="h-5 w-5 text-amber-300" />
            3) Tolerance / cout
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            La tolerance affichee evolue avec le niveau. Le calcul expose dans les donnees est:
          </p>
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 font-mono text-sm text-amber-100">
            tolerance(level) = Cost + level * CostChange
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Le site pre-calcule les valeurs par niveau et les place dans <code>tolerance.valuesByLevel</code>.
          </p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Languages className="h-5 w-5 text-emerald-300" />
            4) Multi-langue
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Sur la grille: tu peux afficher plusieurs langues en meme temps pour comparer les noms. Sur le detail:
            une langue unique peut etre choisie et partagee via l&apos;URL.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Les langues actuellement disponibles dependent du dataset charge pour la categorie.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Wrench className="h-5 w-5 text-violet-300" />
            5) Ce que le site affiche
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              Informations generales du MOD (nom, rarete, fonction, description)
            </li>
            <li>
              Evolution par niveau via le slider
            </li>
            <li>
              Affinite + icone associee
            </li>
            <li>
              Noms multilingues pour comparer rapidement
            </li>
            <li>
              Recherche, filtres, favoris et pagination pour la navigation
            </li>
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-cyan-500/25 bg-linear-to-r from-cyan-500/10 to-indigo-500/10 p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          Ce que tu peux faire ensuite
        </h2>
        <p className="mt-3 text-sm text-slate-200">
          Utilise la grille pour filtrer et comparer rapidement, puis ouvre un item pour voir ses valeurs dynamiques,
          sa tolerance par niveau et son affinite.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20"
          >
            Ouvrir la grille MOD
          </Link>
          <Link
            href="/items/favoris"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-white"
          >
            Voir mes favoris
          </Link>
        </div>
      </section>
    </div>
  );
}

function GenericCategoryAboutContent({
  categoryTitle,
  categorySlug,
}: {
  categoryTitle: string;
  categorySlug: string;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-500/25 bg-slate-900/65 p-8">
        <Link
          href={`/items/${categorySlug}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a la liste
        </Link>
        <h1 className="mt-5 text-4xl font-semibold text-white">Guide {categoryTitle}</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Cette categorie est prete pour recevoir une page explicative detaillee. Le systeme est deja en place pour
          ajouter les regles, formules et visuels specifiques a chaque nouvelle famille d&apos;items.
        </p>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  const catalog = getItemCatalog();
  return catalog.categories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata(
  { params }: CategoryAboutPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getItemCategoryBySlug(categorySlug);

  if (!category) {
    return generatePageMetadata(
      {
        title: "Guide items",
        description: "Documentation des categories d'items Duet Night Abyss.",
        url: "https://dna-interactive.ascencia.re/items",
      },
      parent,
    );
  }

  return generatePageMetadata(
    {
      title: `Guide ${category.title}`,
      description: `Comprendre le fonctionnement de ${category.title}: niveaux, affinite, tolerance, traductions et lecture des effets.`,
      url: `https://dna-interactive.ascencia.re/items/${category.slug}/about`,
      keywords: [
        "Duet Night Abyss",
        "items guide",
        "demon wedge",
        "mods",
        "affinite",
        "tolerance",
        category.title,
      ],
    },
    parent,
  );
}

export default async function CategoryAboutPage({ params }: CategoryAboutPageProps) {
  const { category: categorySlug } = await params;
  const category = getItemCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  if (category.id === "mods") {
    return <ModsAboutContent categorySlug={category.slug} />;
  }

  return <GenericCategoryAboutContent categoryTitle={category.title} categorySlug={category.slug} />;
}
