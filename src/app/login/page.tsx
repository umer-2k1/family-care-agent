import { HeartPulse, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md rounded-3xl border-border py-8 shadow-card sm:py-10">
        <CardHeader className="px-8 sm:px-10">
          <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><HeartPulse size={24} /></div>
          <CardDescription className="font-medium text-primary-dark">Care Memory</CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-tight">Care, remembered together.</CardTitle>
          <CardDescription className="mt-1 leading-6">Sign in to keep your family&apos;s health context private and connected.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 sm:px-10">
          <a href={demoMode ? "/" : "/api/auth/google"} className={cn(buttonVariants({ size: "lg" }), "mt-3 w-full rounded-xl py-6 font-semibold")}>Continue with Google</a>
          {demoMode && <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck size={15} /> Local demo mode is on. Google OAuth connects when Supabase is configured.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
