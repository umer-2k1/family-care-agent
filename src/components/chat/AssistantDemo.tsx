"use client";

import { Mic, Send, Sparkles, Volume2 } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Message = { role: "assistant" | "user"; text: string };
const initial: Message[] = [{ role: "assistant", text: "I have Emma's active care plan in context. You can ask about her medicine, report an update, or request a doctor summary." }];

export function AssistantDemo() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [threadId] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const submit = async (event: FormEvent) => { event.preventDefault(); const value = input.trim(); if (!value || pending) return; setMessages((current) => [...current, { role: "user", text: value }]); setInput(""); setPending(true); const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: value, threadId }) }); const body = await response.json() as { response?: string; error?: string }; const reply = body.response ?? body.error ?? "The assistant could not respond."; setMessages((current) => [...current, { role: "assistant", text: reply }]); setPending(false); if (speaking && "speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply)); };
  const toggleRecording = async () => {
    if (recorderRef.current && recording) { recorderRef.current.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream); chunksRef.current = []; recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => { setRecording(false); stream.getTracks().forEach((track) => track.stop()); setPending(true); const file = new File(chunksRef.current, "care-message.webm", { type: recorder.mimeType || "audio/webm" }); const form = new FormData(); form.set("audio", file); form.set("threadId", threadId); const response = await fetch("/api/voice", { method: "POST", body: form }); const body = await response.json() as { transcript?: string; response?: string; error?: string }; if (body.transcript) setMessages((current) => [...current, { role: "user", text: body.transcript as string }]); setMessages((current) => [...current, { role: "assistant", text: body.response ?? body.error ?? "Voice processing failed." }]); setPending(false); };
      recorder.start(); setRecording(true);
    } catch { setMessages((current) => [...current, { role: "assistant", text: "Microphone permission was not available." }]); }
  };
  return <Card className="mx-auto min-h-[650px] max-w-3xl gap-0 rounded-3xl border-border py-0 shadow-card"><header className="flex items-center justify-between border-b border-border p-5"><div><p className="text-sm font-semibold">Ask Care Memory</p><p className="mt-1 text-xs text-muted-foreground">One assistant for chat and voice</p></div><Button onClick={() => setSpeaking((current) => !current)} variant={speaking ? "default" : "secondary"} className="rounded-xl"><Volume2 data-icon="inline-start"/> Speak replies</Button></header><div className="flex-1 space-y-4 p-5">{messages.map((message, index) => <div key={index} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{message.role === "assistant" && <Sparkles className="mb-2 text-primary-dark" size={15}/>} {message.text}</div>)}{pending && <p className="text-sm text-muted-foreground">Care Memory is thinking...</p>}</div><div className="border-t border-border p-4"><div className="mb-3 flex flex-wrap gap-2">{["Dad gave Emma her evening medicine.", "Emma developed a rash today.", "Prepare Emma's summary for the doctor."].map((prompt) => <Button type="button" variant="secondary" size="sm" onClick={() => setInput(prompt)} key={prompt} className="rounded-full text-xs text-muted-foreground">{prompt}</Button>)}</div><form onSubmit={submit} className="flex gap-2"><Button onClick={toggleRecording} type="button" size="icon-lg" variant="outline" aria-label={recording ? "Stop recording" : "Record voice note"} className={`size-11 rounded-xl ${recording ? "border-red-300 bg-red-50 text-red-700" : ""}`}><Mic/></Button><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder={recording ? "Listening..." : "Ask about your family's care..."} className="h-11 min-w-0 flex-1 rounded-xl px-4"/><Button disabled={pending} size="icon-lg" className="size-11 rounded-xl" aria-label="Send message"><Send/></Button></form></div></Card>;
}
