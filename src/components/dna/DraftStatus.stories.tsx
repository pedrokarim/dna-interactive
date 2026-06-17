import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaDraftStatus } from "./DraftStatus";

const meta = {
  title: "DNA/Builder/DraftStatus",
  component: DnaDraftStatus,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof DnaDraftStatus>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Tous: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <DnaDraftStatus state="idle" />
      <DnaDraftStatus state="dirty" />
      <DnaDraftStatus state="saving" />
      <DnaDraftStatus state="saved" savedAt="14:32" />
      <DnaDraftStatus state="error" />
    </div>
  ),
};

export const Enregistre: Story = { args: { state: "saved", savedAt: "14:32" } };
export const Modifie: Story = { args: { state: "dirty" } };
