const PUBLIC_EXACT_PATHS = new Set(["/login", "/configuration-error", "/auth/callback", "/auth/calendar-complete", "/api/auth/google", "/api/health", "/api/webhooks/whatsapp"]);

export function isPublicPath(pathname: string) {
  return PUBLIC_EXACT_PATHS.has(pathname) || pathname.startsWith("/_next/") || pathname === "/favicon.ico";
}

export function isAuthorizedCronRequest(pathname: string, authorization: string | null, cronSecret?: string) {
  return Boolean(
    (pathname === "/api/cron/proactive" || pathname === "/api/cron/whatsapp")
      && cronSecret
      && authorization === `Bearer ${cronSecret}`,
  );
}

export function safeLocalRedirect(value: string | null, fallback = "/") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
