import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DnaElementBadge } from "./ElementBadge";
import { ELEMENT_KEYS } from "./elements";

const meta = {
  title: "DNA/Affichage/ElementBadge",
  component: DnaElementBadge,
  tags: ["autodocs"],
  args: { element: "Thunder", showLabel: true },
  argTypes: { element: { control: "select", options: ELEMENT_KEYS } },
} satisfies Meta<typeof DnaElementBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Unique: Story = { args: { element: "Thunder", showLabel: true } };
export const TousLesElements: Story = {
  render: () => (
    <>
      {ELEMENT_KEYS.map((k) => (
        <DnaElementBadge key={k} element={k} showLabel />
      ))}
    </>
  ),
};
export const AvecIcone: Story = { args: { element: "Fire", showLabel: true, useIcon: true } };
