import {
  Sparkles,
  Map,
  Code,
  CheckCircle,
  Mail,
  LucideIcon,
} from "lucide-react";

export const typeConfig = {
  feature: {
    icon: Sparkles,
    color: "from-green-500 to-emerald-500",
    borderColor: "border-green-500/30",
    bgColor: "bg-green-500/10",
    label: "Nouvelle Fonctionnalité",
  },
  security: {
    icon: Mail,
    color: "from-red-500 to-pink-500",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/10",
    label: "Sécurité",
  },
  update: {
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    label: "Mise à Jour",
  },
  fix: {
    icon: CheckCircle,
    color: "from-orange-500 to-red-500",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/10",
    label: "Correction",
  },
  enhancement: {
    icon: Map,
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    label: "Amélioration",
  },
} as const;
