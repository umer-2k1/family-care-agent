"use client";

import { useState } from "react";

export function CalendarAutomationSetting({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setMessage(undefined);
    const response = await fetch("/api/settings/calendar", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: next }) });
    const body = await response.json() as { error?: string };
    if (response.ok) { setEnabled(next); setMessage(`Automatic Calendar integration ${next ? "enabled" : "disabled"}.`); }
    else setMessage(body.error ?? "Unable to update the setting.");
    setSaving(false);
  }

  return <div className="flex items-start justify-between gap-6"><div><h2 className="font-semibold">Automatic Google Calendar integration</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">When enabled, complete high-confidence medication courses are confirmed and synchronized after upload. Uncertain or incomplete reports still require review.</p>{message && <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">{message}</p>}</div><button type="button" role="switch" aria-checked={enabled} aria-label="Automatic Google Calendar integration" disabled={saving} onClick={() => void toggle()} className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`}/></button></div>;
}
