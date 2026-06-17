export function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; cause?: unknown; message?: unknown };
  if (candidate.code === "42P01") return true;
  if (typeof candidate.message === "string" && candidate.message.includes("relation") && candidate.message.includes("does not exist")) {
    return true;
  }

  return isMissingTableError(candidate.cause);
}
