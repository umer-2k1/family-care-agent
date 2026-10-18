"use client";

import { Button } from "@/components/ui/button";
import { Check, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SyncState = "idle" | "syncing" | "synced" | "error";

export function CalendarSyncButton({ episodeId, doseCount, hasFollowUp, initiallySynced = false, className }: { episodeId: string; doseCount: number; hasFollowUp: boolean; initiallySynced?: boolean; className?: string }) {
  const [state, setState] = useState<SyncState>(initiallySynced ? "synced" : "idle");
  const [message, setMessage] = useState<string | undefined>(initiallySynced ? `${doseCount} dose events${hasFollowUp ? " and 1 follow-up" : ""} are synchronized.` : undefined);
  const isSynchronized = initiallySynced || state === "synced";

  const sync = useCallback(async () => {
    if (state === "syncing") return;
    setState("syncing");
    setMessage(`Synchronizing ${doseCount} dose events${hasFollowUp ? " and 1 follow-up" : ""}...`);
    try {
      const response = await fetch("/api/calendar/google", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ episodeId }) });
      const body = await response.json() as { error?: string; authorizationUrl?: string; eventCount?: number };
      if (response.status === 409 && body.authorizationUrl) {
        window.open(body.authorizationUrl, "care-memory-google-auth", "popup,width=520,height=720");
        setState("idle");
        setMessage("Complete Google authorization in the popup. Synchronization will resume automatically.");
        return;
      }
      if (!response.ok) throw new Error(body.error ?? "Calendar synchronization failed.");
      setState("synced");
      setMessage(`${doseCount} dose events${hasFollowUp ? " and 1 follow-up" : ""} synchronized.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Calendar synchronization failed.");
    }
  }, [doseCount, episodeId, hasFollowUp, state]);

  useEffect(() => {
    const resume = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === "care-memory-calendar-authorized") void sync();
    };
    window.addEventListener("message", resume);
    return () => window.removeEventListener("message", resume);
  }, [sync]);

  return <div className="space-y-2"><Button type="button" onClick={() => void sync()} disabled={state === "syncing"} className={className}>{state === "syncing" ? <LoaderCircle className="animate-spin"/> : isSynchronized ? <Check/> : null}{state === "syncing" ? "Synchronizing care plan..." : isSynchronized ? "Calendar synchronized" : state === "error" ? "Try Calendar sync again" : "Add care plan to Google Calendar"}</Button>{message && <p aria-live="polite" className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}</div>;
}
