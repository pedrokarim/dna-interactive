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
    date: "2026-04-15",
    version: "1.9.0",
    type: "feature",
    title: "Cartes de build, onglet Compétences et tooltips curseur",
    description:
      "Nouvel onglet Compétences par personnage avec slider de niveau, cartes de build exportables en PNG, et un système de tooltips qui suit le curseur sur desktop.",
    items: [
      "🎴 Nouvelle carte de build partageable (modale + accordéon ?build=true) avec portrait feathered, layout Demon Wedge in-game et téléchargement PNG",
      "🃏 Showcase de la carte de build sur la home (Psyche) avec ancre #build-showcase et teaser dans la hero banner",
      "⚔️ Onglet Compétences complet : nom, description, paramètres, sections, termes de combat, en 7 langues",
      "🎚️ Slider de niveau de compétence (1-20) qui recalcule en direct les valeurs dépendantes du niveau via SkillGrow",
      "🧩 Icônes de compétence en ligne et équipe recommandée dans la carte de build",
      "🪄 Nouveau composant CursorTooltip : suit le curseur sur desktop, click-to-toggle sur mobile, portalisé dans body",
      "🛡️ Tooltips curseur sur armes, Génimons et slots Demon Wedge (centre inclus) de la carte de build",
      "🏷️ Pipeline d'extraction extract-skills.ts : parse 9 fichiers Lua + SkillGrow, formules #N évaluées pour chaque niveau",
    ],
  },
  {
    date: "2026-04-08",
    version: "1.8.0",
    type: "feature",
    title: "Internationalisation, showcase personnages et deep-linking map",
    description:
      "Refonte majeure avec support multilingue complet (7 langues), nouveau showcase interactif des personnages v1.3, et navigation améliorée.",
    items: [
      "🌐 Internationalisation complète du site avec next-intl : 7 langues (FR, EN, DE, ES, JP, KR, TC)",
      "🔍 Détection automatique de la langue du navigateur avec persistance du choix par cookie",
      "🗂️ Routing i18n : chaque langue a ses propres URLs (/fr/map, /en/characters, etc.)",
      "🌏 Sélecteur de langue dans toutes les pages du site",
      "🎭 Nouveau showcase interactif des personnages v1.3 sur la page d'accueil (Su Yi, Camilla, Yuming, Zhiliu)",
      "🖼️ Artwork plein écran avec sélecteur d'avatars, dégradés par personnage et caractères calligraphiques décoratifs",
      "🔗 Deep-linking map : le bandeau Haojing redirige directement vers la bonne carte (?mapId=haojing)",
      "📐 Fix du wrap des liens dans la sidebar de la carte",
      "🖼️ Image v1.3 ajoutée au Ken Burns du hero banner",
      "⚡ Fix turbopack.root pour accélérer la compilation dev",
      "🏷️ SEO : balises hreflang, metadata localisée, sitemap multi-locale",
    ],
  },
  {
    date: "2026-04-08",
    version: "1.7.0",
    type: "feature",
    title: "Mise a jour v1.3 du jeu et variantes Genimons",
    description:
      "Re-extraction complete des donnees du jeu depuis la version 1.3, ajout de nouveaux personnages et systeme de variantes pour les Genimons.",
    items: [
      "🔄 Re-extraction des 1176 fichiers Lua depuis les paks v1.3 du jeu",
      "👤 Ajout de Su Yi (complete avec portraits et skills) et Flora (donnees, pas encore sortie)",
      "🎭 Completion de Camilla (stats, traductions, portraits, skills)",
      "🐾 Systeme de variantes Genimons : chaque espece affiche ses variantes avec navigation croisee",
      "✨ Badge Premium dore pour les variantes shiny des Genimons",
      "🎣 Nouveaux poissons de la region Est (Haojing) ajoutes",
      "📦 Mise a jour de tous les items, mods et ressources avec les donnees v1.3",
      "🌐 Correction des traductions espagnoles (Hyperboreano → Hiporboreo)",
    ],
  },
  {
    date: "2026-04-07",
    version: "1.6.0",
    type: "feature",
    title: "Nouvelle Map Haojing (Patch 1.3)",
    description:
      "Ajout de la map Haojing avec 143 marqueurs et optimisation majeure du chargement des données cartographiques.",
    items: [
      "🗺️ Nouvelle map Haojing ajoutée (8e region) avec 143 marqueurs et 6 categories",
      "⚡ Refonte du systeme de donnees : chargement par map a la demande au lieu d'un fichier monolithique",
      "📦 Reduction du payload initial de ~75% (54KB index + 1 map au lieu de 439KB)",
      "🔧 Correction du parser boarhat.gg pour gerer les noms avec guillemets",
      "🏠 Nouveau bandeau v1.3 sur la page d'accueil pour Haojing",
    ],
  },
  {
    date: "2026-03-21",
    version: "1.5.0",
    type: "feature",
    title: "Builds de Personnages",
    description:
      "Systeme complet de builds recommandes pour les 22 personnages jouables, avec armes de consonance et ajustements de piste.",
    items: [
      "🎮 21 builds de personnages ajoutes avec equipements et Demon Wedges recommandes",
      "⚔️ Extraction et affichage des armes de consonance depuis les donnees du jeu",
      "🎚️ Ajustements de piste (Track Adjustments) avec toggle et icones",
      "🎨 Redesign de l'onglet Intron avec cercles flottants et priorite de competences",
      "🌈 Gradient ambiant par element sur les pages de detail personnage",
      "🖼️ Icones de competences dans l'onglet attributs",
      "💡 Tooltips enrichis pour les equipements de build",
    ],
  },
  {
    date: "2026-02-23",
    version: "1.4.0",
    type: "feature",
    title: "Catalogue Personnages et Peche",
    description:
      "Ajout du catalogue complet des personnages jouables avec statistiques detaillees et de la categorie Peche dans les items.",
    items: [
      "👤 Catalogue de tous les personnages jouables avec fiche detaillee",
      "📊 Statistiques par niveau avec courbes de croissance et formules",
      "🎣 Nouvelle categorie Peche avec items extraits des donnees du jeu",
      "🐾 Correction des valeurs dynamiques des passifs Genimons",
      "🌐 Labels de cles de texte contextualises par categorie d'item",
    ],
  },
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
