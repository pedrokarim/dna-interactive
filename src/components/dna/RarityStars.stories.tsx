import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaStars } from "./RarityStars";

const meta = {
  title: "DNA/Affichage/RarityStars",
  component: DnaStars,
  tags: ["autodocs"],
  args: { value: 5, max: 5 },
} satisfies Meta<typeof DnaStars>;
export default meta;

type Story = StoryObj<typeof meta>;

export const FiveStars: Story = { name: "Cinq étoiles", args: { value: 5 } };
export const Scale: Story = { name: "Échelle",
  render: () => (
    <div className="flex flex-col gap-1">
      {[5, 4, 3].map((n) => (
        <DnaStars key={n} value={n} />
      ))}
    </div>
  ),
};
