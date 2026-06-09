import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaSectionLabel } from "./SectionLabel";

const meta = {
  title: "DNA/Ornements/SectionLabel",
  component: DnaSectionLabel,
  tags: ["autodocs"],
  args: { children: "Annonces d'événements" },
} satisfies Meta<typeof DnaSectionLabel>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Label: Story = { render: (args) => <div className="w-80"><DnaSectionLabel {...args} /></div> };
