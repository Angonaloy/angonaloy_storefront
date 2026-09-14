const LANDING_PAGE_PATH_RE = /^\/step\/[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function normalizeLandingPagePath(pathname: string): string | undefined {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) return undefined;

  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  return path.length <= 120 && LANDING_PAGE_PATH_RE.test(path) ? path : undefined;
}

export function currentLandingPagePath(): string | undefined {
  const pathname = typeof globalThis.location?.pathname === "string"
    ? globalThis.location.pathname
    : "";
  return normalizeLandingPagePath(pathname);
}
