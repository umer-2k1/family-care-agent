"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function WhatsAppSetting({ initialPhone }: { initialPhone: string | null }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [connected, setConnected] = useState(Boolean(initialPhone));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  async function connect() { setPending(true); setMessage(undefined); const response = await fetch("/api/settings/whatsapp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) }); const body = await response.json() as { error?: string }; setPending(false); if (!response.ok) return setMessage(body.error ?? "Unable to connect WhatsApp."); setConnected(true); setMessage("Greeting sent from the Meta test number."); }
  async function disconnect() { setPending(true); const response = await fetch("/api/settings/whatsapp", { method: "DELETE" }); setPending(false); if (!response.ok) return setMessage("Unable to disconnect WhatsApp."); setConnected(false); setMessage("WhatsApp disconnected and pending reminders cancelled."); }
  async function send(kind: "pre_dose" | "overdue_followup") { setPending(true); setMessage(undefined); const response = await fetch("/api/settings/whatsapp/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) }); const body = await response.json() as { error?: string }; setPending(false); setMessage(response.ok ? (kind === "pre_dose" ? "Medication reminder sent." : "Overdue follow-up sent.") : (body.error ?? "Unable to send test message.")); }
  return <div className="flex flex-col gap-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold">WhatsApp demo connection</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Connect your Meta allowlisted test number to receive real medication reminders and reply from WhatsApp.</p>{message && <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">{message}</p>}</div><div className="flex w-full max-w-sm gap-2"><Input aria-label="WhatsApp number" value={phone} disabled={pending || connected} onChange={(event) => setPhone(event.target.value)} placeholder="+923001234567"/><Button onClick={() => void (connected ? disconnect() : connect())} disabled={pending || (!connected && !phone)} className="shrink-0">{pending ? "Working..." : connected ? "Disconnect" : "Connect WhatsApp"}</Button></div></div>{connected && <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={pending} onClick={() => void send("pre_dose")}>Send test reminder</Button><Button variant="secondary" disabled={pending} onClick={() => void send("overdue_followup")}>Send test follow-up</Button></div>}</div>;
}
