import { ImageResponse } from "next/og";
import { getItemByCategoryAndId, getItemCategoryBySlug, getItemTranslation } from "@/lib/items/catalog";
import { loadOgFonts, OG_SIZE, OG_CONTENT_TYPE } from "@/app/_og/fonts";
import {
  OgRoot,
  Eyebrow,
  Title,
  RarityRow,
  rarityHex,
  FALLBACK_HEX,
  INK,
  resolveOrigin,
  truncate,
} from "@/app/_og/shared";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Item — DNA Interactive";

export default async function ItemOgImage({
  params,
}: {
  params: Promise<{ locale: string; category: string; itemId: string }>;
}) {
  const { category: categorySlug, itemId } = await params;
  const [fonts, origin] = await Promise.all([loadOgFonts(), resolveOrigin()]);

  const category = getItemCategoryBySlug(categorySlug);
  const item = category ? getItemByCategoryAndId(category.id, itemId) : null;
  const localized =
    item && category
      ? getItemTranslation(item, category.defaultDetailLanguage, category.availableLanguages)
      : null;

  const hex = rarityHex(item?.stats.rarity) ?? FALLBACK_HEX;
  const name = localized?.modName ?? (item && category ? `${category.displayName} #${item.modId}` : "Item introuvable");
  const title = truncate(name, 42);
  const iconPath = item?.icon.publicPath ?? null;
  const techLabel = category && item ? `${category.technicalName} #${item.modId}` : null;

  return new ImageResponse(
    (
      <OgRoot hex={hex} origin={origin}>
        {/* Médaillon d'icône à droite */}
        {iconPath ? (
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 480, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 320,
                height: 320,
                borderRadius: 36,
                background: `linear-gradient(145deg, ${hex}33, ${INK})`,
                border: `2px solid ${hex}66`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${origin}${iconPath}`} width={240} height={240} alt="" style={{ width: 240, height: 240, objectFit: "contain" }} />
            </div>
          </div>
        ) : null}

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: 720,
            height: "100%",
          }}
        >
          <Eyebrow hex={hex} label={category?.displayName ?? "Item"} />
          <Title text={title} hex={hex} size={title.length > 26 ? 66 : 78} />
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 26, color: "#cfc7d6" }}>
            <RarityRow rarity={item?.stats.rarity} hex={hex} />
            {techLabel ? <div style={{ display: "flex", color: "#8a8395" }}>{techLabel}</div> : null}
          </div>
        </div>
      </OgRoot>
    ),
    { ...OG_SIZE, fonts },
  );
}
