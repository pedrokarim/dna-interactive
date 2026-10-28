import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/fr.json";
import { ReportFollowUpDialog } from "./ReportFollowUpDialog";

const meta = {
  title: "Admin/ReportFollowUpDialog",
  component: ReportFollowUpDialog,
  parameters: { layout: "fullscreen" },
  // DnaDialog lit ses libellés (bouton fermer) via next-intl.
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
  args: {
    status: "resolved",
    report: { buildTitle: "Daphne Anemo Sub-DPS Azoth", reporterName: "Snake_eyes56", reporterHasEmail: true },
    onCancel: () => {},
    onDecide: () => {},
  },
} satisfies Meta<typeof ReportFollowUpDialog>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Resolve: Story = {};

export const Dismiss: Story = { args: { status: "dismissed" } };

/** Compte sans adresse (connexion Discord seule) : l'envoi est impossible. */
export const NoEmail: Story = {
  args: { report: { buildTitle: "Daphne Anemo Sub-DPS Azoth", reporterName: "Snake_eyes56", reporterHasEmail: false } },
};

/** Titre et pseudo très longs : rien ne doit sortir de la fenêtre. */
export const LongValues: Story = {
  args: {
    report: {
      buildTitle: "Outsider Anemo Crossbow Crit Multishot Endgame Sans Consonance Version Longue",
      reporterName: "Un_pseudo_extrêmement_long_sans_aucune_espace_pour_tester_la_coupure",
      reporterHasEmail: true,
    },
  },
};
