import { AppShell } from "@/components/layout/AppShell";
import { CalendarAutomationSetting } from "@/components/settings/CalendarAutomationSetting";
import { WhatsAppSetting } from "@/components/settings/WhatsAppSetting";
import { Card } from "@/components/ui/card";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let enabled = false;
  let whatsappPhone: string | null = null;
  if (!isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    enabled = user?.user_metadata.calendar_auto_sync === true;
    if (user) {
      const { data } = await (await createSupabaseServerClient()).from("whatsapp_connections").select("phone_e164,status").eq("user_id", user.id).maybeSingle();
      if (data?.status === "connected") whatsappPhone = data.phone_e164;
    }
  }
  return <AppShell activeItem="Settings"><div className="space-y-6"><div><p className="text-sm font-medium text-primary-dark">Settings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Automation</h1></div><Card className="rounded-3xl border-border p-6 shadow-card"><CalendarAutomationSetting initialEnabled={enabled}/></Card><Card className="rounded-3xl border-border p-6 shadow-card"><WhatsAppSetting initialPhone={whatsappPhone}/></Card></div></AppShell>;
}
