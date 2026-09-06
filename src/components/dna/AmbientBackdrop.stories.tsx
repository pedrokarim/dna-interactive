import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaAmbientBackdrop } from "./AmbientBackdrop";

const FRAMES = [
  "/assets/wallpapers/twin-eclipse.webp",
  "/assets/wallpapers/gilded-nocturne.webp",
  "/assets/wallpapers/abyss-cartographer.webp",
  "/assets/wallpapers/vermilion-abyss.webp",
  "/assets/wallpapers/astral-snow.webp",
  "/assets/wallpapers/abyssal-carnival.webp",
] as const;

const meta = {
  title: "DNA/Conteneurs/AmbientBackdrop",
  component: DnaAmbientBackdrop,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fond atmosphérique à deux mouvements. Les visuels dérivent dans le temps (Ken Burns, puis fondu enchaîné vers le suivant) : laisser tourner sans rien toucher pour le voir. Les nappes teintées, elles, suivent le défilement — la dominante passe du cramoisi au teal puis à l'or à mesure qu'on descend.",
      },
    },
  },
  args: { frames: FRAMES, intensity: "normal", interval: 11000 },
} satisfies Meta<typeof DnaAmbientBackdrop>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Faux contenu long : sans hauteur à parcourir, les nappes n'ont rien à suivre. */
function ScrollStage() {
  return (
    <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      {["Le Chœur", "Le Reliquaire", "Arsenal", "La Forge", "Atlas d'Atlasia", "Le Registre"].map((title, i) => (
        <section key={title} className="rounded-sm border border-line/25 bg-panel/70 p-8">
          <span className="font-caps text-[0.55rem] uppercase tracking-[0.24em] text-muted">{`0${i + 1}`}</span>
          <h2 className="mt-2 font-display text-3xl text-parch">{title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-parch/75">
            Le visuel se rapproche tout seul, puis passe la main au suivant en fondu : il n’attend pas
            qu’on défile. Ce sont les nappes teintées qui suivent la descente.
          </p>
          <div className="mt-6 h-48 rounded-sm border border-line/15 bg-ink/40" />
        </section>
      ))}
    </div>
  );
}

const renderStage: Story["render"] = (args) => (
  <div className="min-h-screen bg-ink">
    <DnaAmbientBackdrop {...args} />
    <ScrollStage />
  </div>
);

export const Standard: Story = { render: renderStage };

/** Pour les pages denses (listes, tableaux) : le décor s’efface. */
export const Discret: Story = {
  args: { intensity: "subtle" },
  render: renderStage,
};

/** Pour une page vitrine : le décor assume sa présence. */
export const Marque: Story = {
  args: { intensity: "bold" },
  render: renderStage,
};
