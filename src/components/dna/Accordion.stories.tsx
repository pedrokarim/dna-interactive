import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaAccordion } from "./Accordion";

const meta = {
  title: "DNA/Conteneurs/Accordion",
  component: DnaAccordion,
  tags: ["autodocs"],
  args: { title: "Durée de l'événement" },
} satisfies Meta<typeof DnaAccordion>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Section: Story = {
  render: (args) => (
    <div className="w-96">
      <DnaAccordion {...args}>
        Du 4 juin au 25 juin · serveurs Europe, Asie et Amériques.
      </DnaAccordion>
      <DnaAccordion title="Conditions d'ouverture" defaultOpen={false}>
        Terminer les missions d'événement à durée limitée « Chroniques du monde ».
      </DnaAccordion>
    </div>
  ),
};
