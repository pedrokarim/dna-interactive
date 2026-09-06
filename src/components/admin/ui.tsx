"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/dna";

/**
 * Primitives du back-office.
 *
 * Le site public et l'administration n'ont pas le même métier. Le site cherche
 * à séduire : grands titres, panneaux espacés, boutons larges à libellé. Une
 * console d'administration cherche à faire tenir beaucoup d'informations à
 * l'écran et à rendre chaque action atteignable en un geste. Réutiliser les
 * composants marketing ici produit exactement ce qu'on veut éviter : quatre
 * boutons à rallonge par ligne, trois lignes de hauteur par enregistrement.
 *
 * D'où ce jeu de primitives séparé : tableaux denses, actions en icônes avec
 * infobulle, statuts en pastille, barre d'outils unique par vue. Les couleurs,
 * elles, restent celles du design system – c'est le même produit.
 */

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type AdminIconButtonTone = "default" | "danger" | "active";

const TONE_CLASS: Record<AdminIconButtonTone, string> = {
  default: "border-white/12 text-parch/70 hover:border-gold/50 hover:bg-gold/10 hover:text-gold-bright",
  active: "border-gold/45 bg-gold/12 text-gold-bright hover:border-gold hover:bg-gold/20",
  danger: "border-white/12 text-parch/60 hover:border-crimson-bright/60 hover:bg-crimson/15 hover:text-crimson-soft",
};

/**
 * Bouton d'action carré, sans libellé visible.
 *
 * Le libellé n'est pas supprimé, il est déplacé : `aria-label` pour les
 * technologies d'assistance, `title` pour l'infobulle au survol. Une icône
 * seule sans l'un des deux serait un rébus.
 *
 * L'infobulle est celle du navigateur, et c'est délibéré. Une infobulle maison
 * est un élément positionné en absolu : dans un tableau à `overflow-x: auto`
 * elle est rognée sur la dernière colonne, et elle élargit la zone de
 * défilement au survol. L'infobulle native, elle, échappe à tout conteneur.
 */
export function AdminIconButton({
  icon: Icon,
  label,
  tone = "default",
  disabled,
  busy,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: AdminIconButtonTone;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center border transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/12 disabled:hover:bg-transparent",
        TONE_CLASS[tone],
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
    </button>
  );
}

/**
 * Même bouton, mais c'est un lien (ouvrir une fiche publique, par exemple).
 * Dupliquer le style plutôt que de rendre `AdminIconButton` polymorphe garde
 * les deux appels lisibles.
 */
export function AdminIconLink({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center border transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
        TONE_CLASS.default,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
}

/** Groupe d'actions en fin de ligne. */
export function AdminActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

/** Filet vertical entre deux groupes d'actions (ex. avant le destructif). */
export function AdminActionsDivider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-white/10" />;
}

// ---------------------------------------------------------------------------
// Statuts
// ---------------------------------------------------------------------------

export type AdminStatusTone = "ok" | "warn" | "danger" | "neutral" | "info";

const STATUS_DOT: Record<AdminStatusTone, string> = {
  ok: "bg-[#7bbf7b]",
  warn: "bg-gold-bright",
  danger: "bg-crimson-bright",
  neutral: "bg-muted-2",
  info: "bg-hydro",
};

const STATUS_TEXT: Record<AdminStatusTone, string> = {
  ok: "text-parch/80",
  warn: "text-gold-bright",
  danger: "text-crimson-soft",
  neutral: "text-muted",
  info: "text-hydro",
};

/**
 * Pastille d'état. Volontairement minuscule : dans un tableau, un statut est
 * une information de balayage, pas un bouton.
 */
export function AdminStatus({ tone, children }: { tone: AdminStatusTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap font-sans text-[0.72rem]", STATUS_TEXT[tone])}>
      <span aria-hidden className={cn("h-[6px] w-[6px] shrink-0 rounded-full", STATUS_DOT[tone])} />
      {children}
    </span>
  );
}

/** Étiquette neutre pour une valeur catégorielle (rôle, type, audience). */
export function AdminChip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "gold" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap border px-1.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-[0.08em]",
        tone === "gold"
          ? "border-gold/35 bg-gold/8 text-gold"
          : tone === "danger"
            ? "border-crimson-bright/40 bg-crimson/12 text-crimson-soft"
            : "border-white/12 bg-white/[0.03] text-muted",
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

/**
 * Surface de contenu. En-tête compact : un libellé en petites capitales et les
 * actions de la vue. Pas de grand titre d'affichage – on n'est pas sur une
 * page de présentation, et chaque ligne de titre coûte une ligne de données.
 */
export function AdminPanel({
  label,
  count,
  actions,
  footer,
  children,
  className,
}: {
  label: string;
  count?: number;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 border border-white/10 bg-[#0c0f15]", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate font-caps text-[0.62rem] uppercase tracking-[0.2em] text-gold">{label}</h2>
          {count !== undefined ? (
            <span className="font-mono text-[0.68rem] text-muted-2 tabular-nums">{count}</span>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </header>
      <div className="min-w-0">{children}</div>
      {footer ? <footer className="border-t border-white/10 px-3 py-2">{footer}</footer> : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tableaux
// ---------------------------------------------------------------------------

export function AdminTable({ children, minWidth = "48rem" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function AdminTh({
  children,
  align = "left",
  width,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={cn(
        "border-b border-white/10 bg-white/[0.02] px-3 py-1.5 font-caps text-[0.54rem] font-normal uppercase tracking-[0.16em] text-muted-2",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2 align-middle font-sans text-[0.82rem] text-parch/85",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Ligne de tableau : survol marqué, filet fin, état « atténué » optionnel. */
export function AdminTr({
  children,
  dimmed,
}: {
  children: ReactNode;
  dimmed?: boolean;
}) {
  return (
    <tr className={cn("border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.035]", dimmed && "opacity-70")}>
      {children}
    </tr>
  );
}

/**
 * Cellule d'identité : libellé principal + ligne secondaire discrète.
 * Le motif revient dans chaque tableau (build + auteur, compte + email…).
 */
export function AdminIdentity({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-sans text-[0.85rem] text-parch">{primary}</span>
      {secondary ? <span className="truncate font-mono text-[0.66rem] text-muted-2">{secondary}</span> : null}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Barre d'outils
// ---------------------------------------------------------------------------

/**
 * Filtre de la vue courante.
 *
 * Le raccourci « / » place le curseur ici : c'est le geste attendu dans une
 * console, et il évite d'aller chercher le champ à la souris à chaque fois.
 */
export function AdminSearch({
  value,
  onChange,
  placeholder,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Précision affichée sous le champ (ex. portée réelle du filtre). */
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      // Ne pas voler la frappe à quelqu'un en train d'écrire.
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2 border border-white/12 bg-black/25 px-2.5 py-1.5 focus-within:border-gold/50">
        <Search aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-2" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent font-sans text-[0.82rem] text-parch outline-none placeholder:text-muted-2 [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Effacer le filtre"
            className="grid h-4 w-4 place-items-center text-muted-2 transition-colors hover:text-parch"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 border border-white/12 px-1 font-mono text-[0.6rem] text-muted-2 sm:block">/</kbd>
        )}
      </div>
      {hint ? <p className="mt-1 font-sans text-[0.66rem] text-muted-2">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaires
//
// Les champs de saisie partagent un style unique pour tout le back-office :
// trois panneaux qui inventent chacun leur bordure, c'est ce qui donne
// l'impression d'un assemblage bricolé.
// ---------------------------------------------------------------------------

/**
 * Largeurs de champ, par nature de contenu.
 *
 * Un champ n'a pas à occuper toute la largeur disponible : sa taille annonce ce
 * qu'on attend dedans. Une date n'a jamais besoin de 800 pixels, et un champ
 * « ordre de tri » étiré sur tout l'écran pour trois chiffres est absurde à
 * lire comme à remplir.
 *
 * Ce sont des largeurs MAXIMALES : sur un écran étroit, le champ se réduit tout
 * seul jusqu'à la largeur disponible.
 */
export const FIELD_WIDTH = {
  /** Nombre court : ordre de tri, quantité. */
  num: "max-w-[7rem]",
  /** Date seule. */
  date: "max-w-[11rem]",
  /** Date et heure. */
  datetime: "max-w-[14rem]",
  /** Liste déroulante, mot-clé, pseudo. */
  short: "max-w-[20rem]",
  /** Titre, email, identifiant. */
  medium: "max-w-[32rem]",
  /** URL, chemin d'asset, secret. */
  long: "max-w-[44rem]",
  /** Zone de texte multi-ligne. */
  text: "max-w-[44rem]",
} as const;

export type FieldWidth = keyof typeof FIELD_WIDTH;

/** Largeur maximale d'un formulaire : au-delà, l'œil perd la ligne. */
export const FORM_MAX_WIDTH = "max-w-[62rem]";

export const adminInputClass =
  "w-full border border-white/12 bg-black/25 px-2.5 py-1.5 font-sans text-[0.82rem] text-parch outline-none transition-colors placeholder:text-muted-2 focus:border-gold/50";

export const adminLabelClass = "mb-1 block font-caps text-[0.54rem] uppercase tracking-[0.16em] text-muted-2";

/**
 * Bouton de formulaire, libellé visible.
 *
 * Contrepoint assumé aux boutons-icônes : dans une liste on répète le même
 * geste sur des dizaines de lignes, dans un formulaire on le fait une fois et
 * il engage une saisie. Une icône seule y serait un piège.
 */
export function AdminFormButton({
  children,
  variant = "ghost",
  disabled,
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 border px-3 py-1.5 font-sans text-[0.78rem] transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary"
          ? "border-gold/50 bg-gold/10 text-gold-bright hover:border-gold hover:bg-gold/20"
          : "border-white/12 text-parch/75 hover:border-white/30 hover:text-parch",
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export type AdminPagination = { page: number; pageSize: number; total: number; totalPages: number };

export function AdminPager({
  pagination,
  onChange,
}: {
  pagination: AdminPagination;
  onChange: (page: number) => void;
}) {
  const { page, pageSize, total, totalPages } = pagination;
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-mono text-[0.68rem] text-muted-2 tabular-nums">
        {first}–{last} sur {total}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <AdminIconButton icon={ChevronsLeft} label="Première page" disabled={page <= 1} onClick={() => onChange(1)} />
          <AdminIconButton icon={ChevronLeft} label="Page précédente" disabled={page <= 1} onClick={() => onChange(page - 1)} />
          <span className="px-2 font-mono text-[0.68rem] text-muted tabular-nums">
            {page}/{totalPages}
          </span>
          <AdminIconButton icon={ChevronRight} label="Page suivante" disabled={page >= totalPages} onClick={() => onChange(page + 1)} />
          <AdminIconButton icon={ChevronsRight} label="Dernière page" disabled={page >= totalPages} onClick={() => onChange(totalPages)} />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// États
// ---------------------------------------------------------------------------

export function AdminEmpty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="grid place-items-center gap-2 px-4 py-10 text-center">
      <Icon aria-hidden className="h-5 w-5 text-muted-2" />
      <p className="font-sans text-[0.82rem] text-muted">{text}</p>
    </div>
  );
}

/** Squelette de tableau pendant le chargement initial. */
export function AdminTableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-white/[0.06]">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-3 px-3 py-2.5">
          {Array.from({ length: columns }, (_, colIndex) => (
            <span
              key={colIndex}
              className="h-3 animate-pulse bg-white/[0.06]"
              style={{ width: colIndex === 0 ? "34%" : `${Math.max(8, 46 / columns)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
