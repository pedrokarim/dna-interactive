"use client";

import { useEffect, useState } from "react";
import { DnaButton } from "@/components/dna/Button";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaTag } from "@/components/dna/Tag";

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
  banned: boolean;
  createdAt: string;
};

export function AdminDashboardClient() {
  const [builds, setBuilds] = useState<AdminBuild[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [buildsResponse, usersResponse] = await Promise.all([
      fetch("/api/admin/builds"),
      fetch("/api/admin/users"),
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
    setLoading(false);
    setMessage(null);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, []);

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
      <div className="flex flex-col gap-4">
        <DnaPanel className="p-4">
          <div className="flex items-center justify-between gap-3">
            <DnaSectionLabel>Signalements</DnaSectionLabel>
            {message ? <span className="font-sans text-xs text-gold">{message}</span> : null}
          </div>
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
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>Builds récents</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            {builds.map((build) => (
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
            ))}
          </div>
        </DnaPanel>
      </div>

      <DnaPanel className="p-4">
        <DnaSectionLabel>Utilisateurs</DnaSectionLabel>
        <div className="mt-3 flex flex-col gap-2">
          {users.map((user) => (
            <div key={user.id} className="border border-white/10 bg-ink/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-sans text-sm text-parch">{user.name ?? user.email ?? user.id}</p>
                <DnaTag tone={user.role === "admin" ? "gold" : "crimson"}>{user.role}</DnaTag>
                {user.banned ? <DnaTag tone="crimson">Banni</DnaTag> : null}
              </div>
              <p className="mt-1 font-sans text-xs text-muted-2">{user.discordId ?? "discord id inconnu"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <DnaButton className="px-3 py-1.5 text-xs" onClick={() => void patchUser({ userId: user.id, banned: !user.banned })}>
                  {user.banned ? "Débannir" : "Bannir"}
                </DnaButton>
                <DnaButton
                  className="px-3 py-1.5 text-xs"
                  onClick={() => void patchUser({ userId: user.id, role: user.role === "admin" ? "user" : "admin" })}
                >
                  {user.role === "admin" ? "Rétrograder" : "Promouvoir"}
                </DnaButton>
              </div>
            </div>
          ))}
        </div>
      </DnaPanel>
    </div>
  );
}
