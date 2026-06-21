// Design system DNA — barrel. Importez depuis "@/components/dna".
export { cn } from "./cn";
export * from "./elements";

// Contrôles
export { DnaButton } from "./Button";
export { DnaChip } from "./Chip";
export { DnaField } from "./Field";
export { DnaKey } from "./KeyCap";
export { DnaSwitch } from "./Switch";
export { DnaStepper } from "./Stepper";
export { DnaSegmented } from "./Segmented";
export { DnaTabs } from "./Tabs";
export { DnaTooltip } from "./Tooltip";

// Affichage
export { DnaTag } from "./Tag";
export { DnaPill } from "./Pill";
export { DnaElementBadge } from "./ElementBadge";
export { DnaStars } from "./RarityStars";
export { DnaAvatar } from "./Avatar";
export { DnaNouveau, DnaNotifDot } from "./Badges";

// Conteneurs & ornements
export { DnaPanel } from "./Panel";
export { DnaCrest } from "./Crest";
export { DnaCornerBrackets } from "./CornerBrackets";
export { DnaRibbon } from "./Ribbon";
export { DnaAccordion } from "./Accordion";
export { DnaSectionLabel } from "./SectionLabel";
export { DnaDivider } from "./Divider";
export { DnaSeal } from "./Seal";
export { DnaTile } from "./Tile";

// Builder
export { DnaItemPicker, type DnaPickerItem } from "./ItemPicker";
export { DnaDemonWedgeEditor, type WedgeSlotData } from "./DemonWedgeEditor";
export { DnaConsonanceEditor } from "./ConsonanceEditor";
export { DnaSlotRow, type SlotEntry } from "./SlotRow";
export { DnaPriorityList, type PriorityItem } from "./PriorityList";
export { DnaVoteButton } from "./VoteButton";
export { DnaCommunityBuildCard } from "./CommunityBuildCard";
export { DnaCommunityBuildBannerCard } from "./CommunityBuildBannerCard";
export { DnaDraftStatus, type DraftState } from "./DraftStatus";

// Données
export { DnaStatRow } from "./StatRow";
export { DnaProgress } from "./ProgressBar";
export { DnaLabeledBar } from "./LabeledBar";
export { DnaReward, DnaRewardsGrid } from "./RewardsGrid";

// Cartes
export { DnaCharacterCard } from "./CharacterCard";

// Dialogues / modales
export { DnaDialog, DnaConfirmDialog, type DnaDialogProps, type DnaConfirmDialogProps } from "./Dialog";
export { ConfirmProvider, useConfirm } from "./ConfirmProvider";
export { useDialogA11y } from "./useDialogA11y";
