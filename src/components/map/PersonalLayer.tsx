"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAtom, useAtomValue } from "jotai";
import { Marker, useMap, useMapEvents } from "react-leaflet";
import { DivIcon, type Marker as LeafletMarker } from "leaflet";
import {
  PERSONAL_COLORS,
  PERSONAL_MARKERS_MAX,
  editingPersonalAtom,
  personalIconSvg,
  personalMarkersAtom,
  showPersonalMarkersAtom,
  type PersonalColor,
  type PersonalIcon,
  type PersonalMarker,
} from "@/lib/map/personal";

function pinHtml(icon: PersonalIcon, color: PersonalColor, selected: boolean) {
  const hex = PERSONAL_COLORS[color];
  return `<span class="dna-pin is-personal${selected ? " is-selected" : ""}" style="--pin:32px;--pin-color:${hex}">${personalIconSvg(icon, hex, 18)}</span>`;
}

/**
 * Marqueurs personnels sur la carte. En mode pose (`placing`), le prochain
 * clic crée un marqueur et ouvre sa fiche d'édition. L'édition se fait hors
 * de Leaflet (`PersonalEditor`) : une popup Leaflet se refermait en pleine
 * saisie à chaque changement d'icône.
 */
export function PersonalLayer({
  mapId,
  height,
  placing,
  onPlaced,
}: {
  mapId: string;
  height: number;
  placing: boolean;
  onPlaced: () => void;
}) {
  const [markers, setMarkers] = useAtom(personalMarkersAtom);
  const show = useAtomValue(showPersonalMarkersAtom);
  const [editing, setEditing] = useAtom(editingPersonalAtom);
  const leaflet = useMap();

  // Curseur en croix pendant la pose.
  useEffect(() => {
    const el = leaflet.getContainer();
    el.classList.toggle("dna-placing", placing);
    return () => el.classList.remove("dna-placing");
  }, [leaflet, placing]);

  useMapEvents({
    click: (e) => {
      if (!placing) return;
      onPlaced();
      const x = Math.round(e.latlng.lng);
      const y = Math.round(height - e.latlng.lat);
      // Hors de l'image : rien à marquer (et le serveur refuserait la position).
      if (x < 0 || y < 0 || x > height || y > height) return;
      if (markers.length >= PERSONAL_MARKERS_MAX) return;
      const marker: PersonalMarker = {
        id: crypto.randomUUID(),
        mapId,
        x,
        y,
        label: "",
        note: "",
        icon: "star",
        color: "gold",
        createdAt: Date.now(),
      };
      setMarkers((prev) => [...prev, marker]);
      setEditing(marker.id);
    },
  });

  if (!show) return null;

  return (
    <>
      {markers
        .filter((m) => m.mapId === mapId)
        .map((m) => (
          <PersonalPin
            key={m.id}
            marker={m}
            height={height}
            selected={editing === m.id}
            onSelect={() => setEditing(m.id)}
            onMove={(x, y) => setMarkers((prev) => prev.map((p) => (p.id === m.id ? { ...p, x, y } : p)))}
          />
        ))}
    </>
  );
}

function PersonalPin({
  marker,
  height,
  selected,
  onSelect,
  onMove,
}: {
  marker: PersonalMarker;
  height: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const t = useTranslations("map");
  const ref = useRef<LeafletMarker>(null);
  // Icône créée une fois, puis mise à jour en place : remplacer la prop `icon`
  // recrée l'élément et casse un glisser en cours.
  const [icon] = useState(
    () =>
      new DivIcon({
        html: pinHtml(marker.icon, marker.color, selected),
        className: "dna-marker",
        iconSize: [32, 38],
        iconAnchor: [16, 38],
      }),
  );

  useEffect(() => {
    const el = ref.current?.getElement();
    if (el) el.innerHTML = pinHtml(marker.icon, marker.color, selected);
  }, [marker.icon, marker.color, selected]);

  return (
    <Marker
      ref={ref}
      position={[height - marker.y, marker.x]}
      icon={icon}
      title={marker.label || t("personalMarker")}
      draggable
      zIndexOffset={1000}
      eventHandlers={{
        click: onSelect,
        dragend: (e) => {
          const p = (e.target as LeafletMarker).getLatLng();
          const clamp = (v: number) => Math.min(height, Math.max(0, Math.round(v)));
          const x = clamp(p.lng);
          const y = clamp(height - p.lat);
          // Lâché hors de l'image : on le ramène au bord.
          if (x !== Math.round(p.lng) || y !== Math.round(height - p.lat)) (e.target as LeafletMarker).setLatLng([height - y, x]);
          onMove(x, y);
        },
      }}
    />
  );
}
