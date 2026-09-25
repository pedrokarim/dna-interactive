"use client";

import { Fragment, useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { CircleMarker, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import { DivIcon, type LatLngTuple } from "leaflet";
import {
  ROUTE_COLORS,
  drawingAtom,
  fitRouteAtom,
  focusedRouteIdAtom,
  routesAtom,
  shownRouteIdsAtom,
} from "@/lib/map/routes";

const arrowCache = new Map<string, DivIcon>();
function arrowIcon(angle: number, color: string): DivIcon {
  const key = `${Math.round(angle)}|${color}`;
  const cached = arrowCache.get(key);
  if (cached) return cached;
  const icon = new DivIcon({
    html: `<span class="dna-route-arrow" style="--a:${angle}deg;--c:${color}"></span>`,
    className: "dna-marker",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  arrowCache.set(key, icon);
  return icon;
}

const endpointCache = new Map<string, DivIcon>();
/** Départ = anneau, arrivée = losange (dessinés en CSS). */
function endpointIcon(kind: "start" | "end", color: string): DivIcon {
  const key = `${kind}|${color}`;
  const cached = endpointCache.get(key);
  if (cached) return cached;
  const icon = new DivIcon({
    html: `<span class="dna-route-end is-${kind}" style="--c:${color}"></span>`,
    className: "dna-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  endpointCache.set(key, icon);
  return icon;
}

/** Itinéraires affichés + tracé en cours. */
export function RouteLayer({ height, leftInset }: { height: number; leftInset: number }) {
  const routes = useAtomValue(routesAtom);
  const fitRoute = useAtomValue(fitRouteAtom);
  const shown = useAtomValue(shownRouteIdsAtom);
  const focused = useAtomValue(focusedRouteIdAtom);
  const [drawing, setDrawing] = useAtom(drawingAtom);
  const [cursor, setCursor] = useState<LatLngTuple | null>(null);
  const leaflet = useMap();
  const toLatLng = ([x, y]: [number, number]): LatLngTuple => [height - y, x];

  // Cadrage sur un itinéraire demandé depuis la liste ou un lien partagé.
  useEffect(() => {
    if (!fitRoute) return;
    const route = routes.find((r) => r.id === fitRoute.id);
    if (!route || route.points.length === 0) return;
    const lats = route.points.map((p) => height - p[1]);
    const lngs = route.points.map((p) => p[0]);
    // Le panneau n'est réservé que si l'écran le permet (même règle que le cadrage initial).
    const inset = leaflet.getSize().x - leftInset >= 320 ? leftInset : 0;
    leaflet.flyToBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      // À droite : le panneau des itinéraires (320 px) et la colonne d'outils, sur grand écran.
      { paddingTopLeft: [inset + 48, 48], paddingBottomRight: [leaflet.getSize().x > 900 ? 400 : 48, 48], maxZoom: 1, duration: 0.6 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seul le nonce déclenche
  }, [fitRoute?.nonce]);

  // En mode tracé, les pastilles deviennent transparentes aux clics (on trace
  // souvent PAR-DESSUS les ressources) et le double-clic ne zoome plus.
  useEffect(() => {
    const el = leaflet.getContainer();
    el.classList.toggle("dna-drawing", drawing !== null);
    if (drawing !== null) leaflet.doubleClickZoom.disable();
    else leaflet.doubleClickZoom.enable();
    return () => el.classList.remove("dna-drawing");
  }, [leaflet, drawing]);

  useMapEvents({
    click: (e) => {
      if (drawing === null) return;
      const x = Math.round(e.latlng.lng);
      const y = Math.round(height - e.latlng.lat);
      if (x < 0 || y < 0 || x > height || y > height) return;
      setDrawing([...drawing, [x, y]]);
    },
    mousemove: (e) => drawing !== null && setCursor([e.latlng.lat, e.latlng.lng]),
    mouseout: () => setCursor(null),
  });

  return (
    <>
      {shown.map((id, index) => {
        const route = routes.find((r) => r.id === id);
        if (!route || route.points.length < 2) return null;
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        const positions = route.points.map(toLatLng);
        const isFocused = focused === id;
        return (
          <Fragment key={id}>
            {/* Liseré sombre sous le tracé : lisible sur les fonds clairs comme sombres. */}
            <Polyline positions={positions} pathOptions={{ color: "#0a0a0b", weight: isFocused ? 9 : 7, opacity: 0.7 }} interactive={false} />
            <Polyline positions={positions} pathOptions={{ color, weight: isFocused ? 5 : 3.5, opacity: 0.95, lineJoin: "round" }} interactive={false} />
            {route.points.slice(1).map((p, i) => {
              const a = route.points[i];
              // Une flèche par segment assez long pour la porter.
              if (Math.hypot(p[0] - a[0], p[1] - a[1]) < 90) return null;
              const angle = (Math.atan2(p[1] - a[1], p[0] - a[0]) * 180) / Math.PI;
              return (
                <Marker
                  key={i}
                  position={toLatLng([(a[0] + p[0]) / 2, (a[1] + p[1]) / 2])}
                  icon={arrowIcon(angle, color)}
                  interactive={false}
                  keyboard={false}
                />
              );
            })}
            <Marker position={positions[0]} icon={endpointIcon("start", color)} interactive={false} keyboard={false} zIndexOffset={900} />
            <Marker position={positions.at(-1)!} icon={endpointIcon("end", color)} interactive={false} keyboard={false} zIndexOffset={900} />
          </Fragment>
        );
      })}

      {drawing && drawing.length > 0 && (
        <>
          <Polyline positions={drawing.map(toLatLng)} pathOptions={{ color: "#e3cd95", weight: 3.5, opacity: 0.95 }} interactive={false} />
          {cursor && (
            <Polyline
              positions={[toLatLng(drawing.at(-1)!), cursor]}
              pathOptions={{ color: "#e3cd95", weight: 2, opacity: 0.7, dashArray: "6 6" }}
              interactive={false}
            />
          )}
          {drawing.map((p, i) => (
            <CircleMarker
              key={i}
              center={toLatLng(p)}
              radius={i === 0 ? 6 : 4}
              pathOptions={{ color: "#0a0a0b", weight: 1.5, fillColor: "#e3cd95", fillOpacity: 1 }}
              interactive={false}
            />
          ))}
        </>
      )}
    </>
  );
}
