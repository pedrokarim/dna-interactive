import { defineConfig } from "drizzle-kit";

// Charge .env.local (DATABASE_URL) pour les commandes drizzle-kit (generate/push).
import { config } from "dotenv";
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
