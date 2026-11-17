import { notFound } from "next/navigation";

// Attrape-tout : sans lui, une adresse inconnue (`/en/page-inexistante`) tombe
// sur la 404 brute de Next, hors du site. notFound() dans le segment [locale]
// affiche notre 404. Les autres routes passent toujours avant celle-ci.
export default function CatchAllNotFound() {
  notFound();
}
