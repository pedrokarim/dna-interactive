import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const NOYAU: [string, string][] = [
  ["Ink", "#0a0a0b"],
  ["Panneau", "#141310"],
  ["Or laiton", "#c2a86a"],
  ["Or clair", "#e3cd95"],
  ["Or profond", "#897240"],
  ["Cramoisi", "#8e1813"],
  ["Cramoisi vif", "#b5302a"],
  ["Parchemin", "#ece4d2"],
  ["Muet", "#9a907c"],
];
const ELS: [string, string][] = [
  ["Electro", "#a48ed0"],
  ["Pyro", "#e2664a"],
  ["Hydro", "#5fa8ff"],
  ["Anemo", "#57d6a6"],
  ["Lumino", "#e3cd95"],
  ["Umbro", "#8e84ff"],
];

function Swatches({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {items.map(([name, hex]) => (
        <div key={name} className="overflow-hidden rounded border border-white/6">
          <div className="h-16" style={{ background: hex }} />
          <div className="px-2.5 py-1.5">
            <div className="font-sans text-[0.8rem] text-parch">{name}</div>
            <div className="font-mono text-[0.68rem] text-muted-2">{hex}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const meta = { title: "DNA/Fondations/Couleurs", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Noyau: Story = { render: () => <div className="w-[40rem] max-w-full"><Swatches items={NOYAU} /></div> };
export const Elements: Story = { render: () => <div className="w-[40rem] max-w-full"><Swatches items={ELS} /></div> };
