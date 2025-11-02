// Informations générales du site
export const SITE_CONFIG = {
  name: "DNA Interactive",
  tagline: "Interactive Map & Resources",
  description: "Carte interactive et ressources pour Duet Night Abyss",
  keywords: [
    "Duet Night Abyss",
    "carte interactive",
    "gaming",
    "exploration",
    "marqueurs",
    "collectibles",
    "carte du jeu",
    "DNA Interactive",
  ],
} as const;

// Informations de contact et liens externes
export const CONTACT_INFO = {
  email: "contact@ascencia.re",
  discord: {
    url: "https://discord.gg/rTd95UpUEb",
    label: "Rejoindre le Discord",
  },
  ascencia: {
    url: "https://ascencia.re/",
    label: "Ascencia",
  },
} as const;

// Informations sur le créateur
export const CREATOR_INFO = {
  name: "Ahmed Karim",
  nickname: "PedroKarim",
  fullName: "Ahmed Karim aka PedroKarim",
} as const;

// Informations légales et copyrights
export const LEGAL_INFO = {
  copyright: `© 2025 ${SITE_CONFIG.name}. Créé par ${CREATOR_INFO.fullName} avec ❤️`,
  disclaimer:
    "Ce site n'est pas affilié ou lié au créateur du jeu Duet Night Abyss.",
  ascenciaCredit: `Ascencia`,
} as const;

// Informations sur le jeu
export const GAME_INFO = {
  name: "Duet Night Abyss",
  description:
    "Duet Night Abyss est un jeu d'aventure captivant qui vous transporte dans un monde mystérieux rempli de secrets, de créatures étranges et de trésors cachés.",
  mapDescription:
    "Notre carte interactive vous aide à naviguer dans cet univers complexe, à suivre votre progression et à découvrir tous les éléments cachés qui font la richesse de ce jeu exceptionnel.",
} as const;

// Chemins des assets
export const ASSETS_PATHS = {
  logo: "/assets/ui/duet-logo-white.png",
  worldview: [
    "/assets/worldview/worldview-1.webp",
    "/assets/worldview/worldview-2.webp",
    "/assets/worldview/worldview-3.webp",
    "/assets/worldview/worldview-4.webp",
    "/assets/worldview/worldview-5.webp",
    "/assets/worldview/worldview-6.webp",
  ],
} as const;

// Navigation
export const NAVIGATION = {
  home: "/",
  map: "/map",
  codes: "/codes",
  about: "/about",
  support: "/support",
  contact: "/contact",
} as const;

// Liens de navigation principaux
export const NAV_LINKS = [
  { href: NAVIGATION.map, label: "Carte Interactive" },
  { href: NAVIGATION.codes, label: "Codes de Rédemption" },
  { href: NAVIGATION.about, label: "À propos" },
  { href: NAVIGATION.support, label: "Support" },
  { href: NAVIGATION.contact, label: "Contact" },
] as const;

// Liens du footer
export const FOOTER_LINKS = [
  { href: NAVIGATION.map, label: "Carte Interactive" },
  { href: NAVIGATION.codes, label: "Codes de Rédemption" },
  { href: NAVIGATION.about, label: "À propos" },
  { href: NAVIGATION.support, label: "Support" },
  { href: NAVIGATION.contact, label: "Contact" },
] as const;

// Informations de support
export const SUPPORT_INFO = {
  responseTime: "Nous répondons généralement sous 24-48h",
  channels: [
    {
      name: "Discord",
      description:
        "Assistance technique en temps réel, discussions avec la communauté, annonces de mises à jour",
      url: CONTACT_INFO.discord.url,
      icon: "discord",
    },
    {
      name: "Email",
      description:
        "Pour les bugs détaillés, suggestions d'amélioration, demandes complexes",
      url: `mailto:${CONTACT_INFO.email}`,
      icon: "email",
    },
  ],
} as const;

// Informations sur l'équipe
export const TEAM_INFO = {
  members: [
    {
      name: CREATOR_INFO.name,
      nickname: CREATOR_INFO.nickname,
      role: "Développeur & Créateur du projet",
      description:
        "Passionné de développement web et de gaming, Ahmed Karim (PedroKarim) a créé DNA Interactive pour aider la communauté des joueurs de Duet Night Abyss à mieux explorer cet univers fascinant. Le projet évolue constamment grâce aux retours et suggestions de la communauté.",
    },
  ],
} as const;

// Statistiques du projet
export const PROJECT_STATS = {
  regions: 6,
  features: [
    "Carte Interactive Complète",
    "Système de Marqueurs",
    "Filtres Avancés",
    "Interface Responsive",
    "Fait avec Passion",
    "Continuellement Mis à Jour",
  ],
} as const;

// Questions fréquentes
export const FAQ_ITEMS = [
  {
    question: "Comment utiliser la carte interactive ?",
    answer:
      "La carte est intuitive : zoomez avec la molette, cliquez sur les marqueurs pour voir les détails. Utilisez le menu latéral pour filtrer les catégories.",
  },
  {
    question: "Les données sont-elles à jour ?",
    answer:
      "Nous nous efforçons de maintenir les données à jour. Si vous trouvez des informations incorrectes, signalez-les via Discord ou email.",
  },
  {
    question: "Puis-je contribuer au projet ?",
    answer:
      "Absolument ! Contactez-nous sur Discord pour discuter des contributions possibles, qu'elles soient techniques ou liées au contenu.",
  },
  {
    question: "Le site fonctionne-t-il sur mobile ?",
    answer:
      "Oui, le site est responsive et fonctionne sur tous les appareils. Cependant, l'expérience optimale reste sur ordinateur.",
  },
] as const;

// Liens rapides du support
export const SUPPORT_QUICK_LINKS = [
  {
    href: CONTACT_INFO.ascencia.url,
    label: "Ascencia",
    description: "Site officiel du studio",
  },
  {
    href: NAVIGATION.contact,
    label: "Contact",
    description: "Formulaire de contact",
  },
  {
    href: NAVIGATION.about,
    label: "À propos",
    description: "En savoir plus sur nous",
  },
] as const;
