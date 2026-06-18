export const CENTER_DEMON_WEDGE_ITEM_IDS = new Set([
  "mods-31203",
  "mods-41214",
  "mods-30101031",
  "mods-41715",
  "mods-41716",
  "mods-41725",
  "mods-41726",
  "mods-41735",
  "mods-41736",
  "mods-41745",
  "mods-41746",
  "mods-41755",
  "mods-41756",
  "mods-41765",
  "mods-41766",
  "mods-51715",
  "mods-51716",
  "mods-51725",
  "mods-51726",
  "mods-51735",
  "mods-51736",
  "mods-51745",
  "mods-51746",
  "mods-51755",
  "mods-51756",
  "mods-51765",
  "mods-51766",
]);

export function isCenterDemonWedgeItemId(itemId: string | null | undefined) {
  return typeof itemId === "string" && CENTER_DEMON_WEDGE_ITEM_IDS.has(itemId);
}
