import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = { title: "DNA/Fondations/Typographie", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Echelle: Story = {
  render: () => (
    <div className="flex w-[44rem] max-w-full flex-col gap-5">
      <div className="flex items-baseline justify-between gap-6 border-b border-white/6 pb-3">
        <span className="font-display text-4xl font-semibold text-parch">Périple ferroviaire de Luno</span>
        <span className="font-sans text-[0.66rem] tracking-wide text-muted-2">Cormorant · titre</span>
      </div>
      <div className="flex items-baseline justify-between gap-6 border-b border-white/6 pb-3">
        <span className="font-caps text-xl font-semibold tracking-[0.14em] text-gold-bright">ARSENAL · PERSONNAGES</span>
        <span className="font-sans text-[0.66rem] tracking-wide text-muted-2">Cinzel · label</span>
      </div>
      <div className="flex items-baseline justify-between gap-6 border-b border-white/6 pb-3">
        <span className="font-sans text-base text-parch">Au sifflet de Luno, partez à la découverte des merveilles.</span>
        <span className="font-sans text-[0.66rem] tracking-wide text-muted-2">Jost · corps</span>
      </div>
      <div className="flex items-baseline justify-between gap-6">
        <span className="font-display text-xl italic text-muted">« Un sceau ne se porte pas : il se mérite. »</span>
        <span className="font-sans text-[0.66rem] tracking-wide text-muted-2">Cormorant · italique</span>
      </div>
    </div>
  ),
};
