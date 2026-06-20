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

const PORTRAIT = "/assets/characters/gacha/T_Gacha_AvatarLise.png";
const lineup = [
  { avatar: PORTRAIT, name: "Yuming" },
  { avatar: "/assets/characters/gacha/T_Gacha_AvatarKami.png", name: "Camilla" },
  { avatar: "/assets/characters/gacha/T_Gacha_AvatarHeitao.png", name: "Berenica" },
];
const mainWeapon = { icon: ELEMENTS.Thunder.icon, name: "Katana Electro" };

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
          bannerImage={PORTRAIT}
          characterName="Yuming"
          lineup={lineup}
          mainWeapon={mainWeapon}
          tags={["Solo", "Boss"]}
          views={142}
          vote={{ count: 87 + (voted ? 1 : 0), voted }}
          onVote={setVoted}
          onOpen={() => {}}
        />
      </div>
    );
  },
};

export const Grille: Story = {
  render: () => (
    <div className="grid w-[60rem] grid-cols-4 gap-3">
      {[
        { t: "Crit burst", el: "Thunder" as const, n: "PedroKarim64", v: 142, r: 1, views: 320, img: PORTRAIT },
        { t: "Tank survie", el: "Water" as const, n: "Akatsune_San", v: 96, r: 2, views: 88, img: "/assets/characters/gacha/T_Gacha_AvatarHeitao.png" },
        { t: "DPS feu", el: "Fire" as const, n: "VIPA", v: 51, r: 3, views: 40, img: "/assets/characters/gacha/T_Gacha_AvatarKami.png" },
        { t: "Support", el: "Light" as const, n: "synclaire", v: 12, r: 4, views: 9, img: PORTRAIT },
      ].map((b, i) => (
        <DnaCommunityBuildBannerCard
          key={i}
          title={b.t}
          author={{ name: b.n, avatar: null }}
          date="juin 2026"
          element={b.el}
          rank={b.r}
          bannerImage={b.img}
          characterName={b.n}
          lineup={lineup}
          mainWeapon={mainWeapon}
          tags={["Solo"]}
          views={b.views}
          vote={{ count: b.v }}
          voteReadOnly
          onOpen={() => {}}
        />
      ))}
    </div>
  ),
};
