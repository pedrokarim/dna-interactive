import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaCharacterCard } from "./CharacterCard";

const meta = {
  title: "DNA/Cartes/CharacterCard",
  component: DnaCharacterCard,
  tags: ["autodocs"],
  args: {
    name: "Rhythm",
    subtitle: "Appel du Phare",
    element: "Thunder",
    rarity: 5,
    weapons: ["Katana", "Mitrailleuse"],
    portrait: "/assets/characters/gacha/T_Gacha_AvatarLise.png",
  },
} satisfies Meta<typeof DnaCharacterCard>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Carte: Story = { render: (args) => <div className="w-52"><DnaCharacterCard {...args} /></div> };

export const Grille: Story = {
  render: () => (
    <div className="grid w-[44rem] grid-cols-3 gap-4">
      <DnaCharacterCard name="Rhythm" subtitle="Appel du Phare" element="Thunder" weapons={["Katana", "Mitrailleuse"]} portrait="/assets/characters/gacha/T_Gacha_AvatarLise.png" />
      <DnaCharacterCard name="Camilla" subtitle="Cru Écarlate" element="Fire" weapons={["Fouet-épée", "Mitrailleuse"]} portrait="/assets/characters/gacha/T_Gacha_AvatarKami.png" />
      <DnaCharacterCard name="Berenica" subtitle="Espoir Inébranlable" element="Dark" weapons={["Épée", "Arbalète"]} portrait="/assets/characters/gacha/T_Gacha_AvatarHeitao.png" />
    </div>
  ),
};
