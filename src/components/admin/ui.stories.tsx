import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Ban, Check, ExternalLink, Eye, EyeOff, Hammer, ShieldCheck, Trash2, Undo2 } from "lucide-react";
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
} from "./ui";

/**
 * Primitives du back-office.
 *
 * Famille séparée de `DNA/*` à dessein : le design system public est calibré
 * pour convaincre un visiteur (grands titres, boutons larges à libellé), la
 * console pour traiter du volume. Mêmes couleurs, mêmes fontes, proportions
 * différentes.
 */
const meta = {
  title: "Admin/Primitives",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

/** Toutes les variations du bouton d'action. Survolez pour voir l'infobulle. */
export const Actions: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Row label="Tons">
        <AdminIconButton icon={Eye} label="Rendre visible" />
        <AdminIconButton icon={EyeOff} label="Masquer" tone="active" />
        <AdminIconButton icon={Trash2} label="Supprimer" tone="danger" />
        <AdminIconLink icon={ExternalLink} label="Ouvrir la fiche publique" href="#" />
      </Row>
      <Row label="États">
        <AdminIconButton icon={Ban} label="Bannir" disabled />
        <AdminIconButton icon={Check} label="Enregistrement en cours" busy />
      </Row>
      <Row label="Groupe avec séparateur">
        <AdminActions>
          <AdminIconLink icon={ExternalLink} label="Ouvrir" href="#" />
          <AdminIconButton icon={EyeOff} label="Masquer" />
          <AdminActionsDivider />
          <AdminIconButton icon={Ban} label="Bannir l'auteur" tone="danger" />
          <AdminIconButton icon={Trash2} label="Supprimer" tone="danger" />
        </AdminActions>
      </Row>
      <p className="max-w-md font-sans text-xs text-muted">
        Le libellé n&apos;est pas supprimé, il est déplacé : `aria-label` pour les technologies d&apos;assistance,
        `title` pour l&apos;infobulle au survol. L&apos;infobulle est celle du navigateur — une infobulle maison,
        positionnée en absolu, serait rognée par le défilement horizontal des tableaux.
      </p>
    </div>
  ),
};

export const Statuts: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Row label="Pastilles d'état">
        <AdminStatus tone="ok">Visible</AdminStatus>
        <AdminStatus tone="danger">Masqué</AdminStatus>
        <AdminStatus tone="warn">En attente</AdminStatus>
        <AdminStatus tone="info">Programmé</AdminStatus>
        <AdminStatus tone="neutral">Non ouvert</AdminStatus>
      </Row>
      <Row label="Étiquettes catégorielles">
        <AdminChip>user</AdminChip>
        <AdminChip tone="gold">admin</AdminChip>
        <AdminChip tone="danger">banni</AdminChip>
      </Row>
    </div>
  ),
};

export const Tableau: Story = {
  render: function Render() {
    const [page, setPage] = useState(2);
    return (
      <AdminPanel
        label="Builds communautaires"
        count={87}
        actions={<AdminIconButton icon={ExternalLink} label="Ouvrir la liste complète" />}
        footer={<AdminPager pagination={{ page, pageSize: 12, total: 87, totalPages: 8 }} onChange={setPage} />}
      >
        <AdminTable minWidth="46rem">
          <thead>
            <tr>
              <AdminTh>Build</AdminTh>
              <AdminTh width="9rem">Personnage</AdminTh>
              <AdminTh width="4.5rem" align="right">
                Votes
              </AdminTh>
              <AdminTh width="7rem">Statut</AdminTh>
              <AdminTh width="9rem" align="right">
                Actions
              </AdminTh>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <AdminTr key={row.title} dimmed={row.hidden}>
                <AdminTd>
                  <AdminIdentity primary={row.title} secondary={row.updated} />
                </AdminTd>
                <AdminTd>
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-[0.7rem] text-muted">{row.character}</span>
                    <AdminChip>{row.element}</AdminChip>
                  </span>
                </AdminTd>
                <AdminTd align="right">
                  <span className="font-mono text-[0.78rem] text-gold-bright tabular-nums">{row.votes}</span>
                </AdminTd>
                <AdminTd>
                  {row.hidden ? <AdminStatus tone="danger">Masqué</AdminStatus> : <AdminStatus tone="ok">Visible</AdminStatus>}
                </AdminTd>
                <AdminTd align="right">
                  <AdminActions>
                    <AdminIconLink icon={ExternalLink} label="Ouvrir le build" href="#" />
                    <AdminIconButton icon={row.hidden ? Eye : EyeOff} label={row.hidden ? "Rendre visible" : "Masquer"} />
                    <AdminActionsDivider />
                    <AdminIconButton icon={row.banned ? Undo2 : Ban} label="Bannir l'auteur" tone="danger" />
                    <AdminIconButton icon={Trash2} label="Supprimer" tone="danger" />
                  </AdminActions>
                </AdminTd>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </AdminPanel>
    );
  },
};

export const Recherche: Story = {
  render: function Render() {
    const [value, setValue] = useState("");
    return (
      <div className="max-w-md">
        <AdminSearch
          value={value}
          onChange={setValue}
          placeholder="Filtrer…"
          hint="Le filtre porte sur la page affichée, pas sur toute la base."
        />
        <p className="mt-3 font-sans text-xs text-muted">
          La touche « / » place le curseur dans le champ, sauf si la frappe part déjà d&apos;un champ de saisie.
        </p>
      </div>
    );
  },
};

export const EtatsVides: Story = {
  name: "États vides",
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <AdminPanel label="File de modération">
        <AdminEmpty icon={Check} text="Aucun signalement." />
      </AdminPanel>
      <AdminPanel label="Builds">
        <AdminEmpty icon={Hammer} text="Aucun build." />
      </AdminPanel>
      <AdminPanel label="Chargement" className="md:col-span-2">
        <AdminTableSkeleton rows={4} columns={5} />
      </AdminPanel>
    </div>
  ),
};

export const Permissions: Story = {
  render: () => (
    <AdminPanel label="Comptes" count={3}>
      <AdminTable minWidth="34rem">
        <thead>
          <tr>
            <AdminTh>Compte</AdminTh>
            <AdminTh width="8rem">Rôle</AdminTh>
            <AdminTh width="6.5rem">Statut</AdminTh>
            <AdminTh width="6rem" align="right">
              Actions
            </AdminTh>
          </tr>
        </thead>
        <tbody>
          {USERS.map((user) => (
            <AdminTr key={user.name} dimmed={user.banned}>
              <AdminTd>
                <AdminIdentity primary={user.name} secondary={user.id} />
              </AdminTd>
              <AdminTd>
                <span className="flex items-center gap-1.5">
                  <AdminChip tone={user.role === "admin" ? "gold" : "neutral"}>{user.role}</AdminChip>
                  {user.env ? <AdminChip tone="gold">env</AdminChip> : null}
                </span>
              </AdminTd>
              <AdminTd>
                {user.banned ? <AdminStatus tone="danger">Banni</AdminStatus> : <AdminStatus tone="ok">Actif</AdminStatus>}
              </AdminTd>
              <AdminTd align="right">
                <AdminActions>
                  <AdminIconButton
                    icon={ShieldCheck}
                    label="Promouvoir administrateur"
                    disabled={user.env && user.role === "admin"}
                  />
                  <AdminIconButton
                    icon={user.banned ? Undo2 : Ban}
                    label={user.banned ? "Lever le bannissement" : "Bannir"}
                    tone={user.banned ? "default" : "danger"}
                    disabled={user.env && !user.banned}
                  />
                </AdminActions>
              </AdminTd>
            </AdminTr>
          ))}
        </tbody>
      </AdminTable>
      <p className="border-t border-white/10 px-3 py-2 font-sans text-xs text-muted">
        Un admin déclaré par variable d&apos;environnement ne peut être ni rétrogradé ni banni depuis l&apos;interface :
        les actions correspondantes sont désactivées, pas masquées.
      </p>
    </AdminPanel>
  ),
};

/** Ligne de démonstration avec son intitulé. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-52 shrink-0 font-caps text-[0.56rem] uppercase tracking-[0.16em] text-muted-2">{label}</span>
      {children}
    </div>
  );
}

const ROWS = [
  { title: "Falsi — exécution rapide", character: "char-falu", element: "Fire", votes: 41, updated: "06/09/26", hidden: false, banned: false },
  { title: "Ada full soutien", character: "char-eve", element: "Water", votes: 128, updated: "02/09/26", hidden: false, banned: false },
  { title: "build de test à supprimer", character: "char-lise", element: "Thunder", votes: 0, updated: "28/08/26", hidden: true, banned: true },
];

const USERS = [
  { name: "Kaelis", id: "184023…", role: "user", banned: false, env: false },
  { name: "Vérif locale", id: "local-verif-admin", role: "admin", banned: false, env: true },
  { name: "Vermil", id: "992310…", role: "user", banned: true, env: false },
];
