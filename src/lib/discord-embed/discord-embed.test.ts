import { describe, expect, it } from "vitest";
import {
  actionRow,
  container,
  gallery,
  hexToColor,
  linkButton,
  section,
  text,
  thumbnail,
  type ComponentEmbed,
  type LinkButton,
} from "./components";
import { escapeMarkdown, field, maskedLink } from "./markdown";
import { MAX_BYTES, serializeEmbed, validateEmbed } from "./serialize";
import { buildPreviewEmbed } from "./template";

const SITE = "https://dna.example";

describe("buildPreviewEmbed", () => {
  it("produit le gabarit attendu : titre lié, texte, vignette, séparateur, boutons", () => {
    const embed = buildPreviewEmbed({
      title: "Falsi",
      url: `${SITE}/en/characters/falsi`,
      description: "The Ashen Hound",
      lines: [`${field("Element", "Pyro")} · ${field("Weapons", "Dualblade")}`],
      note: "DNA Interactive · Duet Night Abyss",
      thumbnail: `${SITE}/assets/characters/falsi.png`,
      buttons: [
        { label: "Profile", url: `${SITE}/en/characters/falsi` },
        { label: "Builds", url: `${SITE}/en/builds?character=falsi` },
      ],
      accentColor: hexToColor("#e2664a"),
    });

    expect(embed).toEqual({
      component: {
        type: 17,
        accent_color: 0xe2664a,
        components: [
          {
            type: 9,
            components: [
              {
                type: 10,
                content:
                  "## [Falsi](https://dna.example/en/characters/falsi)\n" +
                  "The Ashen Hound\n" +
                  "**Element** Pyro · **Weapons** Dualblade\n" +
                  "-# DNA Interactive · Duet Night Abyss",
              },
            ],
            accessory: { type: 11, media: { url: `${SITE}/assets/characters/falsi.png` } },
          },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 1,
            components: [
              { type: 2, style: 5, url: `${SITE}/en/characters/falsi`, label: "Profile" },
              { type: 2, style: 5, url: `${SITE}/en/builds?character=falsi`, label: "Builds" },
            ],
          },
        ],
      },
    });
    expect(serializeEmbed(embed)).not.toBeNull();
  });

  it("met la grande image dans une galerie quand il n'y a pas de vignette", () => {
    const embed = buildPreviewEmbed({ title: "Map", url: `${SITE}/en/map`, image: `${SITE}/og.png` });
    expect(embed.component.components.map((c) => c.type)).toEqual([10, 12]);
  });

  it("garde cinq boutons au plus", () => {
    const buttons = Array.from({ length: 7 }, (_, i) => ({ label: `B${i}`, url: `${SITE}/${i}` }));
    const embed = buildPreviewEmbed({ title: "Accueil", url: SITE, buttons });
    const row = embed.component.components.find((c) => c.type === 1);
    expect(row?.type === 1 && row.components).toHaveLength(5);
  });
});

describe("escapeMarkdown", () => {
  it("désarme un lien masqué glissé dans un pseudo", () => {
    const pseudo = "[gratuit](https://piege.example)";
    const escaped = escapeMarkdown(pseudo);
    expect(escaped).toBe("\\[gratuit\\]\\(https://piege.example\\)");
    const content = `Build par ${escaped}`;
    // Plus aucune séquence « [texte](url) » non échappée.
    expect(content).not.toMatch(/(^|[^\\])\[[^\]]*\]\(/);
  });

  it("empêche un pseudo de se faire passer pour un titre ou une note", () => {
    expect(escapeMarkdown("Joueur\n# Officiel")).toBe("Joueur \\# Officiel");
    expect(escapeMarkdown("-# faux pied de page")).toBe("\\-\\# faux pied de page");
    expect(escapeMarkdown("a\u2028b\u2029c\r\nd")).toBe("a b c d");
  });

  it("échappe chaque caractère de mise en forme", () => {
    expect(escapeMarkdown("\\*_~`|>#[]()<")).toBe("\\\\\\*\\_\\~\\`\\|\\>\\#\\[\\]\\(\\)\\<");
  });

  it("encode les parenthèses de l'adresse d'un lien masqué", () => {
    expect(maskedLink("Page", "https://dna.example/a_(b)")).toBe("[Page](https://dna.example/a_%28b%29)");
  });
});

describe("serializeEmbed", () => {
  it("rend un JSON que JSON.parse relit à l'identique", () => {
    const embed = buildPreviewEmbed({ title: "Tom & Jerry <3", url: SITE });
    const json = serializeEmbed(embed);
    expect(json).not.toBeNull();
    expect(JSON.parse(json as string)).toEqual(embed);
  });

  it("ne laisse aucun « </script> » sortir du bloc", () => {
    const embed = buildPreviewEmbed({
      title: "</script><script>alert(1)</script>",
      url: SITE,
      description: "fin\u2028de ligne & <b>",
    });
    const json = serializeEmbed(embed) as string;
    expect(json).not.toMatch(/<|>|&|\u2028|\u2029/);
    expect(json).toContain("\\u003c/script");
    expect(JSON.parse(json)).toEqual(embed);

    // Même sans passer par l'échappement markdown du gabarit.
    const raw = container([text("</script><script>alert(1)</script>")]);
    const rawJson = serializeEmbed(raw) as string;
    expect(rawJson).not.toContain("</script>");
    expect(rawJson).toContain("\\u003c/script\\u003e\\u003cscript\\u003e");
    expect(JSON.parse(rawJson)).toEqual(raw);
  });

  it("refuse un bloc de plus de 3 000 octets, échappements comptés", () => {
    const fits = container([text("a".repeat(2900))]);
    expect(serializeEmbed(fits)).not.toBeNull();
    // 600 « < » = 600 caractères, mais 3 600 octets une fois écrits en \u003c.
    const escapedTooBig = container([text("<".repeat(600))]);
    expect(JSON.stringify(escapedTooBig).length).toBeLessThan(MAX_BYTES);
    expect(serializeEmbed(escapedTooBig)).toBeNull();
    expect(serializeEmbed(container([text("é".repeat(1600))]))).toBeNull();
  });

  it("refuse plus de 10 médias de galerie sur l'ensemble du bloc", () => {
    const items = (n: number) => Array.from({ length: n }, (_, i) => ({ url: `${SITE}/${i}.png` }));
    expect(serializeEmbed(container([gallery(items(10))]))).not.toBeNull();
    expect(serializeEmbed(container([gallery(items(6)), gallery(items(5))]))).toBeNull();
  });

  it("refuse une adresse relative ou en javascript:", () => {
    expect(serializeEmbed(container([gallery([{ url: "/assets/og.png" }])]))).toBeNull();
    expect(serializeEmbed(container([actionRow([linkButton("Ouvrir", "javascript:alert(1)")])]))).toBeNull();
    expect(serializeEmbed(container([section([text("x")], thumbnail("relative.png"))]))).toBeNull();
    expect(serializeEmbed(container([gallery([{ url: `${SITE}/${"a".repeat(2050)}.png` }])]))).toBeNull();
  });

  it("refuse plus de cinq boutons dans une rangée", () => {
    const buttons = (n: number) => Array.from({ length: n }, (_, i) => linkButton(`B${i}`, `${SITE}/${i}`));
    expect(serializeEmbed(container([actionRow(buttons(5))]))).not.toBeNull();
    expect(serializeEmbed(container([actionRow(buttons(6))]))).toBeNull();
  });

  it("refuse une clé de bouton hors liste, un style autre que lien, un bouton sans label ni emoji", () => {
    const withKey = { ...linkButton("Ouvrir", SITE), custom_id: "x" } as unknown as LinkButton;
    expect(serializeEmbed(container([actionRow([withKey])]))).toBeNull();
    const primary = { ...linkButton("Ouvrir", SITE), style: 1 } as unknown as LinkButton;
    expect(serializeEmbed(container([actionRow([primary])]))).toBeNull();
    const empty = { type: 2, style: 5, url: SITE } as LinkButton;
    expect(serializeEmbed(container([actionRow([empty])]))).toBeNull();
    expect(serializeEmbed(container([actionRow([{ type: 2, style: 5, url: SITE, emoji: { name: "🗺️" } }])]))).not.toBeNull();
  });

  it("refuse un Container dans un Container, et plus de 40 composants", () => {
    const nested = { component: { type: 17, components: [{ type: 17, components: [text("x")] }] } } as unknown as ComponentEmbed;
    expect(validateEmbed(nested)).toContain("un Container ne peut pas contenir de Container");
    expect(serializeEmbed(nested)).toBeNull();
    // 1 Container + 40 Text Display = 41.
    expect(serializeEmbed(container(Array.from({ length: 40 }, () => text("x"))))).toBeNull();
    expect(serializeEmbed(container(Array.from({ length: 39 }, () => text("x"))))).not.toBeNull();
  });
});
