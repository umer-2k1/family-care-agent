import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeLocalRedirect } from "@/lib/auth/routing";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("next", safeLocalRedirect(requestUrl.searchParams.get("next")));
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString(), scopes: "openid email profile https://www.googleapis.com/auth/calendar.events", queryParams: { access_type: "offline", prompt: "consent" } },
    });
    if (error || !data.url) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error?.message ?? "OAuth could not start")}`, origin));
    return NextResponse.redirect(data.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase is not configured";
    return NextResponse.redirect(new URL(`/configuration-error?error=${encodeURIComponent(message)}`, request.url));
  }
}
