import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaCommunityBuildCard } from "./CommunityBuildCard";
import { ELEMENTS } from "./elements";

const meta = {
  title: "DNA/Builder/CommunityBuildCard",
  component: DnaCommunityBuildCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Carte d'un build dans la liste/classement. Tag « Officiel » (nos guides) vs « Communauté », auteur Discord, date, aperçu d'items et vote. Liseré teinté par l'élément.",
      },
    },
  },
} satisfies Meta<typeof DnaCommunityBuildCard>;
export default meta;

type Story = StoryObj<typeof meta>;

const weapons = [{ icon: ELEMENTS.Water.icon, name: "Mitrailleuse" }, { icon: ELEMENTS.Fire.icon, name: "Katana" }];
const genimons = [{ icon: ELEMENTS.Light.icon, name: "Génimon A" }, { icon: ELEMENTS.Thunder.icon, name: "Génimon B" }];

/** Carte communauté interactive (vote). */
export const Communaute: Story = {
  render: function Render() {
    const [voted, setVoted] = useState(false);
    return (
      <div className="w-[34rem]">
        <DnaCommunityBuildCard
          title="Build hyper-crit burst"
          author={{ name: "PedroKarim64", avatar: null }}
          date="12 juin 2026"
          element="Thunder"
          rank={2}
          vote={{ count: 87 + (voted ? 1 : 0), voted }}
          onVote={setVoted}
          weapons={weapons}
          genimons={genimons}
          onOpen={() => {}}
        />
      </div>
    );
  },
};

/** Build officiel (badge dédié). */
export const Officiel: Story = {
  render: () => (
    <div className="w-[34rem]">
      <DnaCommunityBuildCard
        title="Build recommandé"
        author={{ name: "DNA Interactive", avatar: null }}
        date="Officiel"
        element="Light"
        official
        vote={{ count: 540, voted: true }}
        voteReadOnly
        weapons={weapons}
        genimons={genimons}
      />
    </div>
  ),
};

/** Liste/classement (plusieurs cartes). */
export const Classement: Story = {
  render: () => (
    <div className="flex w-[34rem] flex-col gap-2">
      {[
        { t: "Crit burst", el: "Thunder" as const, n: "PedroKarim64", v: 142, r: 1 },
        { t: "Tank survie", el: "Water" as const, n: "Akatsune_San", v: 96, r: 2 },
        { t: "DPS feu full", el: "Fire" as const, n: "VIPA", v: 51, r: 3 },
      ].map((b, i) => (
        <DnaCommunityBuildCard
          key={i}
          title={b.t}
          author={{ name: b.n, avatar: null }}
          date="juin 2026"
          element={b.el}
          rank={b.r}
          vote={{ count: b.v }}
          voteDisabled
          weapons={weapons}
          genimons={genimons}
        />
      ))}
    </div>
  ),
};
