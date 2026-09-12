const PUBLIC_EXACT_PATHS = new Set(["/login", "/configuration-error", "/auth/callback", "/api/auth/google", "/api/health"]);

export function isPublicPath(pathname: string) {
  return PUBLIC_EXACT_PATHS.has(pathname) || pathname.startsWith("/_next/") || pathname === "/favicon.ico";
}

export function isAuthorizedCronRequest(pathname: string, authorization: string | null, cronSecret?: string) {
  return Boolean(
    pathname === "/api/cron/proactive"
      && cronSecret
      && authorization === `Bearer ${cronSecret}`,
  );
}
