#!/usr/bin/env bash
#
# Plan B quand GitHub Actions ne construit pas l'image : la construire sur le
# serveur lui-même, avec les mêmes entrées que .github/workflows/deploy.yml.
#
# À poser à côté de compose.prod.yml et du .env de production, puis :
#
#   ./build-on-server.sh <sha>          # construit l'image <sha> en local
#   ./build-on-server.sh <sha> --up     # … et bascule le conteneur dessus
#
# Ce que fait le script :
# - clone le dépôt public au commit demandé, dans un dossier temporaire
#   supprimé à la fin ;
# - lit les NEXT_PUBLIC_* et DATABASE_URL dans le .env voisin (rien n'est
#   passé en argument ni affiché) ;
# - passe DATABASE_URL en secret BuildKit, par un fichier en 600 effacé à la
#   sortie : il n'entre dans aucune couche de l'image ;
# - étiquette l'image `ghcr.io/pedrokarim/dna-interactive:<sha>`, sans la
#   pousser sur GHCR.
#
# Pour démarrer l'image ainsi construite, NE PAS utiliser deploy.sh : il tire
# l'image depuis GHCR et remplacerait la version locale. Utiliser `--up`, ou :
#
#   DNA_TAG=<sha> docker compose -f compose.prod.yml up -d dna
#
# Le build lit la base (pages pré-rendues) : il doit tourner sur une machine
# qui la joint. Compter une dizaine de minutes et ~2 Go de mémoire.

set -euo pipefail

SHA="${1:?usage : $0 <sha complet> [--up]}"
UP="${2:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${DNA_ENV_FILE:-$HERE/.env}"
COMPOSE_FILE="${DNA_COMPOSE_FILE:-$HERE/compose.prod.yml}"
REPO="https://github.com/pedrokarim/dna-interactive.git"
IMAGE="ghcr.io/pedrokarim/dna-interactive"

[ -r "$ENV_FILE" ] || { echo "✗ .env introuvable : $ENV_FILE" >&2; exit 1; }

# Valeur d'une clé du .env (format `CLE=valeur`, sans guillemets).
get() { grep -m1 "^$1=" "$ENV_FILE" | cut -d= -f2-; }

WORK="$(mktemp -d)"
SECRET="$(mktemp)"
chmod 600 "$SECRET"
trap 'rm -rf "$WORK" "$SECRET"' EXIT

git clone -q "$REPO" "$WORK/src"
git -C "$WORK/src" checkout -q "$SHA"
echo "→ source : $(git -C "$WORK/src" log -1 --format='%h %s')"

get DATABASE_URL > "$SECRET"
[ -s "$SECRET" ] || { echo "✗ DATABASE_URL absente du .env" >&2; exit 1; }

echo "→ build (démarré à $(date +%H:%M:%S))"
docker buildx build \
  --load \
  --secret id=database_url,src="$SECRET" \
  --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY="$(get NEXT_PUBLIC_RECAPTCHA_SITE_KEY)" \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$(get NEXT_PUBLIC_VAPID_PUBLIC_KEY)" \
  --build-arg NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN="$(get NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN)" \
  --build-arg NEXT_PUBLIC_SARUTOBI_HOST="$(get NEXT_PUBLIC_SARUTOBI_HOST)" \
  --build-arg NEXT_PUBLIC_SARUTOBI_DEBUG="$(get NEXT_PUBLIC_SARUTOBI_DEBUG)" \
  --build-arg NEXT_PUBLIC_SARUTOBI_ENABLE_LOCAL="$(get NEXT_PUBLIC_SARUTOBI_ENABLE_LOCAL)" \
  -t "$IMAGE:$SHA" \
  --progress=plain \
  "$WORK/src"
echo "✓ image $IMAGE:$SHA construite ($(date +%H:%M:%S))"

[ "$UP" = "--up" ] || exit 0

echo "→ bascule du conteneur"
DNA_TAG="$SHA" docker compose -f "$COMPOSE_FILE" up -d dna
for _ in $(seq 1 30); do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$(DNA_TAG="$SHA" docker compose -f "$COMPOSE_FILE" ps -q dna)")"
  if [ "$status" = "healthy" ]; then
    echo "✓ en ligne sur $SHA"
    exit 0
  fi
  sleep 5
done
echo "✗ le conteneur n'est pas passé au vert en 150 s" >&2
DNA_TAG="$SHA" docker compose -f "$COMPOSE_FILE" logs --tail 60 dna >&2
exit 1
