import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import CharactersGridClient from "@/components/characters/CharactersGridClient";
import CharactersSuspenseFallback from "@/components/characters/CharactersSuspenseFallback";
import { getAllCharacters, getCharactersCatalog } from "@/lib/characters/catalog";

export default async function CharactersPage() {
  const tCharacters = await getTranslations('characters');
  const catalog = getCharactersCatalog();
  const characters = getAllCharacters();

  return (
    <Suspense
      fallback={
        <CharactersSuspenseFallback
          title={tCharacters('loading')}
          description={tCharacters('loadingDescription')}
        />
      }
    >
      <CharactersGridClient catalog={catalog} characters={characters} />
    </Suspense>
  );
}
