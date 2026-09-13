# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P1] fixed - Authentication is not implemented

- **File:** `src/app/login/page.tsx`, `src/lib/supabase/client.ts`
- **Found:** 2026-09-06
- **Lens:** security
- **Scope:** full-project
- **Why it matters:** The Google button either bypasses auth in demo mode or points to a nonexistent route. Application routes are unprotected and there is no server-side session or ownership boundary for health data.
- **Suggested fix:** Implement Supabase SSR clients, Google OAuth start/callback/sign-out routes, middleware-backed session refresh, protected app routes, and an explicitly isolated demo-data mode.
- **Resolution:** Supabase SSR clients, Google OAuth/callback/sign-out, session proxy protection, explicit demo isolation, authenticated family resolution, and fail-closed missing configuration were implemented. Awaiting live OAuth/RLS audit evidence before closure.

### F-02 [P1] fixed - No Postgres schema, migrations, RLS, or repositories exist

- **File:** project-wide
- **Found:** 2026-09-06
- **Lens:** security
- **Scope:** full-project
- **Why it matters:** Users, families, records, care episodes, doses, health events, follow-ups, and threads are not persisted. There is no family ownership enforcement, so the blueprint's source-of-truth and isolation requirements are unmet.
- **Suggested fix:** Add versioned Supabase migrations with ownership-aware RLS policies, typed server repositories, and seed/demo fixtures separated from production data.
- **Resolution:** Versioned migrations now define the care schema, ownership helper, provisioning trigger, RLS policies, indexes, confirmation transaction, and family-scoped repositories. Awaiting migration-backed audit evidence before closure.

### F-03 [P1] fixed - Care actions and record review are simulated in component state

- **File:** `src/components/care/CareEpisodeDemo.tsx`, `src/components/home/TodayDashboard.tsx`
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** Dose changes disappear on navigation, record uploads never read a file, confirmation creates nothing, and proactive/calendar buttons have no behavior despite presenting successful care workflows.
- **Suggested fix:** Implement validated server actions/services for family CRUD, signed record upload, extraction review, transactional care-plan creation, deterministic dose generation, adherence updates, follow-ups, and queries used by pages.
- **Resolution:** Configured mode now performs real family CRUD, record upload/review/confirmation, transactional episode creation, deterministic dose generation, caregiver-aware dose mutations, follow-ups, dashboards, profiles, and timelines. Demo fixtures are confined to explicit demo mode. Awaiting live browser/database evidence before closure.

### F-04 [P1] fixed - LangGraph and model providers are not integrated

- **File:** `src/lib/ai/care-agent.ts`, `src/app/api/chat/route.ts`, `src/lib/ai/models/provider.ts`
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** Intent matching is keyword-based, responses are canned, the installed LangGraph package is unused, and no Gemini, Groq, or OpenRouter adapter or fallback executes. Chat cannot reason over persisted family state or perform deterministic tools.
- **Suggested fix:** Implement purpose-based provider adapters with bounded fallback, a LangGraph state graph, authenticated context loading, deterministic tool services, action confirmation, thread persistence, and structured error handling.
- **Resolution:** A single LangGraph StateGraph now loads persisted context, selects purpose-based Gemini/Groq/OpenRouter providers with bounded fallback, executes deterministic dose and health-event tools, requires Calendar confirmation, persists threads, and produces sourced summaries. Awaiting live provider-backed audit evidence before closure.

### F-05 [P1] fixed - Long-term memory is static and no provider is implemented

- **File:** `src/lib/memory/provider.ts`, `src/lib/demo-data.ts`, `src/components/memory/MemoryGraph.tsx`
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** Memory never persists or retrieves across conversations. The graph is selected from fixed IDs rather than normalized provider relationships and does not prove provenance-backed long-term context.
- **Suggested fix:** Implement Cognee and optional Mem0 adapters, failure-tolerant writes/retrieval, provenance references, a normalized graph endpoint, and member-scoped rendering from stored results.
- **Resolution:** Cognee and Mem0 adapters, Postgres-first provenance, failure-tolerant synchronization, and cross-thread context retrieval are implemented. Configured Cognee mode now uses one member-scoped dataset, current multipart ingestion/cognify contracts, direct `/api/v1/datasets/{dataset_id}/graph` retrieval, strict provider-independent normalization, and React Flow rendering; Postgres projection is only a labeled availability fallback. Awaiting live Cognee evidence before closure.

### F-06 [P1] fixed - Voice input is not implemented

- **File:** `src/components/chat/AssistantDemo.tsx`, `src/lib/voice/provider.ts`
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** The microphone button has no handler. There are no MediaRecorder, upload, Deepgram, Groq Whisper fallback, or shared-agent calls.
- **Suggested fix:** Implement browser recording, a validated voice route, STT provider adapters with fallback, transcript UI, and submission through the same chat endpoint.
- **Resolution:** MediaRecorder capture, validated upload, Deepgram/Groq Whisper fallback, transcript display, shared LangGraph invocation, and optional browser speech synthesis are implemented. Awaiting live microphone/STT evidence before closure.

### F-07 [P1] fixed - Cloudinary and Google Calendar integrations are absent

- **File:** project-wide
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** Uploaded records have no durable asset storage and calendar buttons cannot create confirmed follow-up events. Two acceptance criteria and external side effects central to the demo are missing.
- **Suggested fix:** Add server-only Cloudinary upload/signing and deletion-safe metadata handling, plus Google connection/token storage, OAuth, event creation, idempotency, confirmation, and error isolation.
- **Resolution:** Server-only authenticated Cloudinary upload, encrypted Google provider-token storage, OAuth Calendar scope, family-scoped follow-up lookup, idempotent event creation/linkage, and isolated failure redirects are implemented. Awaiting live Cloudinary/Calendar audit evidence before closure.

### F-08 [P1] closed - No automated tests cover high-risk domain logic

- **File:** `package.json`, project-wide
- **Found:** 2026-09-06
- **Lens:** tests
- **Scope:** full-project
- **Why it matters:** Dose generation, ownership checks, structured extraction validation, fallback behavior, intent/tool routing, and proactive follow-up logic can regress without detection.
- **Suggested fix:** Configure the project-native unit runner, add focused tests for pure/domain logic and service error paths, and establish one Verify command before calling the application complete.
- **Resolution:** Re-reviewed after implementation. Vitest now runs 16 focused tests for dose count/scheduling, dose-language selection, integration readiness, auth and cron boundaries, provider fallback, token encryption, memory graph normalization, demo isolation, and demo intent behavior. Tests, build, lint, dependency audit, and diff checks all pass.

### F-09 [P1] closed - OAuth callback ignores Calendar token persistence failure

- **File:** `src/app/auth/callback/route.ts`
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** current
- **Why it matters:** A user can finish Google sign-in while the `calendar_connections` upsert has failed. The application then appears authenticated but repeatedly reconnects or cannot create Calendar events, hiding the actual integration failure.
- **Suggested fix:** Check the upsert result and surface a bounded callback error instead of redirecting to a successful application state.
- **Resolution:** Re-reviewed after implementation. The callback now checks the `calendar_connections` upsert and routes failures through its bounded OAuth error redirect instead of entering a false success state.

### F-10 [P2] closed - Health readiness can report incomplete integrations as ready

- **File:** `src/app/api/health/route.ts`
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** current
- **Why it matters:** The placeholder Cognee URL counts as configured, the selected model provider/key pairing is not validated, and scheduled proactive credentials are omitted. Operators can receive HTTP 200 before the configured paths can execute.
- **Suggested fix:** Validate selected-provider keys and non-placeholder endpoints, and report proactive scheduler readiness separately.
- **Resolution:** Re-reviewed after implementation. Readiness now validates the selected model/provider key pairs, rejects the placeholder Cognee tenant, validates the selected STT provider, and reports proactive service-role/secret readiness independently. Focused tests pass.

### F-11 [P2] closed - Cloudinary asset can be orphaned when record persistence fails

- **File:** `src/app/api/records/route.ts`, `src/lib/cloudinary/server.ts`
- **Found:** 2026-09-06
- **Lens:** quality
- **Scope:** current
- **Why it matters:** Cloudinary upload happens before the `health_records` insert. A database failure leaves a protected asset with no Postgres owner/provenance row or cleanup path.
- **Suggested fix:** Add a server-only destroy helper and remove the just-uploaded asset when initial metadata persistence fails.
- **Resolution:** Re-reviewed after implementation. A server-only authenticated-asset destroy helper now removes the just-uploaded asset when the initial Postgres metadata insert fails; extraction failures retain the owned record and mark its status for retry/review.

### F-12 [P2] open - The environment template is excluded from version control

- **File:** `.gitignore`, `.env.example`
- **Found:** 2026-09-09
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** `.gitignore` ignores `.env*` without re-including `.env.example`, and the template is not tracked. A fresh checkout would not contain the required configuration contract, making production setup incomplete and error-prone.
- **Suggested fix:** Add `!.env.example` after the env ignore rule and commit the secret-free template.
- **Resolution:** Open.

### F-13 [P1] open - Non-prescription health records cannot complete review

- **File:** `src/lib/ai/schemas/record-understanding.ts`, `src/components/care/CareWorkspace.tsx`, `src/app/api/records/confirm/route.ts`
- **Found:** 2026-09-09
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** The blueprint requires generic image/PDF records, including labs, vaccinations, discharge summaries, doctor notes, and imaging. The extraction schema only models medications and follow-ups, while confirmation requires the first medication and otherwise returns an error. Non-prescription records can be classified and uploaded but remain stuck in review rather than becoming confirmed family records.
- **Suggested fix:** Define record-type-specific extracted data, allow confirmation without creating a medication episode, and present an appropriate review action for each supported record type.
- **Resolution:** Open.

### F-14 [P2] open - Confirmed follow-up timing ignores the reviewed extraction

- **File:** `supabase/migrations/20260906150000_confirm_care_plan.sql`, `src/components/care/CareWorkspace.tsx`
- **Found:** 2026-09-09
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** The extraction result includes `dueText`, but the review UI does not let the user edit it and the database function always schedules the follow-up at `now() + interval '14 days'`. Any instruction other than exactly two weeks produces incorrect care state after user confirmation.
- **Suggested fix:** Convert reviewed follow-up timing into a validated absolute timestamp, make it editable before confirmation, and pass that value into the transactional database function.
- **Resolution:** Open.

### F-15 [P1] open - Assistant actions do not resolve the named family member

- **File:** `src/lib/ai/langgraph/care-graph.ts`, `src/server/repositories/care.ts`
- **Found:** 2026-09-09
- **Lens:** quality
- **Scope:** full-project
- **Why it matters:** The assistant loads only the newest active care episode in the entire family. It can detect a named caregiver, but it does not identify the patient named in the message before updating a dose or creating a health event. With two active family members, a message about Emma can mutate another member's latest episode.
- **Suggested fix:** Resolve the patient from authenticated family members, load that member's active episode, require clarification when the patient or episode is ambiguous, and add a multi-member routing test.
- **Resolution:** Open.
