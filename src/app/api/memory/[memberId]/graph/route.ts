import { getMemberMemoryGraph } from "@/server/services/member-memory-graph";

export async function GET(_: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  try {
    return Response.json(await getMemberMemoryGraph(memberId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memory graph could not be loaded.";
    return Response.json({ error: message }, { status: message === "Family member not found." ? 404 : 500 });
  }
}
