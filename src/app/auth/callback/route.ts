import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { encryptToken } from "@/lib/security/token-encryption";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=Missing OAuth code", url.origin));
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
    if (data.user && data.session?.provider_token) {
      const { error: connectionError } = await supabase.from("calendar_connections").upsert({ user_id: data.user.id, provider: "google", encrypted_access_token: encryptToken(data.session.provider_token), encrypted_refresh_token: data.session.provider_refresh_token ? encryptToken(data.session.provider_refresh_token) : null, expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (connectionError) throw new Error(`Calendar connection could not be saved: ${connectionError.message}`);
    }
    return NextResponse.redirect(new URL("/", url.origin));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, url.origin));
  }
}
