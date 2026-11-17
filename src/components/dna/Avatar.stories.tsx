import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaAvatar } from "./Avatar";

const meta = {
  title: "DNA/Affichage/Avatar",
  component: DnaAvatar,
  tags: ["autodocs"],
  args: { src: "/assets/characters/head/T_Head_Lise.png", alt: "Rhythm", size: 60 },
} satisfies Meta<typeof DnaAvatar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Bevel: Story = { name: "Biseau", args: { round: false } };
export const Circle: Story = { name: "Rond", args: { round: true, src: "/assets/characters/head/T_Head_Kami.png", alt: "Camilla" } };
export const Fallback: Story = { name: "Repli", args: { src: null, fallback: "A" } };
