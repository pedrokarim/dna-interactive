import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaPill } from "./Pill";

const meta = {
  title: "DNA/Affichage/Pill",
  component: DnaPill,
  tags: ["autodocs"],
  args: { children: "03·06" },
} satisfies Meta<typeof DnaPill>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Date_: Story = { name: "Date", args: { children: "03·06" } };
export const Valeur: Story = { args: { children: "Lv.20" } };
