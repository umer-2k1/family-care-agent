# Project Overview

## Product

Care Memory is a founder-demo web app for family health coordination. It converts uploaded health records and natural language updates into user-confirmed care plans, medication actions, follow-ups, persistent family context, and concise care summaries. It is not a diagnosis, triage, EHR, pharmacy, or production compliance platform.

## Users and demo story

Family caregivers coordinate care for a child, parent, or partner. The primary demo follows Emma: a prescription for Amoxicillin is reviewed and confirmed, creating a 15-day episode with 30 doses; a caregiver marks an evening dose and reports a rash; the app shows durable timeline and memory context, an unscheduled follow-up alert, optional calendar action, and a doctor summary.

## Architecture boundaries

- Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui provide the application shell and reusable interaction primitives.
- Supabase Auth and Postgres are the deterministic source of truth. Every user-owned query must be scoped to the authenticated family.
- Cloudinary stores uploaded record assets; Postgres stores their metadata and links.
- LangGraph orchestrates one assistant. LLMs reason through a provider abstraction, selected by purpose with bounded fallback.
- Cognee or Mem0 stores derived member-scoped episodic and semantic memory with Postgres provenance. It never replaces deterministic care state.
- Deepgram with Groq Whisper fallback provides speech-to-text. Browser SpeechSynthesis is optional output.
- Google Calendar receives only user-confirmed care plans. A confirmed Calendar action adds the follow-up and the full medication dose schedule with member and medication context.

## Product guardrails

Human confirmation is required before record-derived actions unless the user has explicitly enabled automatic Calendar integration in Settings. That opt-in acts as standing consent only for complete medication courses at 90% or higher confidence; uncertain or incomplete records still require review. Care actions remain successful when optional memory or calendar work fails. Provider secrets remain server-only. The UI is calm and warm, using #7B9A8E, cream surfaces, rounded cards, subtle borders, and low visual noise.

## Current behavior

Founder-demo milestones 0-12 are implemented in the current feature branch: authentication and RLS schema; family CRUD and profiles; protected record upload, preview, multimodal understanding, edit/review and transactional confirmation; deterministic care/dose state; one LangGraph text/voice assistant; Cognee member-dataset ingestion and direct knowledge-graph retrieval normalized into React Flow, with an explicitly labeled Postgres availability fallback; Calendar linkage; proactive checks; sourced summaries; and responsive demo/error states. Explicit demo mode has no external side effects, while production mode fails closed when configuration is missing.

The implementation is code-complete but not AI Genesis Kit complete. Credential-backed Supabase, Google OAuth/Calendar, Cloudinary, model, memory, microphone, and STT acceptance evidence is still required before P1 findings can move from `fixed` to `closed`, build-plan items can be checked, and the feature can be archived.

## Planned work

Next, configure live service credentials, apply both Supabase migrations, run the credential-backed browser and integration check, repair any confirmed failures, close the audit findings, and use the completion workflow to archive the feature. WhatsApp remains an explicit post-demo milestone.

## Verification

Use `pnpm test`, `pnpm build`, and `pnpm lint`. The current suite covers demo isolation, auth/cron routing, deterministic dose scheduling, natural-language dose selection, provider fallback, token encryption, and memory normalization. Browser and live-provider evidence remains required for external integrations; CI and deployment are separate explicit workflows.
