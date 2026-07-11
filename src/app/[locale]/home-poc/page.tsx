import type { Metadata } from "next";
import HomePocClient from "./HomePocClient";

export const metadata: Metadata = {
  title: "Home POC — DNA Interactive",
  description: "Proof of concept d'une nouvelle page d'accueil « hub » pour DNA Interactive.",
  robots: { index: false, follow: false },
};

/** Proof of concept — nouvelle home façon « hub / dashboard ». Route jetable. */
export default function HomePocPage() {
  return <HomePocClient />;
}
