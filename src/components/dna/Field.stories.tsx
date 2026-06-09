import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaField } from "./Field";

const meta = {
  title: "DNA/Contrôles/Field",
  component: DnaField,
  tags: ["autodocs"],
  args: { placeholder: "Rechercher…" },
} satisfies Meta<typeof DnaField>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Recherche: Story = { args: { placeholder: "Rechercher un personnage…" } };
