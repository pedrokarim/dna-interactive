import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { DnaVoteButton } from "./VoteButton";

const meta = {
  title: "DNA/Builder/VoteButton",
  component: DnaVoteButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof DnaVoteButton>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Toggle de vote (optimistic UI). */
export const Interactive: Story = { name: "Interactif",
  render: function Render() {
    const [voted, setVoted] = useState(false);
    const base = 42;
    return (
      <DnaVoteButton
        count={base + (voted ? 1 : 0)}
        voted={voted}
        onToggle={setVoted}
      />
    );
  },
};

export const Vote: Story = { args: { count: 128, voted: true } };
export const SignedOut: Story = { name: "Non connecté", args: { count: 17, disabled: true } };
export const ReadOnly: Story = { name: "Lecture seule", args: { count: 256, voted: true, readOnly: true } };
export const Small: Story = { name: "Petit", args: { count: 9, size: "sm" } };
