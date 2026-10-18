# Current Feature

## 0. Repo and foundations

**Type:** Feature
**Build-plan item:** 0. Repo and foundations

### Goal

Create the runnable Care Memory foundation: a Next.js TypeScript application with its design system, an authenticated-app boundary ready for Supabase, shared navigation, and a stable local demo seed path.

### Out of scope

Diagnosis, emergency triage, medication interaction checking, clinical decision support, insurance, pharmacy ordering, telehealth, FHIR/EHR integration, mobile apps, WhatsApp, deployment, and production compliance certification.

### Build steps

- [x] 1. Establish the Next.js TypeScript application foundation and document its actual commands, ignores, and local environment template.

  **Done when:** The repository has a runnable Next.js application, no credentials are committed, and the Kit context reflects the detected stack and commands. Evidence: `pnpm build` and `pnpm lint` passed on September 6, 2026.

- [x] 2. Build the Care Memory design tokens, global layout, navigation, and responsive authenticated-app shell with demo-safe placeholder data.

  **Done when:** A signed-in demo route renders the requested Home, Family, Care, Memory, and Ask navigation in the calm visual language from the blueprint. Evidence: `pnpm build`, `pnpm lint`, and a local `GET /` route check passed on September 6, 2026.

- [x] 3. Add a Supabase authentication boundary and a documented local demo fallback without bypassing future authenticated data scoping.

  **Done when:** The app exposes a sign-in route and the protected app layout has an explicit, non-secret-backed demo mode for the next milestone. Evidence: `/login`, `/api/health`, and all founder-demo routes returned HTTP 200 on September 6, 2026.

- [ ] 4. Implement the production data and identity foundation with Supabase migrations, RLS, SSR sessions, Google OAuth, route protection, and typed repositories.

  **Done when:** Production mode fails closed without configuration; configured users can complete Google OAuth; every care table has an ownership-aware RLS policy; server code can resolve the authenticated family without trusting client IDs; demo fixtures remain isolated.

  **Implementation state:** Schema, RLS, user/family provisioning, SSR clients, OAuth routes, session proxy, sign-out, fail-closed configuration handling, and the authenticated family resolver are implemented. Local tests, build, lint, explicit demo-mode routing, and missing-config fail-closed behavior pass. Applying the migration and completing a live Google OAuth round trip remain unverified until Supabase/Google credentials are configured.

- [ ] 5. Replace static family pages with persistent family-member CRUD and scoped member profiles.

  **Done when:** An authenticated user can add and update family members, and pages load only members belonging to the user's family.

  **Implementation state:** Add/update actions, family-scoped repositories, dynamic profiles, real episode/record/event summaries, member timelines, and per-member memory graphs are implemented. Live Supabase persistence remains to be exercised with configured credentials.

- [ ] 6. Implement Cloudinary record upload, multimodal provider fallback, validated classification/extraction, editable review, and transactional confirmation.

  **Done when:** An image/PDF becomes a scoped health record, uncertain output requests clarification, and only confirmed data creates care state.

  **Implementation state:** Authenticated image/PDF upload, protected Cloudinary assets, generic multimodal extraction, bounded model fallback, Zod validation, uncertainty handling, editable review, and the transactional confirmation RPC are implemented. Live Cloudinary/model calls remain to be exercised with configured credentials.

- [ ] 7. Implement care episodes, deterministic medication schedules, dose mutations, events, follow-ups, and Today queries against Postgres.

  **Done when:** A twice-daily 15-day plan creates exactly 30 doses and adherence updates persist with caregiver provenance.

  **Implementation state:** The database transaction generates deterministic doses, the 30-dose domain invariant is tested, and taken/missed/skipped updates support signed-in and selected-family caregiver provenance. Live Postgres behavior remains to be exercised after migrations are applied.

- [ ] 8. Replace canned chat with one LangGraph assistant using purpose-based model providers, persisted context, deterministic tools, and confirmation-aware actions.

  **Done when:** Natural language dose and health-event messages update the correct active episode and a summary request returns sourced persisted data.

  **Implementation state:** One StateGraph loads Postgres/provider context, classifies intent, selects morning/evening doses and mentioned caregivers, records health events, protects Calendar confirmation, uses the summary model purpose, and persists thread identifiers. Provider-backed execution remains to be exercised with credentials.

- [ ] 9. Implement persistent memory providers, provenance, normalized member graph data, and failure-tolerant memory writes.

  **Done when:** A reported event can be retrieved in a later thread and the rendered graph comes from normalized stored/provider relationships.

  **Implementation state:** Cognee and Mem0 adapters, Postgres-first provenance, failure-tolerant provider synchronization, combined retrieval, normalized graph data, member selection, and React Flow rendering are implemented. Live provider retrieval remains to be exercised.

- [ ] 10. Implement MediaRecorder voice input, Deepgram/Groq Whisper fallback, shared-agent submission, Google Calendar OAuth/event creation, and proactive follow-up checks.

  **Done when:** A voice transcript executes the same assistant flow; a confirmed Calendar action can idempotently create the linked follow-up and complete medication dose schedule; and an explicit Settings opt-in can automatically confirm and synchronize complete high-confidence medication courses after upload without blocking care state on Calendar failure.

  **Implementation state:** Browser recording and speech synthesis, Deepgram/Groq transcription fallback, shared LangGraph submission, encrypted Google tokens, in-app idempotent follow-up and per-dose Calendar synchronization, persistent opt-in automation for complete high-confidence uploads, non-blocking Calendar status synchronization after dose updates, and secret/session-authorized proactive checks are implemented. Browser permissions and complete live external API behavior remain to be exercised.

- [ ] 11. Replace remaining demo-only UI paths, add focused domain tests and browser evidence, close audit findings, and prepare the founder-demo review packet.

  **Done when:** Every visible primary action has a real configured-mode behavior, the Verify checks pass, and no P0/P1 finding remains open or merely fixed.

- [x] 12. Adopt shadcn/ui primitives across the functional application without changing care behavior or the established visual language.

  **Done when:** shadcn/ui is configured, shared Button, Card, Input, Textarea, Label, Dialog, Select, and Alert primitives are installed and used by the primary authentication, family, care-record, and assistant interactions; tests, lint, and production build pass. Evidence: the official shadcn CLI initialized `components.json` and generated all eight primitives; 16 tests, lint, the demo production build, dependency audit, diff validation, and HTTP 200 smoke checks for `/login`, `/`, `/family`, `/family/emma`, `/care`, and `/ask` passed on September 7, 2026.

- [x] 13. Replace the configured memory graph's Postgres-reference projection with the member-scoped Cognee knowledge graph.

  **Done when:** The Cognee adapter resolves the member dataset, fetches its authorized `/api/v1/datasets/{dataset_id}/graph` payload, normalizes real Cognee nodes and edges into the provider-independent React Flow contract, and both the Memory page and member profile use it; Postgres references remain only a clearly labeled availability fallback, with focused adapter/normalization tests passing. Evidence: implementation was verified against the current `topoteretes/cognee` API source; Cognee multipart ingestion, cognify, dataset lookup, graph retrieval, strict normalization, malformed-payload rejection, and empty-dataset behavior are covered by 5 focused tests. All 21 tests, lint, TypeScript production build, dependency audit, and diff validation passed on September 7, 2026.

### Testing

Vitest is configured for domain and integration-boundary logic. Coverage currently includes demo isolation, auth/cron routing, deterministic dose generation and language selection, provider fallback, Cognee multipart ingestion/dataset graph retrieval, strict graph normalization, token encryption, and the isolated demo agent. Build and lint remain required. Live integration and browser acceptance evidence will be captured only after service credentials are configured.

### Verify

`pnpm test`, `pnpm build`, and `pnpm lint` until an explicit `/ci` workflow establishes a single Verify command.

### Configuration blockers for live integrations

The local founder demo is complete and runs with `NEXT_PUBLIC_DEMO_MODE=true`. Google OAuth, Supabase persistence/RLS, Cloudinary asset delivery, live model providers, memory service, STT, and Google Calendar require the corresponding credentials from `.env.example` before they can be enabled. Those services are intentionally not simulated as real external side effects.
