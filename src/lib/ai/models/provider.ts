export type ModelProviderName = "deepseek" | "gemini" | "groq" | "openrouter";
export type ModelPurpose = "chat" | "record_understanding" | "reasoning" | "summary";
export type ModelInput = { prompt: string; media?: { mimeType: string; data: string }; json?: boolean };

export interface LanguageModelProvider { complete(input: ModelInput): Promise<string>; }

function requireValue(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

class GeminiProvider implements LanguageModelProvider {
  constructor(private model: string) {}
  async complete(input: ModelInput) {
    const key = requireValue(process.env.GEMINI_API_KEY, "GEMINI_API_KEY");
    const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];
    if (input.media) parts.push({ inlineData: { mimeType: input.media.mimeType, data: input.media.data } });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: input.json ? { responseMimeType: "application/json" } : undefined }), signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Gemini failed with ${response.status}.`);
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!text) throw new Error("Gemini returned an empty response.");
    return text;
  }
}

class OpenAiCompatibleProvider implements LanguageModelProvider {
  constructor(private baseUrl: string, private apiKey: string | undefined, private model: string, private label: string) {}
  async complete(input: ModelInput) {
    const mediaPart = input.media?.mimeType === "application/pdf" ? { type: "file", file: { filename: "health-record.pdf", file_data: `data:${input.media.mimeType};base64,${input.media.data}` } } : input.media ? { type: "image_url", image_url: { url: `data:${input.media.mimeType};base64,${input.media.data}` } } : null;
    const content = mediaPart ? [{ type: "text", text: input.prompt }, mediaPart] : input.prompt;
    const response = await fetch(`${this.baseUrl}/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${requireValue(this.apiKey, `${this.label} API key`)}`, "content-type": "application/json" }, body: JSON.stringify({ model: this.model, messages: [{ role: "user", content }], response_format: input.json ? { type: "json_object" } : undefined, temperature: 0.2 }), signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`${this.label} failed with ${response.status}.`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new Error(`${this.label} returned an empty response.`);
    return text;
  }
}

function createProvider(name: ModelProviderName, model: string): LanguageModelProvider {
  if (name === "gemini") return new GeminiProvider(model);
  if (name === "groq") return new OpenAiCompatibleProvider("https://api.groq.com/openai/v1", process.env.GROQ_API_KEY, model, "Groq");
  if (name === "deepseek") return new OpenAiCompatibleProvider("https://api.deepseek.com", process.env.DEEPSEEK_API_KEY, model, "DeepSeek");
  return new OpenAiCompatibleProvider("https://openrouter.ai/api/v1", process.env.OPENROUTER_API_KEY, model, "OpenRouter");
}

export function getModelChain(purpose: ModelPurpose): LanguageModelProvider[] {
  const primaryName = (purpose === "chat" ? process.env.FAST_LLM_PROVIDER ?? process.env.DEFAULT_LLM_PROVIDER : purpose === "record_understanding" ? process.env.RECORD_LLM_PROVIDER ?? process.env.DEFAULT_LLM_PROVIDER : process.env.DEFAULT_LLM_PROVIDER) as ModelProviderName | undefined;
  const primaryModel = purpose === "chat" ? process.env.FAST_LLM_MODEL ?? process.env.DEFAULT_LLM_MODEL : purpose === "record_understanding" ? process.env.RECORD_LLM_MODEL ?? process.env.DEFAULT_LLM_MODEL : process.env.DEFAULT_LLM_MODEL;
  const fallbackName = process.env.FALLBACK_LLM_PROVIDER as ModelProviderName | undefined;
  const fallbackModel = process.env.FALLBACK_LLM_MODEL;
  const chain = [createProvider(primaryName ?? "gemini", requireValue(primaryModel, `${purpose} model`))];
  if (fallbackName && fallbackModel && fallbackName !== primaryName) chain.push(createProvider(fallbackName, fallbackModel));
  return chain;
}

export async function completeWithFallback(purpose: ModelPurpose, input: ModelInput) {
  const errors: string[] = [];
  for (const provider of getModelChain(purpose)) {
    try { return await provider.complete(input); } catch (error) { errors.push(error instanceof Error ? error.message : "Provider failed"); }
  }
  throw new Error(`All model providers failed: ${errors.join(" ")}`);
}
