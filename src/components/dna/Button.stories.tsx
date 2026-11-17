import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaButton } from "./Button";

const meta = {
  title: "DNA/Contrôles/Button",
  component: DnaButton,
  tags: ["autodocs"],
  args: { children: "Voir l'événement", variant: "gold" },
  argTypes: { variant: { control: "inline-radio", options: ["gold", "ghost"] } },
} satisfies Meta<typeof DnaButton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = { name: "Primaire", args: { variant: "gold", children: "Voir l'événement" } };
export const Secondary: Story = { name: "Secondaire", args: { variant: "ghost", children: "Conditions" } };
export const Pair: Story = { name: "Paire",
  render: () => (
    <>
      <DnaButton variant="gold">Équiper le module</DnaButton>
      <DnaButton variant="ghost">Analyser</DnaButton>
    </>
  ),
};
export const Disabled: Story = { name: "Désactivé", args: { variant: "gold", children: "Indisponible", disabled: true } };
