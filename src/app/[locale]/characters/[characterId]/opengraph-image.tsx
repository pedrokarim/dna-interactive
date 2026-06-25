import { ImageResponse } from "next/og";
import { getCharacterById, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { loadOgFonts, OG_SIZE, OG_CONTENT_TYPE } from "@/app/_og/fonts";
import {
  OgRoot,
  PortraitBleed,
  Eyebrow,
  Title,
  RarityRow,
  getElement,
  resolveOrigin,
  truncate,
} from "@/app/_og/shared";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Personnage — DNA Interactive";

export default async function CharacterOgImage({
  params,
}: {
  params: Promise<{ locale: string; characterId: string }>;
}) {
  const { locale, characterId } = await params;
  const [fonts, origin] = await Promise.all([loadOgFonts(), resolveOrigin()]);
  const character = getCharacterById(characterId);

  const element = getElement(character?.element.key);
  const name = character ? resolveCharacterDisplayName(character, locale) : "Personnage introuvable";
  const title = truncate(name, 40);
  const portraitPath =
    character?.portraits.bust?.publicPath ??
    character?.portraits.charpiece?.publicPath ??
    character?.portraits.gacha?.publicPath ??
    null;
  const weapons = character?.weaponTags?.slice(0, 2).join(" / ") ?? null;

  return new ImageResponse(
    (
      <OgRoot hex={element.hex} origin={origin}>
        {portraitPath ? <PortraitBleed url={`${origin}${portraitPath}`} /> : null}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: 760,
            height: "100%",
          }}
        >
          <Eyebrow hex={element.hex} iconUrl={element.icon ? `${origin}${element.icon}` : null} label={element.label ?? "Personnage"} />
          <Title text={title} hex={element.hex} size={title.length > 24 ? 72 : 84} />
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 26, color: "#cfc7d6" }}>
            <RarityRow rarity={character?.rarity} hex={element.hex} />
            {weapons ? <div style={{ display: "flex", color: "#9b94a8" }}>{weapons}</div> : null}
          </div>
        </div>
      </OgRoot>
    ),
    { ...OG_SIZE, fonts },
  );
}
