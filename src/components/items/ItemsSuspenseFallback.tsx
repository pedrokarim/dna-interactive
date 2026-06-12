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
      className="relative overflow-hidden border border-line/25 bg-panel/60 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-gold/10 via-transparent to-hydro/10"
      />

      <div className="relative space-y-6 animate-pulse">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="font-caps text-xs uppercase tracking-[0.24em] text-gold/85">Chargement</p>
            <p className="font-display text-2xl text-parch">{title}</p>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-parch/85">{description}</p>
            ) : null}
          </div>
          <div className="h-9 w-28 border border-line/15 bg-panel/80" />
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          {CARD_TITLE_WIDTHS.map((titleWidth, index) => (
            <article
              key={`loading-card-${index}`}
              className="space-y-3 border border-line/15 bg-ink/55 p-4"
            >
              <div className={`h-4 bg-panel/85 ${titleWidth}`} />
              <div className="h-3 w-full bg-panel/70" />
              <div className="h-3 w-5/6 bg-panel/70" />
              <div className="mt-3 flex gap-2">
                <div className="h-6 w-20 rounded-sm bg-gold/20" />
                <div className="h-6 w-24 rounded-sm bg-hydro/20" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
