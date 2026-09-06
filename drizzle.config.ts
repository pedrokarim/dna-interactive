import { defineConfig } from "drizzle-kit";

// Charge DATABASE_URL pour les commandes drizzle-kit (generate/push).
//
// Même ordre de priorité que Next : `.env.development.local` d'abord (base de
// développement locale), `.env.local` ensuite. `dotenv` n'écrase jamais une
// variable déjà définie, donc le premier fichier chargé gagne — et une variable
// posée dans le shell l'emporte sur les deux.
import { config } from "dotenv";
config({ path: ".env.development.local" });
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
