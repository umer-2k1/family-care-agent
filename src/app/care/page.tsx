import { CareWorkspace } from "@/components/care/CareWorkspace";
import { AppShell } from "@/components/layout/AppShell";
import { getActiveCareDashboard } from "@/server/repositories/care";
import { listFamilyMembers } from "@/server/repositories/family-members";

export const dynamic = "force-dynamic";

export default async function CarePage() {
  const [care, members] = await Promise.all([getActiveCareDashboard(), listFamilyMembers()]);
  return <AppShell activeItem="Care"><CareWorkspace initialCare={care} members={members.map(({ id, name }) => ({ id, name }))}/></AppShell>;
}
