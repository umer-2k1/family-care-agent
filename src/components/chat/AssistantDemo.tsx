"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, Send, Sparkles, Volume2 } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { role: "assistant" | "user"; text: string };
type VoiceState = "idle" | "requesting" | "recording" | "transcribing";

function FormattedAssistantText({ text }: { text: string }) {
  const lines = text.replace(/\s*#{2,6}\s*/g, "\n").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const formatInline = (value: string) => value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <span key={index}>{part}</span>);
  return <div className="space-y-2">{lines.map((line, index) => {
    const bullet = line.startsWith("- ") || line.startsWith("• ");
    const content = bullet ? line.slice(2) : line;
    const heading = /^\*\*[^*]+\*\*$/.test(content);
    if (heading) return <h3 key={index} className="font-semibold">{formatInline(content)}</h3>;
    return bullet ? <p key={index} className="pl-4 before:mr-2 before:content-['•']">{formatInline(content)}</p> : <p key={index}>{formatInline(content)}</p>;
  })}</div>;
}

export function AssistantDemo({ memberName }: { memberName: string | null }) {
  const subject = memberName ?? "your family member";
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: `I have ${subject}'s active care plan in context. You can ask about the medicine, report an update, or request a doctor summary.` }]);
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [threadId] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceMessage, setVoiceMessage] = useState<string>();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const appendAssistant = (text: string) => setMessages((current) => [...current, { role: "assistant", text }]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || pending) return;
    setMessages((current) => [...current, { role: "user", text: value }]);
    setInput("");
    setPending(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: value, threadId }) });
      const body = await response.json() as { response?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "The assistant could not respond.");
      const reply = body.response ?? "The assistant could not respond.";
      appendAssistant(reply);
      if (speaking && "speechSynthesis" in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The assistant could not respond.";
      console.error(`[chat] Message failed: ${message}`);
      appendAssistant(message);
    } finally {
      setPending(false);
    }
  };

  const sendRecording = async (stream: MediaStream, recorder: MediaRecorder) => {
    setVoiceState("transcribing");
    setVoiceMessage("Transcribing and processing your voice note...");
    stream.getTracks().forEach((track) => track.stop());
    setPending(true);
    try {
      const mimeType = recorder.mimeType || "audio/webm";
      const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const file = new File(chunksRef.current, `care-message.${extension}`, { type: mimeType });
      if (file.size === 0) throw new Error("No audio was captured. Please record again.");
      const form = new FormData();
      form.set("audio", file);
      form.set("threadId", threadId);
      const response = await fetch("/api/voice", { method: "POST", body: form });
      const body = await response.json() as { transcript?: string; response?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Voice processing failed.");
      if (body.transcript) setMessages((current) => [...current, { role: "user", text: body.transcript as string }]);
      appendAssistant(body.response ?? "Voice processing failed.");
      setVoiceMessage("Voice note processed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice processing failed.";
      console.error(`[voice] Recording failed: ${message}`);
      setVoiceMessage(message);
      appendAssistant(message);
    } finally {
      chunksRef.current = [];
      recorderRef.current = null;
      setPending(false);
      setVoiceState("idle");
    }
  };

  const toggleRecording = async () => {
    if (recorderRef.current && voiceState === "recording") {
      setVoiceMessage("Finishing recording...");
      recorderRef.current.stop();
      return;
    }
    if (voiceState !== "idle" || pending) return;
    setVoiceState("requesting");
    setVoiceMessage("Waiting for microphone permission...");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) throw new Error("Voice recording is not supported by this browser.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? { mimeType: "audio/webm;codecs=opus" } : undefined;
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onerror = () => { stream.getTracks().forEach((track) => track.stop()); setVoiceState("idle"); setVoiceMessage("The browser could not record audio. Please try again."); };
      recorder.onstop = () => void sendRecording(stream, recorder);
      recorder.start(250);
      setVoiceState("recording");
      setVoiceMessage("Recording… Select stop when you are finished.");
    } catch (error) {
      const message = error instanceof Error && error.message.includes("supported") ? error.message : "Microphone access was not granted. Allow microphone access in your browser and try again.";
      console.error(`[voice] Microphone unavailable: ${error instanceof Error ? error.message : "Unknown error"}`);
      setVoiceState("idle");
      setVoiceMessage(message);
    }
  };

  const prompts = memberName ? [`Dad gave ${memberName} the evening medicine.`, `${memberName} developed a rash today.`, `Prepare ${memberName}'s summary for the doctor.`] : ["Record the evening medicine.", "A rash developed today.", "Prepare a summary for the doctor."];
  const recordLabel = voiceState === "requesting" ? "Requesting microphone permission" : voiceState === "recording" ? "Stop and send voice note" : voiceState === "transcribing" ? "Transcribing voice note" : "Record voice note";

  return <Card className="mx-auto flex h-[min(700px,calc(100vh-12rem))] min-h-[520px] max-w-3xl flex-col gap-0 overflow-hidden rounded-3xl border-border py-0 shadow-card">
    <header className="flex items-center justify-between border-b border-border p-5"><div><p className="text-sm font-semibold">Ask Care Memory</p><p className="mt-1 text-xs text-muted-foreground">One assistant for chat and voice</p></div><Button onClick={() => setSpeaking((current) => !current)} variant={speaking ? "default" : "secondary"} className="rounded-xl"><Volume2 data-icon="inline-start"/> Speak replies</Button></header>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">{messages.map((message, index) => <div key={index} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{message.role === "assistant" && <Sparkles className="mb-2 text-primary-dark" size={15}/>} {message.role === "assistant" ? <FormattedAssistantText text={message.text}/> : message.text}</div>)}{pending && <p className="text-sm text-muted-foreground">Care Memory is thinking...</p>}<div ref={messagesEndRef} aria-hidden="true" /></div>
    <div className="border-t border-border p-4">
      <div className="mb-3 flex flex-wrap gap-2">{prompts.map((prompt) => <Button type="button" variant="secondary" size="sm" onClick={() => setInput(prompt)} key={prompt} className="rounded-full text-xs text-muted-foreground">{prompt}</Button>)}</div>
      <form onSubmit={submit} className="flex gap-2">
        <Button onClick={toggleRecording} disabled={voiceState === "transcribing" || pending} type="button" size="icon-lg" variant="outline" aria-label={recordLabel} className={`size-11 rounded-xl ${voiceState === "recording" ? "border-red-300 bg-red-50 text-red-700" : ""}`}><Mic/></Button>
        <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder={voiceState === "recording" ? "Listening..." : "Ask about your family's care..."} className="h-11 min-w-0 flex-1 rounded-xl px-4"/>
        <Button type="submit" disabled={pending} size="icon-lg" className="size-11 rounded-xl" aria-label="Send message"><Send/></Button>
      </form>
      {voiceMessage && <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">{voiceMessage}</p>}
    </div>
  </Card>;
}
