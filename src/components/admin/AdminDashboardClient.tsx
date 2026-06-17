"use client";

import { useCallback, useEffect, useState } from "react";
import { DnaButton } from "@/components/dna/Button";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaTag } from "@/components/dna/Tag";

const ADMIN_PAGE_SIZE = 12;

type AdminPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AdminBuild = {
  id: string;
  title: string;
  characterId: string;
  element: string | null;
  voteCount: number;
  hidden: boolean;
  updatedAt: string;
  authorId: string;
  authorName: string | null;
  authorBanned: boolean;
};

type AdminReport = {
  id: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  buildId: string;
  buildTitle: string;
  reporterName: string | null;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  discordId: string | null;
  role: "user" | "admin";
  configuredAdmin: boolean;
  banned: boolean;
  createdAt: string;
};

const EMPTY_PAGINATION: AdminPagination = {
  page: 1,
  pageSize: ADMIN_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export function AdminDashboardClient() {
  const [builds, setBuilds] = useState<AdminBuild[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [buildPage, setBuildPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [buildPagination, setBuildPagination] = useState<AdminPagination>(EMPTY_PAGINATION);
  const [reportPagination, setReportPagination] = useState<AdminPagination>(EMPTY_PAGINATION);
  const [userPagination, setUserPagination] = useState<AdminPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const buildParams = new URLSearchParams({
      buildPage: `${buildPage}`,
      buildPageSize: `${ADMIN_PAGE_SIZE}`,
      reportPage: `${reportPage}`,
      reportPageSize: `${ADMIN_PAGE_SIZE}`,
    });
    const userParams = new URLSearchParams({
      page: `${userPage}`,
      pageSize: `${ADMIN_PAGE_SIZE}`,
    });

    const [buildsResponse, usersResponse] = await Promise.all([
      fetch(`/api/admin/builds?${buildParams.toString()}`),
      fetch(`/api/admin/users?${userParams.toString()}`),
    ]);

    if (!buildsResponse.ok || !usersResponse.ok) {
      setMessage("Chargement admin impossible.");
      setLoading(false);
      return;
    }

    const [buildsData, usersData] = await Promise.all([buildsResponse.json(), usersResponse.json()]);
    setBuilds(buildsData.builds ?? []);
    setReports(buildsData.reports ?? []);
    setUsers(usersData.users ?? []);
    setBuildPagination(buildsData.pagination?.builds ?? EMPTY_PAGINATION);
    setReportPagination(buildsData.pagination?.reports ?? EMPTY_PAGINATION);
    setUserPagination(usersData.pagination ?? EMPTY_PAGINATION);
    setLoading(false);
    setMessage(null);
  }, [buildPage, reportPage, userPage]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);

  async function patchBuild(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/builds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(response.ok ? "Action appliquée." : "Action refusée.");
    await load();
  }

  async function patchUser(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(response.ok ? "Utilisateur mis à jour." : "Action refusée.");
    await load();
  }

  if (loading) {
    return <DnaPanel className="p-5 text-sm text-muted">Chargement...</DnaPanel>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <DnaPanel className="p-4 xl:col-span-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <DnaSectionLabel>Synthèse</DnaSectionLabel>
          {message ? <span className="font-sans text-xs text-gold">{message}</span> : null}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <AdminMetric label="Builds" value={buildPagination.total} />
          <AdminMetric label="Signalements" value={reportPagination.total} />
          <AdminMetric label="Utilisateurs" value={userPagination.total} />
        </div>
      </DnaPanel>

      <div className="flex flex-col gap-4">
        <DnaPanel className="p-4">
          <DnaSectionLabel>Signalements</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            {reports.length === 0 ? (
              <p className="font-sans text-sm text-muted">Aucun signalement.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="border border-white/10 bg-ink/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-sans text-sm text-parch">{report.buildTitle}</p>
                    <DnaTag tone={report.status === "open" ? "crimson" : "gold"}>{report.status}</DnaTag>
                  </div>
                  <p className="mt-2 font-sans text-sm text-muted">{report.reason}</p>
                  <p className="mt-1 font-sans text-xs text-muted-2">Par {report.reporterName ?? "Discord"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DnaButton className="px-3 py-1.5 text-xs" onClick={() => void patchBuild({ buildId: report.buildId, hidden: true })}>
                      Masquer build
                    </DnaButton>
                    <DnaButton className="px-3 py-1.5 text-xs" onClick={() => void patchBuild({ reportId: report.id, reportStatus: "resolved" })}>
                      Résoudre
                    </DnaButton>
                    <DnaButton className="px-3 py-1.5 text-xs" onClick={() => void patchBuild({ reportId: report.id, reportStatus: "dismissed" })}>
                      Rejeter
                    </DnaButton>
                  </div>
                </div>
              ))
            )}
          </div>
          <AdminPager pagination={reportPagination} onChange={setReportPage} />
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>Builds</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            {builds.length === 0 ? (
              <p className="font-sans text-sm text-muted">Aucun build.</p>
            ) : (
              builds.map((build) => (
                <div key={build.id} className="border border-white/10 bg-ink/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-sans text-sm text-parch">{build.title}</p>
                    <DnaTag tone={build.hidden ? "crimson" : "gold"}>{build.hidden ? "Masqué" : "Visible"}</DnaTag>
                  </div>
                  <p className="mt-1 font-sans text-xs text-muted">
                    {build.characterId} {build.element ? `(${build.element})` : ""} · {build.voteCount} votes · {build.authorName ?? "Discord"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DnaButton className="px-3 py-1.5 text-xs" onClick={() => void patchBuild({ buildId: build.id, hidden: !build.hidden })}>
                      {build.hidden ? "Rendre visible" : "Masquer"}
                    </DnaButton>
                    <DnaButton className="px-3 py-1.5 text-xs" onClick={() => void patchBuild({ buildId: build.id, deleteBuild: true })}>
                      Supprimer
                    </DnaButton>
                    <DnaButton className="px-3 py-1.5 text-xs" onClick={() => void patchUser({ userId: build.authorId, banned: !build.authorBanned })}>
                      {build.authorBanned ? "Débannir auteur" : "Bannir auteur"}
                    </DnaButton>
                  </div>
                </div>
              ))
            )}
          </div>
          <AdminPager pagination={buildPagination} onChange={setBuildPage} />
        </DnaPanel>
      </div>

      <DnaPanel className="p-4">
        <DnaSectionLabel>Utilisateurs</DnaSectionLabel>
        <div className="mt-3 flex flex-col gap-2">
          {users.length === 0 ? (
            <p className="font-sans text-sm text-muted">Aucun utilisateur.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="border border-white/10 bg-ink/50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 truncate font-sans text-sm text-parch">{user.name ?? user.email ?? user.id}</p>
                  <DnaTag tone={user.role === "admin" ? "gold" : "crimson"}>{user.role}</DnaTag>
                  {user.configuredAdmin ? <DnaTag tone="gold">Env</DnaTag> : null}
                  {user.banned ? <DnaTag tone="crimson">Banni</DnaTag> : null}
                </div>
                <p className="mt-1 font-sans text-xs text-muted-2">{user.discordId ?? "discord id inconnu"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DnaButton
                    className="px-3 py-1.5 text-xs"
                    disabled={user.configuredAdmin && !user.banned}
                    onClick={() => void patchUser({ userId: user.id, banned: !user.banned })}
                  >
                    {user.banned ? "Débannir" : "Bannir"}
                  </DnaButton>
                  <DnaButton
                    className="px-3 py-1.5 text-xs"
                    disabled={user.configuredAdmin && user.role === "admin"}
                    onClick={() => void patchUser({ userId: user.id, role: user.role === "admin" ? "user" : "admin" })}
                  >
                    {user.role === "admin" ? "Rétrograder" : "Promouvoir"}
                  </DnaButton>
                </div>
              </div>
            ))
          )}
        </div>
        <AdminPager pagination={userPagination} onChange={setUserPage} />
      </DnaPanel>
    </div>
  );
}

function AdminMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 bg-ink/50 p-3">
      <p className="font-caps text-[0.58rem] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl leading-none text-gold-bright">{value}</p>
    </div>
  );
}

function AdminPager({
  pagination,
  onChange,
}: {
  pagination: AdminPagination;
  onChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-sans text-xs text-muted">
        Page {pagination.page}/{pagination.totalPages} · {pagination.total} éléments
      </p>
      <div className="flex items-center gap-2">
        <DnaButton
          className="px-3 py-1.5 text-xs"
          disabled={pagination.page <= 1}
          onClick={() => onChange(Math.max(1, pagination.page - 1))}
        >
          Précédent
        </DnaButton>
        <DnaButton
          className="px-3 py-1.5 text-xs"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onChange(Math.min(pagination.totalPages, pagination.page + 1))}
        >
          Suivant
        </DnaButton>
      </div>
    </div>
  );
}
