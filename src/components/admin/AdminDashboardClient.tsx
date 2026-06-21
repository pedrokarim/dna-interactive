"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Eye,
  EyeOff,
  FileWarning,
  Hammer,
  LayoutDashboard,
  RefreshCcw,
  Settings,
  Shield,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaAvatar } from "@/components/dna/Avatar";
import { DnaButton } from "@/components/dna/Button";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaTag } from "@/components/dna/Tag";
import { useConfirm } from "@/components/dna/ConfirmProvider";

const ADMIN_PAGE_SIZE = 12;

type AdminView = "overview" | "reports" | "builds" | "users" | "settings";

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

type CurrentAdmin = {
  name?: string | null;
  image?: string | null;
};

type AdminStats = {
  builds: number;
  reports: number;
  users: number;
  visibleBuilds: number;
  openReports: number;
  bannedUsers: number;
  adminUsers: number;
};

const EMPTY_PAGINATION: AdminPagination = {
  page: 1,
  pageSize: ADMIN_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

const ADMIN_NAV: Array<{ id: AdminView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "reports", label: "Signalements", icon: FileWarning },
  { id: "builds", label: "Builds", icon: Hammer },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "settings", label: "Configuration", icon: Settings },
];

export function AdminDashboardClient({ currentUser }: { currentUser: CurrentAdmin }) {
  // Onglet actif reflété dans l'URL (partageable, navigable).
  const [activeView, setActiveView] = useQueryState(
    "vue",
    parseAsStringLiteral(["overview", "reports", "builds", "users", "settings"] as const).withDefault("overview").withOptions({ history: "replace" }),
  );
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
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
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
      setRefreshing(false);
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
    setRefreshing(false);
    setMessage(null);
  }, [buildPage, reportPage, userPage]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);

  const stats = useMemo(
    () => ({
      builds: buildPagination.total,
      reports: reportPagination.total,
      users: userPagination.total,
      visibleBuilds: builds.filter((build) => !build.hidden).length,
      openReports: reports.filter((report) => report.status === "open").length,
      bannedUsers: users.filter((user) => user.banned).length,
      adminUsers: users.filter((user) => user.role === "admin").length,
    }),
    [buildPagination.total, builds, reportPagination.total, reports, userPagination.total, users],
  );

  async function patchBuild(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/builds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
    setMessage(response.ok ? "Action appliquee." : "Action refusee.");
  }

  async function patchUser(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
    setMessage(response.ok ? "Utilisateur mis a jour." : "Action refusee.");
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-parch">
      <AdminSidebar activeView={activeView} currentUser={currentUser} onChange={setActiveView} />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07090d]/92 backdrop-blur-md">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:px-6 xl:px-8">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-caps text-[0.58rem] uppercase tracking-[0.22em] text-gold/80">Back-office</p>
                <h1 className="truncate font-display text-2xl leading-tight text-parch md:text-3xl">Administration DNA</h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {message ? <span className="hidden font-sans text-xs text-gold md:inline">{message}</span> : null}
                <DnaButton
                  icon={<RefreshCcw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />}
                  className="px-3 py-2 text-xs"
                  onClick={() => void load()}
                  disabled={refreshing}
                >
                  Refresh
                </DnaButton>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {ADMIN_NAV.map((item) => (
                <AdminNavButton
                  key={item.id}
                  item={item}
                  active={activeView === item.id}
                  compact
                  onClick={() => setActiveView(item.id)}
                />
              ))}
            </div>
          </div>
        </header>

        <main className="px-4 py-5 md:px-6 md:py-6 xl:px-8">
          {loading ? (
            <AdminLoadingState />
          ) : (
            <div className="mx-auto flex w-full max-w-[112rem] flex-col gap-5">
              <AdminMetrics stats={stats} />
              {message ? <p className="font-sans text-sm text-gold md:hidden">{message}</p> : null}

              {activeView === "overview" ? (
                <OverviewView
                  reports={reports}
                  builds={builds}
                  users={users}
                  onView={setActiveView}
                  onPatchBuild={patchBuild}
                  onPatchUser={patchUser}
                />
              ) : null}

              {activeView === "reports" ? (
                <ReportsView
                  reports={reports}
                  pagination={reportPagination}
                  onChangePage={setReportPage}
                  onPatchBuild={patchBuild}
                />
              ) : null}

              {activeView === "builds" ? (
                <BuildsView
                  builds={builds}
                  pagination={buildPagination}
                  onChangePage={setBuildPage}
                  onPatchBuild={patchBuild}
                  onPatchUser={patchUser}
                />
              ) : null}

              {activeView === "users" ? (
                <UsersView
                  users={users}
                  pagination={userPagination}
                  onChangePage={setUserPage}
                  onPatchUser={patchUser}
                />
              ) : null}

              {activeView === "settings" ? <SettingsView /> : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminSidebar({
  activeView,
  currentUser,
  onChange,
}: {
  activeView: AdminView;
  currentUser: CurrentAdmin;
  onChange: (view: AdminView) => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#0b0e14] lg:flex">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center border border-gold/45 bg-gold/10 text-gold">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl leading-none text-parch">DNA Admin</p>
            <p className="mt-1 font-caps text-[0.55rem] uppercase tracking-[0.18em] text-muted">Operations panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {ADMIN_NAV.map((item) => (
          <AdminNavButton key={item.id} item={item} active={activeView === item.id} onClick={() => onChange(item.id)} />
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex min-w-0 items-center gap-3 border border-white/10 bg-white/[0.03] p-3">
          <DnaAvatar src={currentUser.image} fallback={(currentUser.name ?? "A").charAt(0).toUpperCase()} round size={38} />
          <div className="min-w-0">
            <p className="truncate font-sans text-sm text-parch">{currentUser.name ?? "Admin"}</p>
            <p className="font-caps text-[0.55rem] uppercase tracking-[0.16em] text-gold">Administrateur</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-2 font-sans text-xs text-parch/85 transition-colors hover:border-gold/45 hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Site
          </Link>
          <Link
            href="/builder"
            className="inline-flex items-center justify-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-2 font-sans text-xs text-parch/85 transition-colors hover:border-gold/45 hover:text-gold"
          >
            <Hammer className="h-3.5 w-3.5" />
            Builder
          </Link>
        </div>
      </div>
    </aside>
  );
}

function AdminNavButton({
  item,
  active,
  compact = false,
  onClick,
}: {
  item: (typeof ADMIN_NAV)[number];
  active: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 border px-3 py-2.5 text-left font-sans text-sm transition-colors ${
        active
          ? "border-gold/45 bg-gold/12 text-gold-bright"
          : "border-transparent text-parch/72 hover:border-white/10 hover:bg-white/[0.04] hover:text-parch"
      } ${compact ? "shrink-0" : "w-full"}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">{item.label}</span>
    </button>
  );
}

function AdminMetrics({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetric icon={<Hammer className="h-5 w-5" />} label="Builds total" value={stats.builds} sublabel={`${stats.visibleBuilds} visibles sur cette page`} />
      <AdminMetric icon={<FileWarning className="h-5 w-5" />} label="Signalements" value={stats.reports} sublabel={`${stats.openReports} ouverts sur cette page`} tone={stats.openReports > 0 ? "crimson" : "gold"} />
      <AdminMetric icon={<Users className="h-5 w-5" />} label="Utilisateurs" value={stats.users} sublabel={`${stats.bannedUsers} bannis sur cette page`} />
      <AdminMetric icon={<Shield className="h-5 w-5" />} label="Admins" value={stats.adminUsers} sublabel="Admins detectes sur cette page" />
    </div>
  );
}

function AdminMetric({
  icon,
  label,
  value,
  sublabel,
  tone = "gold",
}: {
  icon: ReactNode;
  label: string;
  value: number;
  sublabel: string;
  tone?: "gold" | "crimson";
}) {
  return (
    <DnaPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-caps text-[0.58rem] uppercase tracking-[0.18em] text-muted">{label}</p>
          <p className={tone === "crimson" ? "mt-2 font-display text-4xl leading-none text-[#ffb3a6]" : "mt-2 font-display text-4xl leading-none text-gold-bright"}>
            {value}
          </p>
        </div>
        <div className={tone === "crimson" ? "grid h-10 w-10 place-items-center border border-crimson-bright/35 bg-crimson/15 text-[#ffb3a6]" : "grid h-10 w-10 place-items-center border border-gold/35 bg-gold/10 text-gold"}>
          {icon}
        </div>
      </div>
      <p className="mt-3 font-sans text-xs text-muted-2">{sublabel}</p>
    </DnaPanel>
  );
}

function OverviewView({
  reports,
  builds,
  users,
  onView,
  onPatchBuild,
  onPatchUser,
}: {
  reports: AdminReport[];
  builds: AdminBuild[];
  users: AdminUser[];
  onView: (view: AdminView) => void;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
  onPatchUser: (body: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.85fr)]">
      <AdminSection
        title="File de moderation"
        label="Signalements ouverts"
        actionLabel="Voir tout"
        onAction={() => onView("reports")}
      >
        <ReportsList reports={reports.slice(0, 5)} compact onPatchBuild={onPatchBuild} />
      </AdminSection>

      <div className="grid gap-5">
        <AdminSection title="Activite builds" label="Derniers builds" actionLabel="Ouvrir builds" onAction={() => onView("builds")}>
          <BuildsList builds={builds.slice(0, 5)} compact onPatchBuild={onPatchBuild} onPatchUser={onPatchUser} />
        </AdminSection>
        <AdminSection title="Comptes recents" label="Utilisateurs" actionLabel="Ouvrir users" onAction={() => onView("users")}>
          <UsersList users={users.slice(0, 5)} compact onPatchUser={onPatchUser} />
        </AdminSection>
      </div>
    </div>
  );
}

function ReportsView({
  reports,
  pagination,
  onChangePage,
  onPatchBuild,
}: {
  reports: AdminReport[];
  pagination: AdminPagination;
  onChangePage: (page: number) => void;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <AdminSection title="Signalements" label="Moderation" footer={<AdminPager pagination={pagination} onChange={onChangePage} />}>
      <ReportsList reports={reports} onPatchBuild={onPatchBuild} />
    </AdminSection>
  );
}

function BuildsView({
  builds,
  pagination,
  onChangePage,
  onPatchBuild,
  onPatchUser,
}: {
  builds: AdminBuild[];
  pagination: AdminPagination;
  onChangePage: (page: number) => void;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
  onPatchUser: (body: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <AdminSection title="Builds communautaires" label="Publication" footer={<AdminPager pagination={pagination} onChange={onChangePage} />}>
      <BuildsList builds={builds} onPatchBuild={onPatchBuild} onPatchUser={onPatchUser} />
    </AdminSection>
  );
}

function UsersView({
  users,
  pagination,
  onChangePage,
  onPatchUser,
}: {
  users: AdminUser[];
  pagination: AdminPagination;
  onChangePage: (page: number) => void;
  onPatchUser: (body: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <AdminSection title="Utilisateurs" label="Comptes" footer={<AdminPager pagination={pagination} onChange={onChangePage} />}>
      <UsersList users={users} onPatchUser={onPatchUser} />
    </AdminSection>
  );
}

function SettingsView() {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <AdminSection title="Authentification" label="Discord">
        <ConfigRows
          rows={[
            ["Provider", "Discord OAuth"],
            ["Sessions", "Base de donnees"],
            ["Admins racine", "ADMIN_DISCORD_IDS"],
          ]}
        />
      </AdminSection>
      <AdminSection title="Moderation" label="Regles">
        <ConfigRows
          rows={[
            ["Builds masques", "Exclus de l'affichage public"],
            ["Signalements", "Open / resolved / dismissed"],
            ["Protections", "Admins env non retrogradables"],
          ]}
        />
      </AdminSection>
      <AdminSection title="Pagination" label="Listes">
        <ConfigRows
          rows={[
            ["Page size", `${ADMIN_PAGE_SIZE} lignes`],
            ["Builds", "Pagination serveur"],
            ["Utilisateurs", "Pagination serveur"],
          ]}
        />
      </AdminSection>
    </div>
  );
}

function ConfigRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="divide-y divide-white/10">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <p className="font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted">{label}</p>
          <p className="font-sans text-sm text-parch">{value}</p>
        </div>
      ))}
    </div>
  );
}

function AdminSection({
  title,
  label,
  actionLabel,
  onAction,
  footer,
  children,
}: {
  title: string;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DnaPanel className="min-w-0 p-4 md:p-5">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <DnaSectionLabel>{label}</DnaSectionLabel>
          <h2 className="mt-1 font-display text-2xl leading-tight text-parch">{title}</h2>
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-2 font-sans text-xs text-parch/85 transition-colors hover:border-gold/45 hover:text-gold"
          >
            <Eye className="h-3.5 w-3.5" />
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
      {footer ? <div className="mt-4 border-t border-white/10 pt-4">{footer}</div> : null}
    </DnaPanel>
  );
}

function ReportsList({
  reports,
  compact = false,
  onPatchBuild,
}: {
  reports: AdminReport[];
  compact?: boolean;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
}) {
  if (reports.length === 0) return <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} text="Aucun signalement." />;

  return (
    <div className="divide-y divide-white/10">
      {reports.map((report) => (
        <div key={report.id} className="grid gap-3 py-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 truncate font-sans text-sm font-medium text-parch">{report.buildTitle}</p>
              <DnaTag tone={report.status === "open" ? "crimson" : "gold"}>{report.status}</DnaTag>
            </div>
            <p className={compact ? "mt-1 line-clamp-2 font-sans text-xs text-muted" : "mt-2 font-sans text-sm text-muted"}>
              {report.reason}
            </p>
            <p className="mt-1 font-sans text-xs text-muted-2">Par {report.reporterName ?? "Discord"} · {formatDate(report.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <DnaButton icon={<EyeOff className="h-3.5 w-3.5" />} className="px-3 py-1.5 text-xs" onClick={() => void onPatchBuild({ buildId: report.buildId, hidden: true })}>
              Masquer
            </DnaButton>
            <DnaButton icon={<CheckCircle2 className="h-3.5 w-3.5" />} className="px-3 py-1.5 text-xs" onClick={() => void onPatchBuild({ reportId: report.id, reportStatus: "resolved" })}>
              Resoudre
            </DnaButton>
            {!compact ? (
              <DnaButton icon={<XCircle className="h-3.5 w-3.5" />} className="px-3 py-1.5 text-xs" onClick={() => void onPatchBuild({ reportId: report.id, reportStatus: "dismissed" })}>
                Rejeter
              </DnaButton>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function BuildsList({
  builds,
  compact = false,
  onPatchBuild,
  onPatchUser,
}: {
  builds: AdminBuild[];
  compact?: boolean;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
  onPatchUser: (body: Record<string, unknown>) => Promise<void>;
}) {
  const { confirm } = useConfirm();
  if (builds.length === 0) return <EmptyState icon={<Hammer className="h-5 w-5" />} text="Aucun build." />;

  return (
    <div className="divide-y divide-white/10">
      {builds.map((build) => (
        <div key={build.id} className="grid gap-3 py-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 truncate font-sans text-sm font-medium text-parch">{build.title}</p>
              <DnaTag tone={build.hidden ? "crimson" : "gold"}>{build.hidden ? "Masque" : "Visible"}</DnaTag>
            </div>
            <p className="mt-1 font-sans text-xs text-muted">
              {build.characterId} {build.element ? `(${build.element})` : ""} · {build.voteCount} votes · {build.authorName ?? "Discord"}
            </p>
            {!compact ? <p className="mt-1 font-sans text-xs text-muted-2">Mis a jour {formatDate(build.updatedAt)}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <DnaButton
              icon={build.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              className="px-3 py-1.5 text-xs"
              onClick={() => void onPatchBuild({ buildId: build.id, hidden: !build.hidden })}
            >
              {build.hidden ? "Afficher" : "Masquer"}
            </DnaButton>
            {!compact ? (
              <>
                <DnaButton
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={async () => {
                    if (
                      await confirm({
                        title: "Supprimer le build",
                        message: `Supprimer définitivement « ${build.title} » ? Cette action est irréversible.`,
                        confirmLabel: "Supprimer",
                        cancelLabel: "Annuler",
                        danger: true,
                      })
                    ) {
                      await onPatchBuild({ buildId: build.id, deleteBuild: true });
                    }
                  }}
                >
                  Supprimer
                </DnaButton>
                <DnaButton
                  icon={<Ban className="h-3.5 w-3.5" />}
                  className="px-3 py-1.5 text-xs"
                  onClick={async () => {
                    if (build.authorBanned) {
                      await onPatchUser({ userId: build.authorId, banned: false });
                      return;
                    }
                    if (
                      await confirm({
                        title: "Bannir l'auteur",
                        message: `Bannir ${build.authorName ?? "cet utilisateur"} ? Ses sessions seront invalidées et il ne pourra plus publier.`,
                        confirmLabel: "Bannir",
                        cancelLabel: "Annuler",
                        danger: true,
                      })
                    ) {
                      await onPatchUser({ userId: build.authorId, banned: true });
                    }
                  }}
                >
                  {build.authorBanned ? "Debannir" : "Bannir"}
                </DnaButton>
              </>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersList({
  users,
  compact = false,
  onPatchUser,
}: {
  users: AdminUser[];
  compact?: boolean;
  onPatchUser: (body: Record<string, unknown>) => Promise<void>;
}) {
  const { confirm } = useConfirm();
  if (users.length === 0) return <EmptyState icon={<Users className="h-5 w-5" />} text="Aucun utilisateur." />;

  return (
    <div className="divide-y divide-white/10">
      {users.map((user) => (
        <div key={user.id} className="grid gap-3 py-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <p className="truncate font-sans text-sm font-medium text-parch">{user.name ?? user.email ?? user.id}</p>
            <p className="mt-1 font-sans text-xs text-muted-2">{user.discordId ?? "discord id inconnu"} · Depuis {formatDate(user.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <DnaTag tone={user.role === "admin" ? "gold" : "crimson"}>{user.role}</DnaTag>
            {user.configuredAdmin ? <DnaTag tone="gold">Env</DnaTag> : null}
            {user.banned ? <DnaTag tone="crimson">Banni</DnaTag> : null}
            <DnaButton
              icon={<Ban className="h-3.5 w-3.5" />}
              className="px-3 py-1.5 text-xs"
              disabled={user.configuredAdmin && !user.banned}
              onClick={async () => {
                if (user.banned) {
                  await onPatchUser({ userId: user.id, banned: false });
                  return;
                }
                if (
                  await confirm({
                    title: "Bannir l'utilisateur",
                    message: `Bannir ${user.name ?? user.email ?? "cet utilisateur"} ? Ses sessions seront invalidées et il ne pourra plus publier.`,
                    confirmLabel: "Bannir",
                    cancelLabel: "Annuler",
                    danger: true,
                  })
                ) {
                  await onPatchUser({ userId: user.id, banned: true });
                }
              }}
            >
              {user.banned ? "Debannir" : "Bannir"}
            </DnaButton>
            {!compact ? (
              <DnaButton
                icon={<UserCog className="h-3.5 w-3.5" />}
                className="px-3 py-1.5 text-xs"
                disabled={user.configuredAdmin && user.role === "admin"}
                onClick={() => void onPatchUser({ userId: user.id, role: user.role === "admin" ? "user" : "admin" })}
              >
                {user.role === "admin" ? "Retrograder" : "Promouvoir"}
              </DnaButton>
            ) : null}
          </div>
        </div>
      ))}
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
  if (pagination.totalPages <= 1) {
    return (
      <p className="font-sans text-xs text-muted">
        Page {pagination.page}/{pagination.totalPages} · {pagination.total} elements
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-sans text-xs text-muted">
        Page {pagination.page}/{pagination.totalPages} · {pagination.total} elements
      </p>
      <div className="flex items-center gap-2">
        <DnaButton
          className="px-3 py-1.5 text-xs"
          disabled={pagination.page <= 1}
          onClick={() => onChange(Math.max(1, pagination.page - 1))}
        >
          Precedent
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

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="grid place-items-center gap-2 border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-muted">
      {icon}
      <p className="font-sans text-sm">{text}</p>
    </div>
  );
}

function AdminLoadingState() {
  return (
    <div className="mx-auto grid w-full max-w-[112rem] gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <DnaPanel key={index} className="h-32 animate-pulse bg-white/[0.03]">
          <span aria-hidden />
        </DnaPanel>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
