import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useRef } from "react";

/**
 * Palette du design system, lue sur les tokens réels.
 *
 * Les valeurs ne sont plus recopiées à la main : elles sont relevées sur
 * `:root` au moment du rendu. Une couleur retouchée dans `globals.css` se voit
 * donc ici sans que personne ait à penser à mettre la story à jour — et le
 * thème clair se documente tout seul.
 */

type Token = { name: string; token: string };

const NOYAU: Token[] = [
  { name: "Ink", token: "--color-ink" },
  { name: "Ink 2", token: "--color-ink-2" },
  { name: "Panneau", token: "--color-panel" },
  { name: "Or laiton", token: "--color-gold" },
  { name: "Or contrasté", token: "--color-gold-bright" },
  { name: "Or discret", token: "--color-gold-deep" },
  { name: "Cramoisi", token: "--color-crimson" },
  { name: "Cramoisi vif", token: "--color-crimson-bright" },
  { name: "Parchemin", token: "--color-parch" },
  { name: "Muet", token: "--color-muted" },
  { name: "Muet 2", token: "--color-muted-2" },
];

const ELEMENTS: Token[] = [
  { name: "Electro", token: "--color-electro" },
  { name: "Pyro", token: "--color-pyro" },
  { name: "Hydro", token: "--color-hydro" },
  { name: "Anemo", token: "--color-anemo" },
  { name: "Lumino", token: "--color-lumino" },
  { name: "Umbro", token: "--color-umbro" },
];

const RARETES: Token[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  name: n === 6 ? `${n} — calamité` : `Rareté ${n}`,
  token: `--color-rarity-${n}`,
}));

/**
 * Applique un thème le temps de la story et inscrit la valeur réelle de chaque
 * token sous sa pastille.
 *
 * L'écriture se fait directement dans le DOM plutôt que par un état React : la
 * valeur ne peut être lue qu'APRÈS que l'attribut a été posé, et repasser par
 * un `setState` dans l'effet déclencherait un rendu en cascade pour rien.
 * L'attribut d'origine est rendu au démontage, sinon ouvrir la palette claire
 * repeindrait tout Storybook.
 */
function Swatches({ items, theme }: { items: Token[]; theme: "dark" | "light" }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const previous = html.dataset.theme;
    html.dataset.theme = theme;

    const styles = getComputedStyle(html);
    for (const node of rootRef.current?.querySelectorAll<HTMLElement>("[data-token]") ?? []) {
      node.textContent = styles.getPropertyValue(node.dataset.token ?? "").trim() || (node.dataset.token ?? "");
    }

    return () => {
      if (previous) html.dataset.theme = previous;
      else delete html.dataset.theme;
    };
  }, [theme, items]);

  return (
    <div ref={rootRef} className="bg-ink p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map(({ name, token }) => (
          <div key={token} className="overflow-hidden rounded-sm border border-line/25 bg-panel">
            <div className="h-16" style={{ background: `var(${token})` }} />
            <div className="px-2.5 py-1.5">
              <div className="font-sans text-[0.8rem] text-parch">{name}</div>
              <div data-token={token} className="font-mono text-[0.68rem] text-muted-2">
                {token}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "DNA/Fondations/Couleurs",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Les composants n'écrivent jamais une couleur en dur : ils passent par ces tokens. Le thème clair ne fait que redéfinir leurs valeurs sous `:root[data-theme=\"light\"]`, ce qui explique qu'aucun composant n'ait eu à changer. Les rôles restent ceux du thème sombre d'origine : `parch` est la couleur du texte, `ink` celle du fond.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Noyau: Story = { render: () => <Swatches items={NOYAU} theme="dark" /> };

/** Mêmes tokens, valeurs du thème clair. */
export const NoyauClair: Story = { render: () => <Swatches items={NOYAU} theme="light" /> };

export const Elements: Story = { render: () => <Swatches items={ELEMENTS} theme="dark" /> };

/** Les teintes d'élément sont assombries en clair : telles quelles, hydro et
 *  anemo tombent sous 2:1 sur l'ivoire. */
export const ElementsClair: Story = { render: () => <Swatches items={ELEMENTS} theme="light" /> };

export const Raretes: Story = { render: () => <Swatches items={RARETES} theme="dark" /> };

export const RaretesClair: Story = { render: () => <Swatches items={RARETES} theme="light" /> };
