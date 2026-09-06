"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  FileWarning,
  Hammer,
  LayoutDashboard,
  Mail,
  MailOpen,
  Megaphone,
  RefreshCcw,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Undo2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaAvatar } from "@/components/dna/Avatar";
import { useConfirm } from "@/components/dna/ConfirmProvider";
import { cn } from "@/components/dna";
import { AnnouncementsAdminClient } from "./AnnouncementsAdminClient";
import { CalendarAdminClient } from "./CalendarAdminClient";
import { ChangelogAdminClient } from "./ChangelogAdminClient";
import { SettingsAdminClient } from "./SettingsAdminClient";
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
  AdminSearch,
  AdminStatus,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
  type AdminPagination,
} from "./ui";

const ADMIN_PAGE_SIZE = 12;

type AdminView = "overview" | "reports" | "builds" | "users" | "emails" | "announcements" | "changelog" | "calendar" | "settings";

type EmailStats = {
  total: number;
  opened: number;
  openRate: number;
  byKind: Array<{ kind: string; sent: number; opened: number }>;
  recent: Array<{ recipient: string; kind: string; sentAt: string; openedAt: string | null; openCount: number }>;
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

type CurrentAdmin = { name?: string | null; image?: string | null };

const EMPTY_PAGINATION: AdminPagination = { page: 1, pageSize: ADMIN_PAGE_SIZE, total: 0, totalPages: 1 };

const ADMIN_NAV: Array<{ id: AdminView; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "reports", label: "Signalements", icon: FileWarning },
  { id: "builds", label: "Builds", icon: Hammer },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "announcements", label: "Annonces", icon: Megaphone },
  { id: "changelog", label: "Changelog", icon: ScrollText },
  { id: "calendar", label: "Calendrier", icon: CalendarDays },
  { id: "settings", label: "Configuration", icon: Settings },
];

const VIEW_IDS = ADMIN_NAV.map((item) => item.id) as [AdminView, ...AdminView[]];

/**
 * Console d'administration.
 *
 * Parti pris : une console, pas une page produit. Les données sont présentées
 * en tableaux denses, chaque action tient dans une icône à infobulle, et le
 * chrome (titres, encarts, métriques) ne mange pas la place des lignes. Les
 * primitives vivent dans `./ui` – elles ne réutilisent volontairement pas les
 * composants marketing du design system, dont les proportions sont faites pour
 * convaincre un visiteur, pas pour traiter une file de modération.
 */
export function AdminDashboardClient({ currentUser }: { currentUser: CurrentAdmin }) {
  const [activeView, setActiveView] = useQueryState(
    "vue",
    parseAsStringLiteral(VIEW_IDS).withDefault("overview").withOptions({ history: "replace" }),
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
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const buildParams = new URLSearchParams({
        buildPage: `${buildPage}`,
        buildPageSize: `${ADMIN_PAGE_SIZE}`,
        reportPage: `${reportPage}`,
        reportPageSize: `${ADMIN_PAGE_SIZE}`,
      });
      const userParams = new URLSearchParams({ page: `${userPage}`, pageSize: `${ADMIN_PAGE_SIZE}` });

      const [buildsResponse, usersResponse, emailsResponse] = await Promise.all([
        fetch(`/api/admin/builds?${buildParams}`),
        fetch(`/api/admin/users?${userParams}`),
        fetch(`/api/admin/emails`),
      ]);

      if (emailsResponse.ok) setEmailStats(await emailsResponse.json().catch(() => null));
      if (!buildsResponse.ok || !usersResponse.ok) {
        setMessage({ tone: "error", text: "Chargement impossible." });
        return;
      }

      const [buildsData, usersData] = await Promise.all([buildsResponse.json(), usersResponse.json()]);
      setBuilds(buildsData.builds ?? []);
      setReports(buildsData.reports ?? []);
      setUsers(usersData.users ?? []);
      setBuildPagination(buildsData.pagination?.builds ?? EMPTY_PAGINATION);
      setReportPagination(buildsData.pagination?.reports ?? EMPTY_PAGINATION);
      setUserPagination(usersData.pagination ?? EMPTY_PAGINATION);
    } catch {
      setMessage({ tone: "error", text: "Chargement impossible." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
      openReports: reports.filter((report) => report.status === "open").length,
      hiddenBuilds: builds.filter((build) => build.hidden).length,
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
    setMessage(response.ok ? { tone: "ok", text: "Action appliquée." } : { tone: "error", text: "Action refusée." });
  }

  async function patchUser(body: Record<string, unknown>) {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
    setMessage(response.ok ? { tone: "ok", text: "Compte mis à jour." } : { tone: "error", text: "Action refusée." });
  }

  // Filtre local à la page chargée. Le dire explicitement (cf. `hint`) évite de
  // laisser croire à une recherche sur toute la base.
  const needle = filter.trim().toLowerCase();
  const filteredReports = needle
    ? reports.filter((r) => `${r.buildTitle} ${r.reason} ${r.reporterName ?? ""}`.toLowerCase().includes(needle))
    : reports;
  const filteredBuilds = needle
    ? builds.filter((b) => `${b.title} ${b.characterId} ${b.authorName ?? ""}`.toLowerCase().includes(needle))
    : builds;
  const filteredUsers = needle
    ? users.filter((u) => `${u.name ?? ""} ${u.email ?? ""} ${u.discordId ?? ""}`.toLowerCase().includes(needle))
    : users;

  const activeLabel = ADMIN_NAV.find((item) => item.id === activeView)?.label ?? "";
  const hasTable = activeView === "reports" || activeView === "builds" || activeView === "users";

  return (
    <div className="min-h-screen bg-[#07090d] text-parch">
      <AdminSidebar
        activeView={activeView}
        currentUser={currentUser}
        openReports={stats.openReports}
        onChange={setActiveView}
      />

      <div className="min-h-screen lg:pl-64">
        {/* ------------------------------------------------------ barre supérieure */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07090d]/95 backdrop-blur-md">
          <div className="flex min-h-14 items-center gap-3 px-4 py-2.5 md:px-5">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="hidden font-caps text-[0.56rem] uppercase tracking-[0.2em] text-muted-2 sm:inline">
                Back-office
              </span>
              <span aria-hidden className="hidden text-muted-2 sm:inline">
                /
              </span>
              <h1 className="truncate font-caps text-[0.68rem] uppercase tracking-[0.18em] text-gold">{activeLabel}</h1>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {message ? (
                <span
                  className={cn(
                    "hidden font-sans text-[0.72rem] md:inline",
                    message.tone === "ok" ? "text-gold" : "text-[#ffb3a6]",
                  )}
                >
                  {message.text}
                </span>
              ) : null}
              <AdminIconButton
                icon={RefreshCcw}
                label="Recharger les données"
                busy={refreshing}
                onClick={() => void load()}
              />
            </div>
          </div>

          {/* Navigation repliée sur les petits écrans */}
          <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:px-5 lg:hidden">
            {ADMIN_NAV.map((item) => (
              <AdminNavButton
                key={item.id}
                item={item}
                active={activeView === item.id}
                compact
                badge={item.id === "reports" ? stats.openReports : 0}
                onClick={() => setActiveView(item.id)}
              />
            ))}
          </nav>
        </header>

        <main className="flex flex-col gap-4 px-4 py-4 md:px-5">
          {activeView === "overview" ? <AdminMetrics stats={stats} onView={setActiveView} /> : null}

          {message ? (
            <p className={cn("font-sans text-[0.78rem] md:hidden", message.tone === "ok" ? "text-gold" : "text-[#ffb3a6]")}>
              {message.text}
            </p>
          ) : null}

          {hasTable ? (
            <div className="max-w-md">
              <AdminSearch
                value={filter}
                onChange={setFilter}
                placeholder="Filtrer…"
                hint="Le filtre porte sur la page affichée, pas sur toute la base."
              />
            </div>
          ) : null}

          {activeView === "overview" ? (
            <OverviewView
              loading={loading}
              reports={reports}
              builds={builds}
              onView={setActiveView}
              onPatchBuild={patchBuild}
            />
          ) : null}

          {activeView === "reports" ? (
            <AdminPanel
              label="File de modération"
              count={reportPagination.total}
              footer={<AdminPager pagination={reportPagination} onChange={setReportPage} />}
            >
              {loading ? (
                <AdminTableSkeleton columns={5} />
              ) : (
                <ReportsTable reports={filteredReports} onPatchBuild={patchBuild} />
              )}
            </AdminPanel>
          ) : null}

          {activeView === "builds" ? (
            <AdminPanel
              label="Builds communautaires"
              count={buildPagination.total}
              footer={<AdminPager pagination={buildPagination} onChange={setBuildPage} />}
            >
              {loading ? (
                <AdminTableSkeleton columns={6} />
              ) : (
                <BuildsTable builds={filteredBuilds} onPatchBuild={patchBuild} onPatchUser={patchUser} />
              )}
            </AdminPanel>
          ) : null}

          {activeView === "users" ? (
            <AdminPanel
              label="Comptes"
              count={userPagination.total}
              footer={<AdminPager pagination={userPagination} onChange={setUserPage} />}
            >
              {loading ? <AdminTableSkeleton columns={5} /> : <UsersTable users={filteredUsers} onPatchUser={patchUser} />}
            </AdminPanel>
          ) : null}

          {activeView === "emails" ? <EmailsView stats={emailStats} /> : null}
          {activeView === "announcements" ? <AnnouncementsAdminClient /> : null}
          {activeView === "changelog" ? <ChangelogAdminClient /> : null}
          {activeView === "calendar" ? <CalendarAdminClient /> : null}
          {activeView === "settings" ? <SettingsAdminClient /> : null}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function AdminSidebar({
  activeView,
  currentUser,
  openReports,
  onChange,
}: {
  activeView: AdminView;
  currentUser: CurrentAdmin;
  openReports: number;
  onChange: (view: AdminView) => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#0b0e14] lg:flex">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center border border-gold/45 bg-gold/10 text-gold">
          <Shield className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-caps text-[0.7rem] uppercase tracking-[0.16em] text-parch">DNA Admin</span>
          <span className="block font-mono text-[0.58rem] text-muted-2">operations</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {ADMIN_NAV.map((item) => (
          <AdminNavButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            badge={item.id === "reports" ? openReports : 0}
            onClick={() => onChange(item.id)}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 p-2.5">
        <div className="flex min-w-0 items-center gap-2.5 px-1.5 py-1">
          <DnaAvatar src={currentUser.image} fallback={(currentUser.name ?? "A").charAt(0).toUpperCase()} round size={30} />
          <span className="min-w-0">
            <span className="block truncate font-sans text-[0.8rem] text-parch">{currentUser.name ?? "Admin"}</span>
            <span className="block font-mono text-[0.58rem] uppercase tracking-[0.1em] text-gold/80">administrateur</span>
          </span>
        </div>
        <div className="mt-2 flex gap-1">
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-1.5 border border-white/12 px-2 py-1.5 font-sans text-[0.72rem] text-parch/75 transition-colors hover:border-gold/45 hover:text-gold"
          >
            <ArrowLeft className="h-3 w-3" />
            Site
          </Link>
          <Link
            href="/builder"
            className="flex flex-1 items-center justify-center gap-1.5 border border-white/12 px-2 py-1.5 font-sans text-[0.72rem] text-parch/75 transition-colors hover:border-gold/45 hover:text-gold"
          >
            <Hammer className="h-3 w-3" />
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
  badge = 0,
  onClick,
}: {
  item: (typeof ADMIN_NAV)[number];
  active: boolean;
  compact?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 text-left font-sans text-[0.82rem] transition-colors",
        compact
          ? cn("shrink-0 border-b-2", active ? "border-b-gold text-gold-bright" : "border-b-transparent text-parch/65 hover:text-parch")
          : cn(
              "w-full border-l-2",
              active
                ? "border-l-gold bg-gold/10 text-gold-bright"
                : "border-l-transparent text-parch/65 hover:bg-white/[0.04] hover:text-parch",
            ),
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">{item.label}</span>
      {badge > 0 ? (
        <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-crimson-bright px-1 font-mono text-[0.58rem] leading-none text-white tabular-nums">
          <span className="dna-optical-num">{badge}</span>
        </span>
      ) : null}
    </button>
  );
}

type AdminStats = {
  builds: number;
  reports: number;
  users: number;
  openReports: number;
  hiddenBuilds: number;
  bannedUsers: number;
  adminUsers: number;
};

/** Bandeau de métriques : une ligne de cellules cliquables, pas quatre cartes. */
function AdminMetrics({ stats, onView }: { stats: AdminStats; onView: (view: AdminView) => void }) {
  const cells: Array<{ view: AdminView; label: string; value: number; detail: string; alert?: boolean }> = [
    {
      view: "reports",
      label: "Signalements ouverts",
      value: stats.openReports,
      detail: `${stats.reports} au total`,
      alert: stats.openReports > 0,
    },
    { view: "builds", label: "Builds", value: stats.builds, detail: `${stats.hiddenBuilds} masqués sur cette page` },
    { view: "users", label: "Comptes", value: stats.users, detail: `${stats.bannedUsers} bannis sur cette page` },
    { view: "users", label: "Admins", value: stats.adminUsers, detail: "sur cette page" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 xl:grid-cols-4">
      {cells.map((cell) => (
        <button
          key={cell.label}
          type="button"
          onClick={() => onView(cell.view)}
          className="flex flex-col gap-0.5 bg-[#0c0f15] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04]"
        >
          <span className="font-caps text-[0.54rem] uppercase tracking-[0.16em] text-muted-2">{cell.label}</span>
          <span
            className={cn("font-display text-3xl leading-none tabular-nums", cell.alert ? "text-[#ffb3a6]" : "text-gold-bright")}
          >
            {cell.value}
          </span>
          <span className="font-sans text-[0.68rem] text-muted-2">{cell.detail}</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vues
// ---------------------------------------------------------------------------

function OverviewView({
  loading,
  reports,
  builds,
  onView,
  onPatchBuild,
}: {
  loading: boolean;
  reports: AdminReport[];
  builds: AdminBuild[];
  onView: (view: AdminView) => void;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
}) {
  const openReports = reports.filter((report) => report.status === "open");

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <AdminPanel
        label="À traiter"
        count={openReports.length}
        actions={<AdminIconButton icon={ExternalLink} label="Ouvrir la modération" onClick={() => onView("reports")} />}
      >
        {loading ? (
          <AdminTableSkeleton rows={4} columns={4} />
        ) : (
          <ReportsTable reports={openReports.slice(0, 6)} compact onPatchBuild={onPatchBuild} />
        )}
      </AdminPanel>

      <AdminPanel
        label="Derniers builds"
        count={builds.length}
        actions={<AdminIconButton icon={ExternalLink} label="Ouvrir les builds" onClick={() => onView("builds")} />}
      >
        {loading ? (
          <AdminTableSkeleton rows={4} columns={4} />
        ) : (
          <BuildsTable builds={builds.slice(0, 6)} compact onPatchBuild={onPatchBuild} />
        )}
      </AdminPanel>
    </div>
  );
}

const REPORT_STATUS: Record<AdminReport["status"], { tone: "danger" | "ok" | "neutral"; label: string }> = {
  open: { tone: "danger", label: "Ouvert" },
  resolved: { tone: "ok", label: "Résolu" },
  dismissed: { tone: "neutral", label: "Rejeté" },
};

function ReportsTable({
  reports,
  compact = false,
  onPatchBuild,
}: {
  reports: AdminReport[];
  compact?: boolean;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
}) {
  if (reports.length === 0) return <AdminEmpty icon={Check} text="Aucun signalement." />;

  return (
    <AdminTable minWidth={compact ? "32rem" : "46rem"}>
      <thead>
        <tr>
          <AdminTh>Build</AdminTh>
          <AdminTh>Motif</AdminTh>
          {!compact ? <AdminTh width="9rem">Signalé par</AdminTh> : null}
          <AdminTh width="7rem">Statut</AdminTh>
          <AdminTh width={compact ? "7rem" : "9.5rem"} align="right">
            Actions
          </AdminTh>
        </tr>
      </thead>
      <tbody>
        {reports.map((report) => {
          const status = REPORT_STATUS[report.status];
          return (
            <AdminTr key={report.id} dimmed={report.status !== "open"}>
              <AdminTd>
                <AdminIdentity primary={report.buildTitle} secondary={formatDate(report.createdAt)} />
              </AdminTd>
              <AdminTd className="max-w-[22rem]">
                <span className="line-clamp-2 text-muted">{report.reason}</span>
              </AdminTd>
              {!compact ? (
                <AdminTd>
                  <span className="truncate text-muted">{report.reporterName ?? "—"}</span>
                </AdminTd>
              ) : null}
              <AdminTd>
                <AdminStatus tone={status.tone}>{status.label}</AdminStatus>
              </AdminTd>
              <AdminTd align="right">
                <AdminActions>
                  <AdminIconLink icon={ExternalLink} label="Ouvrir le build" href={`/fr/builds/${report.buildId}`} external />
                  <AdminIconButton
                    icon={EyeOff}
                    label="Masquer le build"
                    onClick={() => void onPatchBuild({ buildId: report.buildId, hidden: true })}
                  />
                  <AdminActionsDivider />
                  <AdminIconButton
                    icon={Check}
                    label="Marquer résolu"
                    disabled={report.status === "resolved"}
                    onClick={() => void onPatchBuild({ reportId: report.id, reportStatus: "resolved" })}
                  />
                  {!compact ? (
                    <AdminIconButton
                      icon={X}
                      label="Rejeter le signalement"
                      disabled={report.status === "dismissed"}
                      onClick={() => void onPatchBuild({ reportId: report.id, reportStatus: "dismissed" })}
                    />
                  ) : null}
                </AdminActions>
              </AdminTd>
            </AdminTr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}

function BuildsTable({
  builds,
  compact = false,
  onPatchBuild,
  onPatchUser,
}: {
  builds: AdminBuild[];
  compact?: boolean;
  onPatchBuild: (body: Record<string, unknown>) => Promise<void>;
  onPatchUser?: (body: Record<string, unknown>) => Promise<void>;
}) {
  const { confirm } = useConfirm();
  if (builds.length === 0) return <AdminEmpty icon={Hammer} text="Aucun build." />;

  return (
    <AdminTable minWidth={compact ? "32rem" : "52rem"}>
      <thead>
        <tr>
          <AdminTh>Build</AdminTh>
          <AdminTh width="9rem">Personnage</AdminTh>
          <AdminTh width="4.5rem" align="right">
            Votes
          </AdminTh>
          {!compact ? <AdminTh width="10rem">Auteur</AdminTh> : null}
          <AdminTh width="7rem">Statut</AdminTh>
          <AdminTh width={compact ? "5.5rem" : "11rem"} align="right">
            Actions
          </AdminTh>
        </tr>
      </thead>
      <tbody>
        {builds.map((build) => (
          <AdminTr key={build.id} dimmed={build.hidden}>
            <AdminTd>
              <AdminIdentity primary={build.title} secondary={formatDate(build.updatedAt)} />
            </AdminTd>
            <AdminTd>
              <span className="flex items-center gap-1.5">
                <span className="truncate font-mono text-[0.7rem] text-muted">{build.characterId}</span>
                {build.element ? <AdminChip>{build.element}</AdminChip> : null}
              </span>
            </AdminTd>
            <AdminTd align="right">
              <span className="font-mono text-[0.78rem] text-gold-bright tabular-nums">{build.voteCount}</span>
            </AdminTd>
            {!compact ? (
              <AdminTd>
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-muted">{build.authorName ?? "—"}</span>
                  {build.authorBanned ? <AdminChip tone="danger">banni</AdminChip> : null}
                </span>
              </AdminTd>
            ) : null}
            <AdminTd>
              {build.hidden ? <AdminStatus tone="danger">Masqué</AdminStatus> : <AdminStatus tone="ok">Visible</AdminStatus>}
            </AdminTd>
            <AdminTd align="right">
              <AdminActions>
                <AdminIconLink icon={ExternalLink} label="Ouvrir le build" href={`/fr/builds/${build.id}`} external />
                <AdminIconButton
                  icon={build.hidden ? Eye : EyeOff}
                  label={build.hidden ? "Rendre visible" : "Masquer"}
                  tone={build.hidden ? "active" : "default"}
                  onClick={() => void onPatchBuild({ buildId: build.id, hidden: !build.hidden })}
                />
                {!compact && onPatchUser ? (
                  <>
                    <AdminActionsDivider />
                    <AdminIconButton
                      icon={build.authorBanned ? Undo2 : Ban}
                      label={build.authorBanned ? "Lever le bannissement de l'auteur" : "Bannir l'auteur"}
                      tone={build.authorBanned ? "default" : "danger"}
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
                    />
                    <AdminIconButton
                      icon={Trash2}
                      label="Supprimer le build"
                      tone="danger"
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
                    />
                  </>
                ) : null}
              </AdminActions>
            </AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  );
}

function UsersTable({
  users,
  onPatchUser,
}: {
  users: AdminUser[];
  onPatchUser: (body: Record<string, unknown>) => Promise<void>;
}) {
  const { confirm } = useConfirm();
  if (users.length === 0) return <AdminEmpty icon={Users} text="Aucun compte." />;

  return (
    <AdminTable minWidth="46rem">
      <thead>
        <tr>
          <AdminTh>Compte</AdminTh>
          <AdminTh width="13rem">Email</AdminTh>
          <AdminTh width="7.5rem">Rôle</AdminTh>
          <AdminTh width="6.5rem">Statut</AdminTh>
          <AdminTh width="6rem">Inscrit</AdminTh>
          <AdminTh width="6rem" align="right">
            Actions
          </AdminTh>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <AdminTr key={user.id} dimmed={user.banned}>
            <AdminTd>
              <AdminIdentity primary={user.name ?? user.id} secondary={user.discordId ?? user.id} />
            </AdminTd>
            <AdminTd>
              <span className="truncate font-mono text-[0.7rem] text-muted">{user.email ?? "—"}</span>
            </AdminTd>
            <AdminTd>
              <span className="flex items-center gap-1.5">
                <AdminChip tone={user.role === "admin" ? "gold" : "neutral"}>{user.role}</AdminChip>
                {user.configuredAdmin ? <AdminChip tone="gold">env</AdminChip> : null}
              </span>
            </AdminTd>
            <AdminTd>
              {user.banned ? <AdminStatus tone="danger">Banni</AdminStatus> : <AdminStatus tone="ok">Actif</AdminStatus>}
            </AdminTd>
            <AdminTd>
              <span className="font-mono text-[0.7rem] text-muted-2">{formatDate(user.createdAt)}</span>
            </AdminTd>
            <AdminTd align="right">
              <AdminActions>
                <AdminIconButton
                  icon={user.role === "admin" ? ShieldOff : ShieldCheck}
                  label={user.role === "admin" ? "Rétrograder en utilisateur" : "Promouvoir administrateur"}
                  disabled={user.configuredAdmin && user.role === "admin"}
                  onClick={() => void onPatchUser({ userId: user.id, role: user.role === "admin" ? "user" : "admin" })}
                />
                <AdminIconButton
                  icon={user.banned ? Undo2 : Ban}
                  label={user.banned ? "Lever le bannissement" : "Bannir le compte"}
                  tone={user.banned ? "default" : "danger"}
                  disabled={user.configuredAdmin && !user.banned}
                  onClick={async () => {
                    if (user.banned) {
                      await onPatchUser({ userId: user.id, banned: false });
                      return;
                    }
                    if (
                      await confirm({
                        title: "Bannir le compte",
                        message: `Bannir ${user.name ?? user.email ?? "ce compte"} ? Ses sessions seront invalidées et il ne pourra plus publier.`,
                        confirmLabel: "Bannir",
                        cancelLabel: "Annuler",
                        danger: true,
                      })
                    ) {
                      await onPatchUser({ userId: user.id, banned: true });
                    }
                  }}
                />
              </AdminActions>
            </AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  );
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

const EMAIL_KIND_LABELS: Record<string, string> = {
  verify_email: "Vérification",
  reset_password: "Réinitialisation",
  set_password: "Définition de mot de passe",
  welcome: "Bienvenue",
  contact: "Contact",
  announcement: "Annonce",
};

function EmailsView({ stats }: { stats: EmailStats | null }) {
  if (!stats || stats.total === 0) {
    return (
      <AdminPanel label="Emails">
        <AdminEmpty icon={Mail} text="Aucun email suivi pour l'instant." />
      </AdminPanel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 xl:grid-cols-3">
        <EmailMetric label="Envoyés" value={`${stats.total}`} detail="total historique" />
        <EmailMetric label="Ouverts" value={`${stats.opened}`} detail="pixel de suivi" />
        <EmailMetric label="Taux d'ouverture" value={`${stats.openRate}%`} detail="approximatif (proxys mail)" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <AdminPanel label="Par type">
          <AdminTable minWidth="20rem">
            <thead>
              <tr>
                <AdminTh>Type</AdminTh>
                <AdminTh width="4.5rem" align="right">
                  Envoyés
                </AdminTh>
                <AdminTh width="4.5rem" align="right">
                  Ouverts
                </AdminTh>
                <AdminTh width="4rem" align="right">
                  Taux
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {stats.byKind.map((kind) => (
                <AdminTr key={kind.kind}>
                  <AdminTd>{EMAIL_KIND_LABELS[kind.kind] ?? kind.kind}</AdminTd>
                  <AdminTd align="right">
                    <span className="font-mono text-[0.78rem] tabular-nums">{kind.sent}</span>
                  </AdminTd>
                  <AdminTd align="right">
                    <span className="font-mono text-[0.78rem] tabular-nums">{kind.opened}</span>
                  </AdminTd>
                  <AdminTd align="right">
                    <span className="font-mono text-[0.78rem] text-gold-bright tabular-nums">
                      {kind.sent > 0 ? Math.round((kind.opened / kind.sent) * 100) : 0}%
                    </span>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        </AdminPanel>

        <AdminPanel label="Derniers envois" count={stats.recent.length}>
          <AdminTable minWidth="30rem">
            <thead>
              <tr>
                <AdminTh>Destinataire</AdminTh>
                <AdminTh width="11rem">Type</AdminTh>
                <AdminTh width="6rem">Envoyé</AdminTh>
                <AdminTh width="8rem">Statut</AdminTh>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((email, index) => (
                <AdminTr key={`${email.recipient}-${email.sentAt}-${index}`}>
                  <AdminTd>
                    <span className="truncate font-mono text-[0.72rem] text-parch/85">{email.recipient}</span>
                  </AdminTd>
                  <AdminTd>
                    <span className="text-muted">{EMAIL_KIND_LABELS[email.kind] ?? email.kind}</span>
                  </AdminTd>
                  <AdminTd>
                    <span className="font-mono text-[0.7rem] text-muted-2">{formatDate(email.sentAt)}</span>
                  </AdminTd>
                  <AdminTd>
                    {email.openedAt ? (
                      <AdminStatus tone="ok">Ouvert{email.openCount > 1 ? ` ×${email.openCount}` : ""}</AdminStatus>
                    ) : (
                      <AdminStatus tone="neutral">Non ouvert</AdminStatus>
                    )}
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        </AdminPanel>
      </div>
    </div>
  );
}

function EmailMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-[#0c0f15] px-3.5 py-3">
      <span className="flex items-center gap-1.5 font-caps text-[0.54rem] uppercase tracking-[0.16em] text-muted-2">
        <MailOpen aria-hidden className="h-3 w-3" />
        {label}
      </span>
      <span className="font-display text-3xl leading-none text-gold-bright tabular-nums">{value}</span>
      <span className="font-sans text-[0.68rem] text-muted-2">{detail}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Format compact et alignable : en colonne, la lisibilité prime sur le style. */
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
