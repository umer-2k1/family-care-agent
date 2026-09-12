import {
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  HeartPulse,
  Home,
  MessageCircleMore,
  Settings,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { getCaregiverIdentity } from "@/lib/auth/caregiver-identity";
import { isDemoMode } from "@/lib/demo-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type NavigationItem = {
  label: string;
  icon: typeof Home;
  href: string;
};

type AppShellProps = {
  activeItem: string;
  children: ReactNode;
};

const navigationItems: NavigationItem[] = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Family", icon: UsersRound, href: "/family" },
  { label: "Care", icon: HeartPulse, href: "/care" },
  { label: "Memory", icon: BrainCircuit, href: "/memory" },
  { label: "Ask", icon: MessageCircleMore, href: "/ask" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

async function getSidebarIdentity(demoMode: boolean) {
  if (demoMode) return { name: "Demo caregiver", initials: "D", detail: "Demo mode" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getCaregiverIdentity({});

    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const googleName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : undefined;
    return getCaregiverIdentity({ googleName, profileName: profile?.name, email: user.email });
  } catch {
    return getCaregiverIdentity({});
  }
}

export async function AppShell({ activeItem, children }: AppShellProps) {
  const demoMode = isDemoMode();
  const caregiver = await getSidebarIdentity(demoMode);
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-surface px-4 py-6 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary text-white shadow-sm">
            <HeartPulse aria-hidden="true" size={21} strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-semibold tracking-tight">Care Memory</p>
            <p className="text-xs text-muted-foreground">Family health, together</p>
          </div>
        </div>

        <nav aria-label="Primary" className="mt-10 space-y-1">
          {navigationItems.map(({ href, icon: Icon, label }) => {
            const isActive = label === activeItem;

            return (
              <a
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-soft text-primary-dark"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                href={href}
                key={label}
              >
                <Icon aria-hidden="true" size={19} />
                {label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-muted p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#D7B89D] text-sm font-semibold text-[#573B2A]">
              {caregiver.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{caregiver.name}</p>
              <p className="truncate text-xs text-muted-foreground">{caregiver.detail}</p>
            </div>
            <ChevronDown aria-hidden="true" className="ml-auto text-muted-foreground" size={16} />
          </div>
          {demoMode ? <Link className="mt-3 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-center text-xs font-semibold text-muted-foreground" href="/login">Exit demo</Link> : <form action="/api/auth/sign-out" method="post"><button className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground" type="submit">Sign out</button></form>}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-18 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-white">
              <HeartPulse aria-hidden="true" size={18} />
            </div>
            <span className="font-semibold">Care Memory</span>
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">{today}</p>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/care"
              className="grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition hover:text-foreground"
              aria-label="Open care calendar"
            >
              <CalendarDays aria-hidden="true" size={18} />
            </Link>
            <Link href="/"
              className="relative grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition hover:text-foreground"
              aria-label="View care notifications"
            >
              <Bell aria-hidden="true" size={18} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>

      <nav aria-label="Mobile primary" className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-surface px-2 py-2 lg:hidden">
        {navigationItems.map(({ href, icon: Icon, label }) => {
          const isActive = label === activeItem;

          return (
            <a
              className={`flex min-w-13 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium ${
                isActive ? "text-primary-dark" : "text-muted-foreground"
              }`}
              href={href}
              key={label}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
