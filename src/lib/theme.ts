/**
 * Thème clair / sombre.
 *
 * Ce qui s'affiche dépend de `data-theme` sur <html>, écrit par
 * `THEME_INIT_SCRIPT` avant la première peinture : sinon la page s'affiche en
 * sombre puis saute en clair après hydratation. Même principe que l'état replié
 * de la barre latérale (`data-sidebar`).
 *
 * La préférence (qui peut valoir « auto ») est dans le localStorage ; l'attribut
 * ne porte que le thème résolu. Le CSS n'a qu'un sélecteur à connaître :
 * `:root[data-theme="light"]`.
 */

export const THEME_STORAGE_KEY = "dna:theme";

/** Ce que l'utilisateur choisit. */
export type ThemePreference = "auto" | "light" | "dark";

/** Ce qui est réellement appliqué à la page. */
export type ResolvedTheme = "light" | "dark";

export const THEME_PREFERENCES = ["auto", "light", "dark"] as const satisfies readonly ThemePreference[];

/**
 * Thème par défaut, quand rien n'a été choisi.
 *
 * Sombre : le site l'a toujours été, on ne bascule pas les visiteurs en clair
 * sans qu'ils le demandent. « auto » est à un clic.
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";

export const LIGHT_MEDIA_QUERY = "(prefers-color-scheme: light)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "auto" || value === "light" || value === "dark";
}

/** Résout une préférence en thème effectif, en consultant le système si besoin. */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "auto") return preference;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(LIGHT_MEDIA_QUERY).matches ? "light" : "dark";
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
  } catch {
    // Stockage indisponible (navigation privée stricte) : on reste sur le défaut.
    return DEFAULT_THEME_PREFERENCE;
  }
}

/** Applique un thème résolu au document, et accorde la barre du navigateur. */
export function applyResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#eee7d9" : "#0a0a0b");
}

/**
 * Script lancé avant la première peinture (voir app/[locale]/layout.tsx).
 * Minuscule et sans dépendance : il est inline dans le <head>.
 */
export const THEME_INIT_SCRIPT = `try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');if(p!=='auto'&&p!=='light'&&p!=='dark'){p='${DEFAULT_THEME_PREFERENCE}'}var r=p==='auto'?(matchMedia('${LIGHT_MEDIA_QUERY}').matches?'light':'dark'):p;document.documentElement.dataset.theme=r;if(r==='light'){var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content','#eee7d9')}}}catch(e){document.documentElement.dataset.theme='dark'}`;
