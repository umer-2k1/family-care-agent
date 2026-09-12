# Care Memory

Care Memory is a family health coordination application. It provides a user-confirmed path from record understanding to care episodes, medication tracking, family memory, follow-ups, Google Calendar events, voice input, and doctor summaries.

The interface uses Tailwind CSS with shadcn/ui primitives, retaining the Care Memory sage-and-cream design tokens.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. The default `NEXT_PUBLIC_DEMO_MODE=true` runs an isolated local demo with seeded Emma care data and no external side effects. Set it to `false` only after completing the live-service setup below.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```

## Live service configuration

Set `NEXT_PUBLIC_DEMO_MODE=false` only after configuring Supabase, Cloudinary, Google, at least one LLM, a memory provider, and speech-to-text in `.env.local`. Server keys must never use the `NEXT_PUBLIC_` prefix. `/api/health` returns HTTP 503 and identifies incomplete integration groups until production configuration is ready.

The product boundaries are deliberate: Supabase Postgres owns care state, Cloudinary owns source assets, model providers are selected by purpose, memory is provider-abstracted, and Calendar work requires user confirmation. The full architecture and rollout constraints live in `family-care-agent-implementation-blueprint.md`.

## Supabase setup

1. Create a Supabase project and enable the Google provider under Authentication.
2. Add the Google client ID and secret in Supabase, and register the callback URL shown by Supabase in Google Cloud.
3. Apply both migrations in timestamp order with the Supabase CLI or dashboard migration runner:
   - `supabase/migrations/20260906143000_initial_care_schema.sql`
   - `supabase/migrations/20260906150000_confirm_care_plan.sql`
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. Generate a private `TOKEN_ENCRYPTION_KEY` for OAuth token encryption, for example with `openssl rand -hex 32`.

Production mode fails closed when Supabase configuration is absent. Application and mutation routes require a verified Supabase session; RLS independently enforces ownership at the database layer.

## External integrations

- **Cloudinary:** configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Record images and PDFs are uploaded server-side as authenticated assets.
- **Models:** configure the provider/model pairs in `.env.example` and the matching API keys. Record extraction uses `RECORD_LLM_*`; assistant generation uses `DEFAULT_LLM_*`; `FALLBACK_LLM_*` is attempted when the selected provider is unavailable. Supported providers are Gemini, Groq, and OpenRouter.
- **Memory:** set `MEMORY_PROVIDER=cognee` with `COGNEE_API_URL` and `COGNEE_API_KEY`, or `MEMORY_PROVIDER=mem0` with `MEM0_API_URL` and `MEM0_API_KEY`. Cognee memories are ingested into one dataset per family member, cognified, and rendered from Cognee's real `/api/v1/datasets/{dataset_id}/graph` nodes and edges. Postgres retains provenance and is shown only as a labeled availability fallback when Cognee is unavailable or has not built the graph yet.
- **Speech:** set `STT_PROVIDER=deepgram` and `DEEPGRAM_API_KEY`. A configured Groq key and `GROQ_WHISPER_MODEL` provide the transcription fallback.
- **Google Calendar:** use the same Google OAuth client configured for Supabase. Include the application callback in Supabase's redirect allow list. The sign-in flow requests Calendar event access and stores encrypted provider tokens before creating idempotent, user-confirmed follow-up events.
- **Proactive checks:** set a strong `CRON_SECRET` and call `GET /api/cron/proactive` with `Authorization: Bearer <secret>` from the scheduler. Signed-in users may also call this endpoint through their normal session; other requests are rejected by the application boundary.

After configuration, start the app, sign in with Google, and check `/api/health` before exercising uploads, chat, voice, memory, Calendar, and scheduled checks.
