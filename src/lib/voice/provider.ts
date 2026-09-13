export interface SpeechToTextProvider { transcribe(audio: File): Promise<string>; }

export class DeepgramSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(audio: File) {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) throw new Error("DEEPGRAM_API_KEY is not configured.");
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true", { method: "POST", headers: { authorization: `Token ${key}`, "content-type": audio.type || "audio/webm" }, body: await audio.arrayBuffer(), signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`Deepgram failed with ${response.status}.`);
    const payload = await response.json() as { results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> } };
    const transcript = payload.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) throw new Error("Deepgram returned no transcript.");
    return transcript;
  }
}

export class GroqWhisperSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(audio: File) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is not configured.");
    const form = new FormData(); form.set("file", audio); form.set("model", process.env.GROQ_WHISPER_MODEL ?? "whisper-large-v3-turbo"); form.set("response_format", "json");
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`Groq Whisper failed with ${response.status}.`);
    const payload = await response.json() as { text?: string };
    if (!payload.text) throw new Error("Groq Whisper returned no transcript.");
    return payload.text;
  }
}

export async function transcribeWithFallback(audio: File) {
  const primary = process.env.STT_PROVIDER === "groq" ? new GroqWhisperSpeechToTextProvider() : new DeepgramSpeechToTextProvider();
  const fallback = primary instanceof DeepgramSpeechToTextProvider ? new GroqWhisperSpeechToTextProvider() : new DeepgramSpeechToTextProvider();
  try { return await primary.transcribe(audio); } catch (primaryError) { try { return await fallback.transcribe(audio); } catch (fallbackError) { throw new Error(`Speech transcription failed: ${String(primaryError)} ${String(fallbackError)}`); } }
}
