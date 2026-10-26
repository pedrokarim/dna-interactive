import { notFound } from "next/navigation";

// Attrape-tout : sans lui, une adresse qui ne correspond à aucune route
// (`/en/page-inexistante`) tombe sur la 404 brute de Next, hors du site. En
// appelant `notFound()` dans le segment `[locale]`, on obtient sa 404 à nous.
// Les routes statiques et dynamiques passent toujours avant un attrape-tout.
export default function CatchAllNotFound() {
  notFound();
}
