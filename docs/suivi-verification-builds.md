# Suivi de vérification des builds

**Avancement : 30 / 30 personnages vérifiés.**
Première vérification : 2026-08-20 · dernière : 2026-09-24.

Généré par `node scripts/verif-build.mjs --mark <id> <source>`. Ne pas éditer à la main.

Une vérification couvre : les 8 pièces et leur ordre, le centre, le tableau des
ajustements de piste **case par case**, les armes et leur rang, et l'existence
d'un second build. L'ordre ci-dessous est celui des sorties, du plus récent au
plus ancien.

| # | Personnage | Élément | Sortie | Vérifié le | Source | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mors | Hydro | 2026-09-08 | ✅ 2026-09-24 | 617590 | Conforme case par case : 8 pieces, centre Eveil, 8 Track-Shift, armes identiques. Un seul build sur la fiche. Hydro : non concerne par les nouvelles pieces Pyro de la 1.6. |
| 2 | Mors | Hydro | 2026-09-08 | ✅ 2026-09-24 | 617590 | Conforme case par case : 8 pieces, centre Eveil, 8 Track-Shift, armes identiques. Un seul build sur la fiche. Hydro : non concerne par les nouvelles pieces Pyro de la 1.6. |
| 3 | Falsi | Pyro | 2026-09-08 | ✅ 2026-09-24 | 606751 | Balayage 1.6 : fiche identique a notre build (pieces, centre Tenacite, armes). Utilise deja les pieces 1.6, rien a ajouter. |
| 4 | Eve | Hydro | 2026-07-28 | ✅ 2026-09-24 | 606756 | Ajout des 2 builds de la fiche (Endgame, Debut-milieu). Tableau au format polarites : chaque glyphe correspond a la polarite de sa piece. |
| 5 | Hilda | Pyro | 2026-06-30 | ✅ 2026-09-24 | 562612 | Ajout des 2 variantes 1.6 (centre Raffinement, Ailes-Inspiration-Vigueur case 4). Les builds d'origine, centre Vigilance, sont conserves. |
| 6 | Flora | Umbro | 2026-06-02 | ✅ 2026-08-20 | 602498 | 5 Track-Shift (cases 1-4 et 6) ; Sanguis Sanctus Katana ajoute en 2e melee |
| 7 | Su Yi | Lumino | — | ✅ 2026-08-20 | 570654 | DW et 5 Track-Shift deja conformes ; arme signature Fledgling's Gleam ajoutee (aucun 1er choix a distance) |
| 8 | Kezhou | Lumino | — | ✅ 2026-08-20 | 567201 | 5 Track-Shift (cases 1-5) ; Thorned Requiem en 1er a distance ; Sanguis Sanctus Katana ajoute |
| 9 | Lady Nifle | Lumino | — | ✅ 2026-08-20 | 560805 | 3 Track-Shift (etait 5) ; melee reordonnee ; Flamme De Epuration ajoutee |
| 10 | Lisbell | Lumino | — | ✅ 2026-09-24 | 561246 | Ajout du build d'intron VII (Ardeur-Decision x6, piece Lumino de la 1.6). Compteur de la fiche errone : il annonce 6 modules pour 5 couronnes, lecture visuelle retenue. |
| 11 | Fina | Lumino | — | ✅ 2026-08-20 | 561245 | Support Vigueur : 6 pistes (1,2,3,4,6,8) ; build Roc sans piste, composition a reverifier |
| 12 | Psyche | Anemo | — | ✅ 2026-08-20 | 560797 | endgame 3 TS deja bons ; midgame 4 TS ajoutes ; Thorned Requiem en 1er a distance |
| 13 | Fushu | Hydro | — | ✅ 2026-09-24 | 562197 | Balayage du 24/09 : les 2 builds conformes a la fiche, aucun ecart. Aucune piece Hydro ajoutee par la 1.6. |
| 14 | Truffle and Filbert | Anemo | — | ✅ 2026-09-24 | 560798 | Ajout de la variante Tenacite (Boum-Badaboum, generique 1.6). |
| 15 | Rebecca | Hydro | — | ✅ 2026-09-24 | 560789 | Balayage du 24/09 : les 2 builds conformes a la fiche, aucun ecart. Aucune piece Hydro ajoutee par la 1.6. |
| 16 | Lynn | Pyro | — | ✅ 2026-09-24 | 560793 | Ajout du build endgame 1.6 (centre Raffinement, Ailes-Inspiration-Vigueur). Fiche publique erronee : Blaze-Volition recommande sur 3 cases des 2 builds alors qu'il est Lumino/Anemo/Electro, pas Pyro — remplace par Ardeur-Eternite. |
| 17 | Yuming | Electro | — | ✅ 2026-09-24 | 561640 | Ajout des 2 builds de la fiche (DPS, Soutien et Sub-DPS). Pas d'arme a distance recommandee pour le second. |
| 18 | Zhiliu | Electro | — | ✅ 2026-08-20 | 567185 | arme distance -> Rendhusk ; arme signature : 1 Track-Shift case 1 |
| 19 | Sibylle | Electro | — | ✅ 2026-08-20 | 560801 | pistes posees depuis le tableau HTML |
| 20 | Tabethe | Hydro | — | ✅ 2026-09-24 | 560790 | Balayage du 24/09 : les 2 builds conformes a la fiche, aucun ecart. Aucune piece Hydro ajoutee par la 1.6. |
| 21 | Berenica | Umbro | — | ✅ 2026-09-24 | 560808 | Ajout du build d'intron VII (Debordement-Finesse, generique 1.6). |
| 22 | Phantasio | Umbro | — | ✅ 2026-08-20 | 560807 | pistes posees depuis le tableau HTML |
| 23 | Camilla | Pyro | — | ✅ 2026-09-24 | 570658 | Ajout du build d'intron VII (centre Raffinement, Debordement-Finesse case 6 sans module). |
| 24 | Margie | Pyro | — | ✅ 2026-09-24 | 560796 | Balayage 1.6 : DPS et Support conformes, aucune des 12 nouvelles pieces Pyro sur sa fiche. |
| 25 | Hellfire | Pyro | — | ✅ 2026-09-24 | 560794 | Ajout du build endgame intron VII (centre Raffinement, Nirvana-Decision x2). Tank midgame inchange. |
| 26 | Yale and Oliver | Pyro | — | ✅ 2026-09-24 | 560795 | Balayage 1.6 : build conforme, aucune des 12 nouvelles pieces Pyro. Ecarts limites aux alternatives (Withershade, Dregs of Glimmer). |
| 27 | Outsider | Anemo | — | ✅ 2026-08-20 | 560800 | pistes posees depuis le tableau HTML |
| 28 | Daphne | Anemo | — | ✅ 2026-08-20 | 560799 | pistes posees depuis le tableau HTML |
| 29 | Rhythm | Electro | — | ✅ 2026-09-24 | 560803 | Ajout de Farming et DPS endgame. Le Midgame existant etait deja conforme. |
| 30 | Randy | Electro | — | ✅ 2026-08-20 | 560802 | pistes posees depuis le tableau HTML |

🎉 **Tous les personnages sont vérifiés.**
