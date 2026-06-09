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

export const Primaire: Story = { args: { variant: "gold", children: "Voir l'événement" } };
export const Secondaire: Story = { args: { variant: "ghost", children: "Conditions" } };
export const Paire: Story = {
  render: () => (
    <>
      <DnaButton variant="gold">Équiper le module</DnaButton>
      <DnaButton variant="ghost">Analyser</DnaButton>
    </>
  ),
};
export const Desactive: Story = { args: { variant: "gold", children: "Indisponible", disabled: true } };
