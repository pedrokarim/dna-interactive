"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Eye, EyeOff, Map as MapIcon, RefreshCw, Route, Trash2, X } from "lucide-react";
import { useConfirm } from "@/components/dna";
import { getMapLocation } from "@/lib/map/world";
import {
  AdminActions,
  AdminActionsDivider,
  AdminChip,
  AdminEmpty,
  AdminIconButton,
  AdminIconLink,
  AdminIdentity,
  AdminPager,
  AdminPanel,
  AdminStatus,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
  type AdminPagination,
} from "./ui";

type AdminRoute = {
  id: string;
  mapId: string;
  title: string;
  description: string | null;
  visibility: "public" | "private";
  hidden: boolean;
  voteCount: number;
  pointCount: number;
  createdAt: string;
  authorName: string | null;
  openReports: number;
};

type RouteReport = {
  id: string;
  routeId: string;
  reason: string;
  createdAt: string;
  routeTitle: string;
  reporterName: string | null;
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

/**
 * Modération des itinéraires de farm : signalements ouverts en tête, puis tous
 * les itinéraires (les plus signalés d'abord). Masquer retire un itinéraire de
 * la liste publique sans le supprimer ; l'auteur le voit toujours.
 */
export function RoutesAdminClient() {
  const { confirm } = useConfirm();
  const [routes, setRoutes] = useState<AdminRoute[] | null>(null);
  const [reports, setReports] = useState<RouteReport[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [busy, setBusy] = useState<string | null>(null);

  const apply = useCallback((data: { routes: AdminRoute[]; reports: RouteReport[]; pagination: AdminPagination }) => {
    setRoutes(data.routes);
    setReports(data.reports);
    setPagination(data.pagination);
  }, []);

  const load = useCallback(
    async (page = 1) => {
      const r = await fetch(`/api/admin/routes?page=${page}`, { cache: "no-store" });
      if (r.ok) apply(await r.json());
    },
    [apply],
  );

  // Chargement initial : l'état n'est posé qu'à la réponse, jamais dans le corps de l'effet.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/routes?page=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !cancelled) apply(data);
      });
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const patch = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    await fetch("/api/admin/routes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load(pagination.page);
    setBusy(null);
  };

  const remove = async (route: AdminRoute) => {
    const ok = await confirm({
      title: "Supprimer l'itinéraire",
      message: `« ${route.title} » sera supprimé définitivement, avec ses votes et ses signalements.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (ok) await patch(route.id, { routeId: route.id, deleteRoute: true });
  };

  const mapHref = (route: { id: string; mapId?: string }) =>
    `/fr/map?${new URLSearchParams({ ...(route.mapId ? { mapId: route.mapId } : {}), route: route.id })}`;

  return (
    <div className="space-y-4">
      <AdminPanel
        label="Signalements d'itinéraires"
        count={reports.length}
        actions={<AdminIconButton icon={RefreshCw} label="Actualiser" onClick={() => void load(pagination.page)} />}
      >
        {reports.length === 0 ? (
          <AdminEmpty icon={Check} text="Aucun signalement ouvert." />
        ) : (
          <AdminTable minWidth="44rem">
            <thead>
              <tr>
                <AdminTh>Itinéraire</AdminTh>
                <AdminTh>Motif</AdminTh>
                <AdminTh>Date</AdminTh>
                <AdminTh align="right">Actions</AdminTh>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <AdminTr key={report.id}>
                  <AdminTd>
                    <AdminIdentity primary={report.routeTitle} secondary={`par ${report.reporterName ?? "anonyme"}`} />
                  </AdminTd>
                  <AdminTd>{report.reason}</AdminTd>
                  <AdminTd>{dateFormat.format(new Date(report.createdAt))}</AdminTd>
                  <AdminTd align="right">
                    <AdminActions>
                      <AdminIconButton
                        icon={EyeOff}
                        label="Masquer l'itinéraire et clore"
                        busy={busy === report.id}
                        onClick={async () => {
                          await patch(report.id, { routeId: report.routeId, hidden: true, reportId: report.id, reportStatus: "resolved" });
                        }}
                      />
                      <AdminIconButton
                        icon={X}
                        label="Rejeter le signalement"
                        onClick={() => void patch(report.id, { reportId: report.id, reportStatus: "dismissed" })}
                      />
                    </AdminActions>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>

      <AdminPanel label="Itinéraires" count={pagination.total} footer={<AdminPager pagination={pagination} onChange={(p) => void load(p)} />}>
        {routes === null ? (
          <AdminTableSkeleton columns={6} />
        ) : routes.length === 0 ? (
          <AdminEmpty icon={Route} text="Aucun itinéraire publié." />
        ) : (
          <AdminTable minWidth="56rem">
            <thead>
              <tr>
                <AdminTh>Itinéraire</AdminTh>
                <AdminTh>Carte</AdminTh>
                <AdminTh>Étapes</AdminTh>
                <AdminTh>Votes</AdminTh>
                <AdminTh>État</AdminTh>
                <AdminTh align="right">Actions</AdminTh>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <AdminTr key={route.id}>
                  <AdminTd>
                    <AdminIdentity primary={route.title} secondary={`${route.authorName ?? "?"} · ${dateFormat.format(new Date(route.createdAt))}`} />
                  </AdminTd>
                  <AdminTd>
                    <AdminChip>{getMapLocation(route.mapId)?.map.name.fr ?? route.mapId}</AdminChip>
                  </AdminTd>
                  <AdminTd>{route.pointCount}</AdminTd>
                  <AdminTd>{route.voteCount}</AdminTd>
                  <AdminTd>
                    {route.hidden ? (
                      <AdminStatus tone="danger">Masqué</AdminStatus>
                    ) : route.openReports > 0 ? (
                      <AdminStatus tone="warn">{route.openReports} signalement(s)</AdminStatus>
                    ) : route.visibility === "private" ? (
                      <AdminStatus tone="neutral">Privé</AdminStatus>
                    ) : (
                      <AdminStatus tone="ok">Public</AdminStatus>
                    )}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminActions>
                      <AdminIconLink icon={MapIcon} label="Voir sur la carte" href={mapHref(route)} external />
                      <AdminIconButton
                        icon={route.hidden ? Eye : EyeOff}
                        label={route.hidden ? "Rendre visible" : "Masquer"}
                        busy={busy === route.id}
                        onClick={() => void patch(route.id, { routeId: route.id, hidden: !route.hidden })}
                      />
                      <AdminActionsDivider />
                      <AdminIconButton icon={Trash2} label="Supprimer" tone="danger" onClick={() => void remove(route)} />
                    </AdminActions>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  );
}
