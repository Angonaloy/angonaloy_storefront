const LANDING_PAGE_PATH_RE = /^\/step\/[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function normalizeLandingPagePath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const path = value.trim().split(/[?#]/, 1)[0].replace(/\/+$/, "");
  return path.length <= 120 && LANDING_PAGE_PATH_RE.test(path) ? path : undefined;
}
