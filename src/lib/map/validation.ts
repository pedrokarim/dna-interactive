/**
 * Validation serveur des données de la carte envoyées par le client.
 *
 * Même règle que les builds : **sets fermés**, rien de libre hors des textes
 * saisis. Une clé de point doit exister dans l'index, une carte dans la
 * hiérarchie du monde, un type dans la taxonomie ; les coordonnées restent dans
 * l'image (toutes les cartes font 4096 × 4096).
 */

import { z } from "zod";
import progressIndex from "@/data/maps/progress-index.json";
import { PERSONAL_COLORS, PERSONAL_ICONS, PERSONAL_MARKERS_MAX } from "./personal";
import { CANONICAL_TYPES } from "./taxonomy";
import { getMapLocation } from "./world";

const MAP_SIZE = 4096;
const TRACKED_KEYS = new Set(
  Object.values(progressIndex as Record<string, Record<string, string[]>>).flatMap((m) => Object.values(m).flat()),
);
const TYPE_IDS = new Set(CANONICAL_TYPES.map((t) => t.id));

const mapIdSchema = z.string().refine((id) => Boolean(getMapLocation(id)), "unknown map");
const coordSchema = z.number().int().min(0).max(MAP_SIZE);

/**
 * Clés trouvées : on écarte en silence celles qui ne sont plus suivies (types
 * devenus « non comptés », points retirés par boarhat) plutôt que de rejeter
 * toute la synchronisation pour une clé périmée.
 */
export const foundKeysSchema = z
  .array(z.string().max(160))
  .max(TRACKED_KEYS.size + 500)
  .transform((keys) => [...new Set(keys.filter((k) => TRACKED_KEYS.has(k)))]);

export const personalMarkerSchema = z.object({
  id: z.string().uuid(),
  mapId: mapIdSchema,
  x: coordSchema,
  y: coordSchema,
  label: z.string().trim().max(60),
  note: z.string().trim().max(280),
  icon: z.enum(Object.keys(PERSONAL_ICONS) as [keyof typeof PERSONAL_ICONS, ...(keyof typeof PERSONAL_ICONS)[]]),
  color: z.enum(Object.keys(PERSONAL_COLORS) as [keyof typeof PERSONAL_COLORS, ...(keyof typeof PERSONAL_COLORS)[]]),
  createdAt: z.number().int().nonnegative(),
});

/**
 * Un marqueur personnel invalide (vieux format, position hors carte) est
 * écarté seul : il ne doit pas bloquer la synchronisation des points trouvés.
 */
export const progressPayloadSchema = z.object({
  foundKeys: foundKeysSchema,
  personalMarkers: z
    .array(z.unknown())
    .max(PERSONAL_MARKERS_MAX)
    .transform((list) =>
      list.flatMap((item) => {
        const parsed = personalMarkerSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    ),
});

export const ROUTE_POINTS_MAX = 400;
export const ROUTES_PER_USER_MAX = 50;

export const routeInputSchema = z.object({
  mapId: mapIdSchema,
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500).optional().default(""),
  points: z.array(z.tuple([coordSchema, coordSchema])).min(2).max(ROUTE_POINTS_MAX),
  typeIds: z
    .array(z.string().refine((id) => TYPE_IDS.has(id), "unknown type"))
    .max(10)
    .transform((ids) => [...new Set(ids)]),
  visibility: z.enum(["public", "private"]).default("public"),
});

export type RouteInput = z.infer<typeof routeInputSchema>;
