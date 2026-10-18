import { AppShell } from "@/components/layout/AppShell";
import { TodayDashboard } from "@/components/home/TodayDashboard";
import { getActiveCareDashboard } from "@/server/repositories/care";

export const dynamic = "force-dynamic";

export default async function Home() { return <AppShell activeItem="Home"><TodayDashboard care={await getActiveCareDashboard()}/></AppShell>; }
