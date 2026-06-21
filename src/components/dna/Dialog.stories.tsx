import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaDialog, DnaConfirmDialog } from "./Dialog";
import { DnaButton } from "./Button";

const meta = {
  title: "DNA/Dialog",
  component: DnaConfirmDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof DnaConfirmDialog>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Confirmation: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [result, setResult] = useState<string>("");
    return (
      <div className="flex flex-col items-start gap-3">
        <DnaButton onClick={() => setOpen(true)}>Ouvrir la confirmation</DnaButton>
        {result ? <p className="font-sans text-sm text-parch">Résultat : {result}</p> : null}
        <DnaConfirmDialog
          open={open}
          title="Supprimer le build"
          message="Supprimer définitivement « Yuming Electro Burst » ? Cette action est irréversible."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          danger
          onConfirm={() => {
            setResult("confirmé");
            setOpen(false);
          }}
          onCancel={() => {
            setResult("annulé");
            setOpen(false);
          }}
        />
      </div>
    );
  },
};

export const Alerte: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-start gap-3">
        <DnaButton onClick={() => setOpen(true)}>Ouvrir l'alerte</DnaButton>
        <DnaConfirmDialog
          open={open}
          title="Import"
          message="Format de fichier invalide."
          confirmLabel="Fermer"
          showCancel={false}
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </div>
    );
  },
};

export const ModaleLibre: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-start gap-3">
        <DnaButton variant="gold" onClick={() => setOpen(true)}>
          Ouvrir la modale
        </DnaButton>
        <DnaDialog
          open={open}
          onClose={() => setOpen(false)}
          title="Détails du build"
          footer={
            <DnaButton variant="gold" onClick={() => setOpen(false)}>
              Fermer
            </DnaButton>
          }
        >
          Contenu libre de la modale (coque réutilisable du design system).
        </DnaDialog>
      </div>
    );
  },
};
