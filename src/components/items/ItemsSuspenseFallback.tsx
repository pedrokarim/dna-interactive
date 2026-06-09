type ItemsSuspenseFallbackProps = {
  title: string;
  description?: string;
};

const CARD_TITLE_WIDTHS = ["w-2/3", "w-1/2", "w-3/5"] as const;

export default function ItemsSuspenseFallback({
  title,
  description,
}: ItemsSuspenseFallbackProps) {
  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="relative overflow-hidden rounded-2xl border border-gold/25 bg-panel/60 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-gold/10 via-transparent to-hydro/10"
      />

      <div className="relative space-y-6 animate-pulse">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-gold/85">Chargement</p>
            <p className="text-xl font-semibold text-parch">{title}</p>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-parch/85">{description}</p>
            ) : null}
          </div>
          <div className="h-9 w-28 rounded-lg border border-white/10 bg-panel/80" />
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          {CARD_TITLE_WIDTHS.map((titleWidth, index) => (
            <article
              key={`loading-card-${index}`}
              className="space-y-3 rounded-xl border border-white/10 bg-ink/55 p-4"
            >
              <div className={`h-4 rounded-md bg-panel/85 ${titleWidth}`} />
              <div className="h-3 w-full rounded-md bg-panel/70" />
              <div className="h-3 w-5/6 rounded-md bg-panel/70" />
              <div className="mt-3 flex gap-2">
                <div className="h-6 w-20 rounded-full bg-gold/20" />
                <div className="h-6 w-24 rounded-full bg-hydro/20" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
