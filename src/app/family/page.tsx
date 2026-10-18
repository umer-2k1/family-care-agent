import { AddMemberForm } from "@/components/family/AddMemberForm";
import { AppShell } from "@/components/layout/AppShell";
import { listFamilyMembers } from "@/server/repositories/family-members";
import { UsersRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const members = await listFamilyMembers();
  return <AppShell activeItem="Family"><div className="pb-20 lg:pb-0"><section className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary-dark">Your care circle</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Family</h1><p className="mt-2 text-sm text-muted-foreground">People who share care, context, and important moments.</p></div><AddMemberForm/></section><article className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-card"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary-dark"><UsersRound size={20}/></div><div><h2 className="font-semibold">Family tree</h2><p className="text-sm text-muted-foreground">Every profile is scoped to your authenticated family workspace.</p></div></div><div className="mt-8 grid gap-4 md:grid-cols-3">{members.map((member) => <a href={`/family/${member.id}`} key={member.id} className="rounded-3xl border border-border p-5 transition hover:border-primary-light"><div className="grid size-12 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-dark">{member.name.slice(0, 1).toUpperCase()}</div><h3 className="mt-5 text-lg font-semibold">{member.name}</h3><p className="text-sm text-muted-foreground">{member.relationship}</p><p className="mt-4 text-sm font-medium text-primary-dark">{member.notes || "Profile ready"}</p></a>)}</div>{members.length === 0 && <p className="mt-8 rounded-2xl bg-muted p-6 text-sm text-muted-foreground">No family members yet. Add the first person you care for.</p>}</article></div></AppShell>;
}
