import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaTile } from "./Tile";

const Star = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
    <path d="M12 2 L15 9 L22 9 L16 14 L18 21 L12 17 L6 21 L8 14 L2 9 L9 9 Z" />
  </svg>
);
const Person = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
    <circle cx="12" cy="8" r="4" />
    <path d="M5 21 C5 16 8 14 12 14 C16 14 19 16 19 21" />
  </svg>
);

const meta = {
  title: "DNA/Conteneurs/Tile",
  component: DnaTile,
  tags: ["autodocs"],
  args: { label: "Événements", icon: Star, ghost: "Heuris", nouveau: true },
} satisfies Meta<typeof DnaTile>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = { render: (args) => <div className="w-36"><DnaTile {...args} /></div> };
export const Large: Story = {
  args: { label: "Arsenal", icon: Person, wide: true, nouveau: false, ghost: undefined },
  render: (args) => <div className="w-56"><DnaTile {...args} /></div>,
};
