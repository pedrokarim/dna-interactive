import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaCommunityBuildBannerCard } from "./CommunityBuildBannerCard";
import { ELEMENTS } from "./elements";

const meta = {
  title: "DNA/Builder/CommunityBuildBannerCard",
  component: DnaCommunityBuildBannerCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof DnaCommunityBuildBannerCard>;
export default meta;

type Story = StoryObj<typeof meta>;

const weapons = [{ icon: ELEMENTS.Water.icon, name: "Mitrailleuse" }, { icon: ELEMENTS.Fire.icon, name: "Katana" }];
const genimons = [{ icon: ELEMENTS.Light.icon, name: "Génimon A" }];

export const Carte: Story = {
  render: function Render() {
    const [voted, setVoted] = useState(false);
    return (
      <div className="w-80">
        <DnaCommunityBuildBannerCard
          title="Build hyper-crit burst"
          author={{ name: "PedroKarim64", avatar: null }}
          date="20 juin 2026"
          element="Thunder"
          rank={1}
          bannerImage="/assets/characters/gacha/T_Gacha_AvatarLise.png"
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

export const Grille: Story = {
  render: () => (
    <div className="grid w-[52rem] grid-cols-3 gap-3">
      {[
        { t: "Crit burst", el: "Thunder" as const, n: "PedroKarim64", v: 142, r: 1, img: "/assets/characters/gacha/T_Gacha_AvatarLise.png" },
        { t: "Tank survie", el: "Water" as const, n: "Akatsune_San", v: 96, r: 2, img: "/assets/characters/gacha/T_Gacha_AvatarHeitao.png" },
        { t: "DPS feu", el: "Fire" as const, n: "VIPA", v: 51, r: 3, img: "/assets/characters/gacha/T_Gacha_AvatarKami.png" },
      ].map((b, i) => (
        <DnaCommunityBuildBannerCard
          key={i}
          title={b.t}
          author={{ name: b.n, avatar: null }}
          date="juin 2026"
          element={b.el}
          rank={b.r}
          bannerImage={b.img}
          vote={{ count: b.v }}
          voteReadOnly
          weapons={weapons}
          genimons={genimons}
          onOpen={() => {}}
        />
      ))}
    </div>
  ),
};

export const SansBanniere: Story = {
  render: () => (
    <div className="w-80">
      <DnaCommunityBuildBannerCard
        title="Build sans portrait"
        author={{ name: "Anon", avatar: null }}
        element="Dark"
        vote={{ count: 3 }}
        voteReadOnly
        weapons={weapons}
      />
    </div>
  ),
};
