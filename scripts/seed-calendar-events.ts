/**
 * Seed / upsert du calendrier des événements dans la BDD (`calendar_events`).
 *
 * Source = la liste curée `CALENDAR_EVENTS` (src/lib/events/calendar.ts).
 * Idempotent : clé naturelle (titre + date de début) → met à jour l'existant,
 * insère le nouveau, ne touche pas aux événements ajoutés à la main via l'admin.
 * Relançable à chaque cycle après avoir rafraîchi la liste curée.
 *
 *   bun run scripts/seed-calendar-events.ts      (ou : bun run seed:calendar)
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { CALENDAR_EVENTS } from "@/lib/events/calendar";

const naturalKey = (title: string, start: string) => `${title}__${start}`;

async function main() {
  const db = getDb();

  const existing = await db
    .select({ id: schema.calendarEvents.id, title: schema.calendarEvents.title, startDate: schema.calendarEvents.startDate })
    .from(schema.calendarEvents);
  const idByKey = new Map(existing.map((e) => [naturalKey(e.title, e.startDate), e.id] as const));

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < CALENDAR_EVENTS.length; i += 1) {
    const ev = CALENDAR_EVENTS[i];
    const values = {
      title: ev.title,
      category: ev.category,
      startDate: ev.start,
      endDate: ev.end,
      image: ev.image ?? null,
      href: ev.href ?? null,
      description: ev.description ?? null,
      sourceUrl: ev.sourceUrl ?? null,
      sortOrder: i,
      updatedAt: new Date(),
    };
    const id = idByKey.get(naturalKey(ev.title, ev.start));
    if (id) {
      // Pas de lien officiel dans la liste curée → on ne remet pas `null` par-dessus
      // celui qu'un admin aurait saisi via /admin/calendar.
      const patch = ev.sourceUrl ? values : (({ sourceUrl: _drop, ...rest }) => rest)(values);
      await db.update(schema.calendarEvents).set(patch).where(eq(schema.calendarEvents.id, id));
      updated += 1;
    } else {
      await db.insert(schema.calendarEvents).values(values);
      inserted += 1;
    }
  }

  console.log(`Calendrier: ${inserted} ajouté(s), ${updated} mis à jour, ${CALENDAR_EVENTS.length} au total.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed calendrier échoué:", error);
    process.exit(1);
  });
