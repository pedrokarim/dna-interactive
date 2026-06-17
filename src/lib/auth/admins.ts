function configuredAdminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_DISCORD_IDS ?? "")
      .split(/[,\s;]+/)
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export function isConfiguredAdminDiscordId(discordId: string | null | undefined): boolean {
  return Boolean(discordId && configuredAdminIds().has(discordId));
}
