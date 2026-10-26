/**
 * Illustration de la 404 : un fragment de carte du jeu (ses courbes de niveau)
 * où le marqueur de position du joueur cherche son cap sans le trouver.
 *
 * Tout est en CSS (`.dna-404-*` dans globals.css) : aucune hydratation, et
 * `prefers-reduced-motion` fige les animations sur leur dernière image, que
 * les keyframes ramènent à la position de repos.
 */
export function LostMarker() {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[13rem] sm:max-w-[16rem] md:max-w-[20rem]">
      {/* Toujours sombre, comme l'écran de carte du jeu : le marqueur doré et
          son halo sont dessinés pour un fond nuit et s'effacent sur du clair. */}
      <div className="dna-force-dark absolute inset-0 overflow-hidden rounded-md border border-gold/25 bg-panel">
        {/* Courbes de niveau dorées, qui glissent lentement vers la gauche. */}
        <div className="dna-404-contours absolute inset-y-0 left-0" />
        {/* Les bords se fondent dans le fond : on ne voit qu'un fragment. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,var(--color-panel)_92%)]" />

        <span className="dna-404-ring absolute left-1/2 top-1/2 h-20 w-20 rounded-full border border-gold/50" />
        <span className="dna-404-ring dna-404-ring--late absolute left-1/2 top-1/2 h-20 w-20 rounded-full border border-gold/50" />

        {/* `loading="lazy"` : sans lui, React 19 précharge ces images dans
            le <head> de TOUTES les pages, la 404 étant gardée en réserve par
            le layout. Sur la 404 elle-même, elles sont à l'écran et chargent aussitôt. */}
        <img
          loading="lazy"
          src="/assets/ui/not-found/player-location.webp"
          alt=""
          width={128}
          height={128}
          className="dna-404-hunt absolute left-1/2 top-1/2 -ml-12 -mt-12 h-24 w-24 select-none"
        />
      </div>

      {/* Autocollant de la messagerie du jeu, posé en coin. */}
      <img
        loading="lazy"
        src="/assets/ui/not-found/confused-sticker.webp"
        alt=""
        width={256}
        height={256}
        className="dna-404-bob absolute -bottom-5 -right-3 h-24 w-24 select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] sm:h-28 sm:w-28 md:h-32 md:w-32"
      />
    </div>
  );
}
