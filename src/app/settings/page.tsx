import { AppShell } from "@/components/layout/AppShell";
import { CalendarAutomationSetting } from "@/components/settings/CalendarAutomationSetting";
import { Card } from "@/components/ui/card";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let enabled = false;
  if (!isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    enabled = user?.user_metadata.calendar_auto_sync === true;
  }
  return <AppShell activeItem="Settings"><div className="space-y-6"><div><p className="text-sm font-medium text-primary-dark">Settings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Automation</h1></div><Card className="rounded-3xl border-border p-6 shadow-card"><CalendarAutomationSetting initialEnabled={enabled}/></Card></div></AppShell>;
}
