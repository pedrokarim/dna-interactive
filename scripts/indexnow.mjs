/**
 * Signale les URL du sitemap aux moteurs qui suivent IndexNow (Bing, Yandex,
 * Seznam, Naver…) ; DuckDuckGo et Ecosia s'appuient sur l'index de Bing.
 * Google ne lit pas IndexNow : pour lui, le sitemap déclaré dans la Search
 * Console reste la voie.
 *
 * La clé n'est pas un secret : le protocole exige qu'elle soit servie en
 * clair à la racine du site (`public/<clé>.txt`), c'est ce qui prouve que
 * l'on contrôle le domaine. À lancer APRÈS le déploiement en production, une
 * fois le fichier de clé en ligne :
 *
 *   bun run seo:indexnow           → toutes les URL du sitemap
 *   bun run seo:indexnow -- --dry  → affiche ce qui serait envoyé
 */

const HOST = "dna.ascencia.re";
const KEY = "c582aa6ef72a31eb9f68f4cf723aaee3";
const ENDPOINT = "https://api.indexnow.org/indexnow";
// Plafond du protocole par requête.
const MAX_URLS_PER_REQUEST = 10_000;

const dryRun = process.argv.includes("--dry");

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} : HTTP ${response.status}`);
  return response.text();
}

const keyLocation = `https://${HOST}/${KEY}.txt`;
const servedKey = (await fetchText(keyLocation)).trim();
if (servedKey !== KEY) {
  throw new Error(`${keyLocation} ne sert pas la clé attendue : déploiement pas encore en ligne ?`);
}

const sitemap = await fetchText(`https://${HOST}/sitemap.xml`);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
console.log(`${urls.length} URL dans le sitemap`);

for (let start = 0; start < urls.length; start += MAX_URLS_PER_REQUEST) {
  const urlList = urls.slice(start, start + MAX_URLS_PER_REQUEST);
  if (dryRun) {
    console.log(`[dry] lot de ${urlList.length} URL, ex. ${urlList[0]}`);
    continue;
  }
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation, urlList }),
  });
  // 200 = reçu, 202 = reçu, clé en cours de vérification.
  console.log(`lot de ${urlList.length} URL → HTTP ${response.status} ${await response.text()}`);
}
