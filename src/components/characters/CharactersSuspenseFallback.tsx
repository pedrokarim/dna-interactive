type CharactersSuspenseFallbackProps = {
  title: string;
  description?: string;
};

const CARD_PORTRAIT_WIDTHS = ["w-2/3", "w-1/2", "w-3/5"] as const;

export default function CharactersSuspenseFallback({
  title,
  description,
}: CharactersSuspenseFallbackProps) {
  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-slate-900/60 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-cyan-500/10"
      />

      <div className="relative animate-pulse space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-300/85">Chargement</p>
            <p className="text-xl font-semibold text-white">{title}</p>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300">{description}</p>
            ) : null}
          </div>
          <div className="h-9 w-28 rounded-lg border border-slate-700/80 bg-slate-800/80" />
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CARD_PORTRAIT_WIDTHS.map((titleWidth, index) => (
            <article
              key={`loading-card-${index}`}
              className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-950/55 p-3"
            >
              <div className="aspect-square w-full rounded-lg bg-slate-800/70" />
              <div className={`h-4 rounded-md bg-slate-800/85 ${titleWidth}`} />
              <div className="h-3 w-full rounded-md bg-slate-800/70" />
              <div className="mt-2 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-indigo-500/20" />
                <div className="h-6 w-20 rounded-full bg-cyan-500/20" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
