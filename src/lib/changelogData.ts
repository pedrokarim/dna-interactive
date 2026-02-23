export interface ChangelogEntry {
  date: string;
  version: string;
  type: "feature" | "update" | "fix" | "enhancement" | "security";
  title: string;
  description: string;
  items: string[];
}

export const changelogData: ChangelogEntry[] = [
  {
    date: "2026-02-22",
    version: "1.3.0",
    type: "feature",
    title: "Items: Plans de forge (Drafts) et Armes",
    description:
      "Ajout d'une section complète pour explorer les plans de forge, leurs recettes et les armes associées, avec une navigation plus claire entre catégories.",
    items: [
      "🧩 Nouvelle catégorie Drafts avec grille filtrable, recherche et pagination",
      "🌳 Nouvelle page détail Draft avec visualisation de recette (produit + ingrédients)",
      "🛠️ Extraction et intégration des données de recettes et des données armes",
      "🖼️ Ajout des assets d'icônes (plans, armes, types d'armes, accessoires) côté site",
      "🔗 Liens entre Drafts et fiches armes pour faciliter la navigation",
      "✏️ Correction du libellé de catégorie: Armes / Arm -> Armes / Weapons",
      "📣 Bandeaux de la page d'accueil (map + items) avec fermeture persistante",
      "🎯 Nouvelle carte call-to-action sur l'accueil pour accéder à la page Items",
    ],
  },
  {
    date: "2026-01-10",
    version: "1.2.1",
    type: "feature",
    title: "Nouveaux Marqueurs & Optimisation SEO",
    description:
      "Ajout de nouveaux marqueurs manquants, notamment les Taixu Runes, et migration complète vers l'hébergement local des ressources",
    items: [
      "🆕 Ajout de nouveaux marqueurs manquants dans toutes les maps",
      "✨ Ajout des marqueurs Taixu Runes qui étaient absents",
      "🗺️ Téléchargement et hébergement local de toutes les images de cartes",
      "🎨 Téléchargement et hébergement local de toutes les icônes",
      "🔧 Correction automatique de toutes les URLs externes vers des chemins locaux",
      "✅ 111 URLs corrigées automatiquement dans les maps existantes",
      "💾 Toutes les ressources sont maintenant hébergées localement dans /assets/",
    ],
  },
  {
    date: "2026-01-05",
    version: "1.2.0",
    type: "security",
    title: "Formulaire de Contact Sécurisé avec reCAPTCHA & Zod",
    description:
      "Implémentation complète et sécurisée du formulaire de contact avec protection anti-spam avancée",
    items: [
      "📧 API endpoint complet pour traitement sécurisé des formulaires",
      "🔒 Intégration reCAPTCHA v3 (score ≥0.7) pour protection anti-bot",
      "🛡️ Validation Zod v4.3.5 avec sanitisation automatique et type-safety",
      "📮 Configuration SMTP LWS sécurisée avec emails HTML professionnels",
      "⏱️ Protection DoS : timeout 30s + limite 10KB + rate limiting",
      "🔐 Headers de sécurité complets (XSS, framing, content-type)",
      "✨ UX améliorée : états de chargement, messages d'erreur contextuels",
      "🧹 Sanitisation stricte : regex noms, validation email RFC-compliant",
      "🎯 Enum validation sujets + protection contre injections",
      "📊 Logging détaillé pour monitoring et audit de sécurité",
    ],
  },
  {
    date: "2025-12-24",
    version: "1.1.1",
    type: "enhancement",
    title: "Amélioration des Maps et Transparence",
    description:
      "Ajout des images pour toutes les anciennes maps et nouvelle modal d'informations",
    items: [
      "📸 Ajout de 878 images descriptives pour toutes les anciennes maps",
      "📊 Nouvelle modal d'informations sur les maps avec statistiques détaillées",
      "ℹ️ Affichage de la version, date de mise à jour et statistiques globales",
      "📋 Disclaimer ajouté sur la page d'accueil et dans la modal",
      "🔧 Amélioration du script de mise à jour pour détecter les nouvelles images",
      "✨ Interface améliorée avec informations sur chaque map individuelle",
    ],
  },
  {
    date: "2025-12-24",
    version: "1.1.0",
    type: "feature",
    title: "Version 1.1 - Nouvelle Map Huaxu",
    description:
      "Ajout de la nouvelle map Huaxu avec 371 marqueurs et support des images descriptives",
    items: [
      "🆕 Nouvelle map Huaxu ajoutée (7ème région)",
      "📸 Support des images descriptives pour les marqueurs",
      "🔍 Modal de zoom pour les images avec zoom, rotation et téléchargement",
      "🎨 Bannière de mise à jour animée sur la page d'accueil",
      "👥 Section Communauté avec liens vers Velkaine (Twitch) et Wiki",
      "📋 Mise à jour des codes de rédemption avec gestion des codes expirés",
      "🔧 Scripts automatisés pour mettre à jour les maps depuis boarhat.gg",
    ],
  },
  {
    date: "2025-12-24",
    version: "1.0.1",
    type: "enhancement",
    title: "Amélioration des Codes de Rédemption",
    description:
      "Séparation des codes actifs et expirés avec indicateurs visuels",
    items: [
      "✅ Nouveaux codes actifs affichés en premier",
      "⏰ Badge d'expiration pour les codes avec date limite",
      "❌ Section dédiée pour les codes expirés",
      "🔄 Mise à jour automatique depuis Game8.co",
      "📊 Compteur de codes actifs vs expirés",
    ],
  },
  {
    date: "2025-12-10",
    version: "1.0.0",
    type: "update",
    title: "Mise à jour Next.js",
    description:
      "Migration vers Next.js 16.0.7 pour de meilleures performances",
    items: ["⚡ Next.js 16.0.7", "🚀 Amélioration des performances"],
  },
  {
    date: "2025-12-01",
    version: "0.9.0",
    type: "feature",
    title: "Améliorations de la Carte Interactive",
    description:
      "Nouvelles fonctionnalités pour une meilleure expérience utilisateur",
    items: [
      "📁 Groupement des catégories dans la sidebar",
      "📏 Redimensionnement de la sidebar",
      "💾 Persistance de la sélection de carte",
      "🎨 Styles de scrollbar personnalisés",
      "✨ Animations avec Framer Motion",
    ],
  },
];
