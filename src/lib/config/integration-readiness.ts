type Environment = Record<string, string | undefined>;

function hasProviderKey(provider: string | undefined, env: Environment) {
  if ((provider ?? "gemini") === "gemini") return Boolean(env.GEMINI_API_KEY);
  if (provider === "groq") return Boolean(env.GROQ_API_KEY);
  if (provider === "openrouter") return Boolean(env.OPENROUTER_API_KEY);
  return false;
}

export function getIntegrationReadiness(env: Environment) {
  const defaultProvider = env.DEFAULT_LLM_PROVIDER ?? "gemini";
  const recordProvider = env.RECORD_LLM_PROVIDER ?? defaultProvider;
  const fastProvider = env.FAST_LLM_PROVIDER ?? defaultProvider;
  const defaultModelReady = Boolean(env.DEFAULT_LLM_MODEL && hasProviderKey(defaultProvider, env));
  const recordModelReady = Boolean((env.RECORD_LLM_MODEL ?? env.DEFAULT_LLM_MODEL) && hasProviderKey(recordProvider, env));
  const fastModelReady = Boolean((env.FAST_LLM_MODEL ?? env.DEFAULT_LLM_MODEL) && hasProviderKey(fastProvider, env));
  const cogneeUrl = env.COGNEE_API_URL?.trim();

  return {
    supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    cloudinary: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
    primaryModel: defaultModelReady && recordModelReady && fastModelReady,
    memory: env.MEMORY_PROVIDER === "mem0"
      ? Boolean(env.MEM0_API_KEY && env.MEM0_API_URL)
      : Boolean(env.COGNEE_API_KEY && cogneeUrl && !cogneeUrl.includes("your-tenant")),
    speech: env.STT_PROVIDER === "groq" ? Boolean(env.GROQ_API_KEY) : Boolean(env.DEEPGRAM_API_KEY),
    calendar: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.TOKEN_ENCRYPTION_KEY),
    proactive: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.CRON_SECRET),
  };
}
