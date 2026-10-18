import { CircleAlert } from "lucide-react";

export default function ConfigurationErrorPage() {
  return <main className="grid min-h-screen place-items-center bg-background p-6"><section className="max-w-lg rounded-3xl border border-border bg-surface p-8 shadow-card"><CircleAlert className="text-primary-dark"/><h1 className="mt-5 text-2xl font-semibold">Configuration required</h1><p className="mt-3 leading-6 text-muted-foreground">Production mode is enabled, but Supabase is not configured. Add the public Supabase URL and anonymous key to the server environment, then restart the application.</p><p className="mt-4 rounded-xl bg-muted p-3 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL<br/>NEXT_PUBLIC_SUPABASE_ANON_KEY</p></section></main>;
}
