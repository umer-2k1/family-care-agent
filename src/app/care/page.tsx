import { CareWorkspace } from "@/components/care/CareWorkspace";
import { AppShell } from "@/components/layout/AppShell";
import { getActiveCareDashboards } from "@/server/repositories/care";
import { listFamilyMembers } from "@/server/repositories/family-members";

export const dynamic = "force-dynamic";

export default async function CarePage() {
  const [careEpisodes, members] = await Promise.all([getActiveCareDashboards(), listFamilyMembers()]);
  const memberOptions = members.map(({ id, name }) => ({ id, name }));
  return <AppShell activeItem="Care"><div className="space-y-10">{careEpisodes.length > 1 && <div><p className="text-sm font-medium text-primary-dark">Care workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Active care plans</h1><p className="mt-2 text-sm text-muted-foreground">Each medication course is tracked independently for your family.</p></div>}{careEpisodes.length ? careEpisodes.map((care, index) => <CareWorkspace key={care.episodeId} initialCare={care} members={memberOptions} showUploadControls={index === 0}/>) : <CareWorkspace initialCare={null} members={memberOptions}/>}</div></AppShell>;
}
