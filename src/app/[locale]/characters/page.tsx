import { Suspense } from "react";
import CharactersGridClient from "@/components/characters/CharactersGridClient";
import CharactersSuspenseFallback from "@/components/characters/CharactersSuspenseFallback";
import { getAllCharacters, getCharactersCatalog } from "@/lib/characters/catalog";

export default function CharactersPage() {
  const catalog = getCharactersCatalog();
  const characters = getAllCharacters();

  return (
    <Suspense
      fallback={
        <CharactersSuspenseFallback
          title="Chargement des personnages"
          description="Initialisation des filtres, tri et pagination."
        />
      }
    >
      <CharactersGridClient catalog={catalog} characters={characters} />
    </Suspense>
  );
}
