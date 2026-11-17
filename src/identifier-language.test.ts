/**
 * Les noms du code sont en anglais : variables, fonctions, types, props, stories.
 * Seuls les textes affichés et les commentaires sont en français.
 *
 * Ce test lit tous les fichiers de src et échoue dès qu'un nom déclaré contient un mot
 * français de la liste ci-dessous. Il a été ajouté après un nettoyage de 111 noms
 * (`demarrerAnalytics`, `CHEMINS_EXCLUS`, `DnaNouveau`, stories `Primaire`…).
 * Un mot français utile qui manque : l'ajouter à FRENCH_WORDS.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/** Mots français qui n'existent pas en anglais (sans accents, en minuscules). */
const FRENCH_WORDS = new Set(
  `
  abonne abonnes abonner accepter ajouter afficher ancien apercu apres arme armes attente aucun auteur avant avec
  banniere barre biseau butin cadre calcul calculer carte cartes categorie chapeau chargement charger chemin chemins
  choix classement communaute competence competences confidentialite connecte couleur couleurs cramoisi debut delai
  demarrer derniere dernier desactive differee differer discret donnee donnees dossier droite duree echelle ecran
  ecrire emplacements enregistre enregistrer entete equipe etat etats etoiles evenement evenements exclus fenetre
  ferme fiche fichier fichiers filet filtre filtres filtrer frise gauche grille hauteur heure heures icone identite
  incise interactif jeu joueur joueurs jouer jour jours langue largeur lecture libelle libelles libre lien liens
  ligne lignes lire liste listes manche mandat marque masquer minuteur modale moyenne niveau niveaux nombre nouveau
  nouvelle noyau objet objets obtenir officiel onglet onglets ordinaire ouvert paire personnage personnages petit
  planificateur pleins precedent precedente prefixe premier pret prevenir primaire prix rarete raretes recherche
  recompense recompenses refuser refusee repli restant resultat resultats retirer rond sauvegarder sceau secondaire
  selectionnee semaine separateur serie seule signalement somme suivant suivre supprimer survol tableau taille teinte
  telemetrie texte textes titre titres tous toutes touche traduction tuile utilisateur utilises valeur valeurs
  verifier vide vides
  `
    .split(/\s+/)
    .filter(Boolean),
);

/**
 * Noms français voulus. Les catégories du calendrier sont des valeurs stockées en base
 * et affichées telles quelles (`EventCategory`) : les renommer demanderait une migration.
 */
const ALLOWED = new Set(["Bannière", "Arme", "Événement", "Épreuve", "Récompense"]);

function words(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z]+/)
    .map((word) => word.toLowerCase())
    .filter(Boolean);
}

function declaredNames(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const names: string[] = [];
  const visit = (node: ts.Node) => {
    const declaration =
      ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node) ||
      ts.isEnumMember(node) || ts.isParameter(node) || ts.isPropertySignature(node) ||
      ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node) || ts.isPropertyAssignment(node) ||
      ts.isBindingElement(node) || ts.isImportSpecifier(node) || ts.isExportSpecifier(node);
    if (declaration && node.name && ts.isIdentifier(node.name)) names.push(node.name.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

describe("noms du code", () => {
  it("sont en anglais", () => {
    const files = execFileSync("git", ["ls-files", "src/**/*.ts", "src/**/*.tsx"], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
    const offenders: string[] = [];
    for (const file of files) {
      for (const name of declaredNames(file)) {
        if (ALLOWED.has(name)) continue;
        const french = words(name).filter((word) => FRENCH_WORDS.has(word));
        if (french.length > 0) offenders.push(`${file} : ${name} (${french.join(", ")})`);
      }
    }
    expect(offenders).toEqual([]);
  }, 60_000);
});
