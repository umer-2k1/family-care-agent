import { AssistantDemo } from "@/components/chat/AssistantDemo";
import { AppShell } from "@/components/layout/AppShell";
import { getActiveCareDashboard } from "@/server/repositories/care";

export const dynamic = "force-dynamic";

export default async function AskPage() {
  const care = await getActiveCareDashboard();
  const scope = care ? `${care.memberName}'s active episode` : "your family's care";
  return <AppShell activeItem="Ask"><div className="pb-20 lg:pb-0"><p className="text-sm font-medium text-primary-dark">Family-aware assistant</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Ask Care Memory</h1><p className="mt-2 mb-7 text-sm text-muted-foreground">Updates are scoped to {scope} and can create deterministic care actions.</p><AssistantDemo memberName={care?.memberName ?? null}/></div></AppShell>;
}
