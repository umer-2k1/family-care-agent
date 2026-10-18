# AI Family Health Assistant — Implementation Blueprint

> Working concept: an AI-powered family health assistant that turns health records into actionable care plans, coordinates medication and follow-ups across family members, supports chat + voice, and builds persistent family health memory.

---

## 1. Purpose of This Blueprint

This document is the technical implementation plan for building a polished founder-demo web application.

It is intentionally more concrete than a PRD. It explains:

- what the demo must prove
- what screens to build
- what data to store
- how LangGraph should orchestrate the AI
- where Postgres ends and memory begins
- how record understanding should work
- how chat and voice share one agent
- how reminders and Google Calendar should work
- how the model provider layer should be abstracted
- how to structure the repo
- what to build in each milestone
- what should explicitly be left out

The objective is not to build a production healthcare platform.

The objective is to build a small, technically credible, visually polished product demo that a family-assistant founder can immediately understand and imagine as part of their product.

---

# 2. Product Summary

## Core idea

A family member uploads any health-related record or interacts with the assistant through text/voice.

The system:

1. understands the input
2. links it to the correct family member
3. creates or updates a Care Episode when appropriate
4. turns actionable instructions into tasks/reminders
5. tracks medication adherence and caregiver activity
6. stores important health events in persistent memory
7. proactively surfaces unresolved follow-ups
8. prepares a concise health/care summary when needed

### Core product loop

```text
Health Record / Chat / Voice
          ↓
AI Understanding
          ↓
Family Member Context
          ↓
Care Episode
          ↓
Actions + Reminders + Coordination
          ↓
Health Events + Memory
          ↓
Proactive Follow-up
          ↓
Doctor / Care Summary
```

---

# 3. Demo Goal

The demo should make the founder think:

> “This is what health memory and care coordination could look like inside a family assistant.”

The demo should visibly prove:

- multimodal health record understanding
- structured care-plan extraction
- agentic actions
- family member context
- medication scheduling
- caregiver coordination
- chat + voice interaction
- long-term memory
- graph-based family/member memory visualization
- proactive follow-up
- model/provider flexibility
- clean product thinking

---

# 4. Main Demo Story

Use one family member and one active care episode as the main demo scenario.

## Example

Family member: **Emma**

Uploaded record contains:

```text
Amoxicillin 5ml
Twice daily
15 days
After meals
Review in 2 weeks
```

The system should:

1. identify the document as a prescription
2. extract the medication details
3. detect the follow-up instruction
4. ask the user to confirm the extracted care plan
5. create a 15-day Care Episode
6. create 30 expected dose records
7. show morning and evening medication on Today screen
8. allow a caregiver to mark a dose as taken
9. allow the user to say/type:
   - “Dad gave Emma her evening medicine”
   - “Emma developed a rash today”
10. link both updates to Emma’s active Care Episode
11. show the resulting memory/timeline
12. surface:
   - “Emma’s follow-up is due soon and I don’t see it scheduled.”
13. optionally add the follow-up to Google Calendar
14. generate a care summary for the next doctor visit

This one polished flow is the demo.

---

# 5. Product Scope

## Must-have features

### Authentication
- Google OAuth
- user session
- user owns one family workspace for demo

### Family
- add family member
- relationship field
- date of birth
- optional notes
- family tree UI
- click family member → member profile

### Health Records
- upload image or PDF
- store original in Cloudinary
- identify record type
- extract structured information
- handle uncertain classification
- show user review before creating actions

### Care Episodes
- create episode from actionable health records
- attach records, medications, symptoms, follow-ups
- active/inactive/completed state
- timeline of episode activity

### Medication Plan
- medication name
- dose
- frequency
- duration
- instructions
- expected dose count
- taken/missed/skipped
- caregiver who marked it

### Chat + Voice
- one shared assistant
- text input
- microphone input
- voice converted to text
- same LangGraph flow for both
- optional text-to-speech response

### Memory
- family-member scoped long-term context
- episodic memories
- semantic relationships
- memory graph visualization
- source/provenance where possible

### Proactive Follow-up
- detect unresolved follow-up commitments
- surface care gaps
- allow “Add to Calendar”

### Google Calendar
- connect Google Calendar
- create doctor appointment / follow-up / test events
- do not create every medication dose in Google Calendar

### Summary
- generate care summary from:
  - original record
  - active episode
  - medication adherence
  - symptoms/events
  - memory
  - follow-up status

---

# 6. Explicit Non-Goals

Do not build these for the first founder demo:

- diagnosis engine
- emergency triage
- medication interaction checker
- clinical decision support
- insurance
- pharmacy ordering
- doctor marketplace
- telehealth
- hospital integrations
- FHIR/EHR integration
- mobile app
- complex admin dashboard
- full notification infrastructure
- full WhatsApp integration before web demo works
- production-grade regulatory/compliance system
- multiple independent autonomous agents talking to each other

---

# 7. Design System

The UI should visually feel calm, premium, family-friendly, and close to Anna’s visual language.

It should not look like a hospital dashboard.

## Primary color

```text
#7B9A8E
```

## Suggested tokens

```css
--primary: #7B9A8E;
--primary-light: #AFC1BA;
--background: #F7F5F1;
--surface: #FFFFFF;
--text-primary: #1F2B27;
--text-secondary: #66756F;
--border: #E7E9E5;
--muted: #EEF1EE;
```

Use soft neutral/cream backgrounds and green-charcoal typography.

## UI style

- rounded cards
- subtle borders
- generous whitespace
- soft shadows
- calm typography
- minimal chrome
- low visual noise
- warm family-assistant feel
- avoid strong medical red except for urgent/destructive states

## Suggested fonts

Preferred:
- Geist
- Inter
- Manrope
- Plus Jakarta Sans

## UI libraries

- Tailwind CSS
- shadcn/ui
- Lucide icons
- React Flow for memory graph visualization

---

# 8. Suggested Navigation

Desktop-first demo:

```text
Home
Family
Care
Memory
Ask
```

Alternative compact layout:

```text
Sidebar
├── Home
├── Family
├── Care
├── Memory
└── Ask
```

---

# 9. Screen Map

## 9.1 Sign In

Purpose:
- Google OAuth
- clean onboarding

Actions:
- Continue with Google

---

## 9.2 Home / Today

Purpose:
- show family mental load in one place

Example:

```text
Good afternoon

Today

Emma
Amoxicillin 5ml
✓ Morning dose
○ Evening dose · 8:00 PM

Needs attention
Emma’s follow-up is due in 3 days

Upcoming
Pediatrician follow-up
```

Primary actions:
- Add health record
- Ask AI
- Open family member

---

## 9.3 Family

Family tree / family graph:

```text
Parent A ─── Parent B
      │
  ┌───┴────┐
Emma      Noah
```

Each person is clickable.

Use simple graph/tree UI.

---

## 9.4 Family Member Profile

Example: Emma

Tabs:

```text
Overview
Timeline
Memory Graph
Records
```

Overview:
- active care episode
- current medication
- upcoming follow-up
- last few health events

---

## 9.5 Add Health Record

Generic upload flow.

Do not label it only “Upload Prescription”.

Input options:

- Upload image
- Upload PDF
- Take photo
- optional: add note

After upload:
- original stored in Cloudinary
- understanding pipeline starts

---

## 9.6 Record Review

The AI first determines what the record is.

Possible types:

- prescription
- lab report
- vaccination record
- discharge summary
- doctor note
- imaging/report result
- other
- unknown

Example review:

```text
I found this care plan for Emma

Record type
Prescription

Medication
Amoxicillin 5ml

Frequency
Twice daily

Duration
15 days

Instructions
After meals

Follow-up
Review in 2 weeks
```

Actions:
- Confirm and create care plan
- Edit
- Cancel

If confidence is low:

```text
I’m not fully sure what this document is.

Is this:
- Prescription
- Lab report
- Discharge summary
- Other
```

Do not silently hallucinate.

---

## 9.7 Care Episode

Example:

```text
Emma — Ear Infection
Day 4 of 15

Medication
Amoxicillin · 5ml · twice daily

Progress
7 / 30 doses recorded

Timeline
Sep 6 — Prescription uploaded
Sep 6 — Treatment started
Sep 8 — Evening dose missed
Sep 9 — Rash reported
Sep 20 — Follow-up due
```

---

## 9.8 Medication / Dose View

Example:

```text
Today

8:00 AM
Amoxicillin
✓ Taken
Given by Mom

8:00 PM
Amoxicillin
○ Due
Assigned to Dad
```

Actions:
- Taken
- Missed
- Skipped
- assign caregiver

---

## 9.9 Ask / Assistant

One assistant for text and voice.

User examples:

```text
What medicine is Emma taking?
Dad gave Emma her evening medicine.
Emma developed a rash today.
What happened during her treatment?
Prepare a summary for the doctor.
```

The agent should decide whether the message is:
- a question
- a care action
- a memory-worthy health update
- a calendar/follow-up request
- a summary request

---

## 9.10 Memory Graph

Per-member graph.

Example:

```text
Emma
 ├── had episode → Ear Infection
 ├── prescribed → Amoxicillin
 ├── treated by → Dr Smith
 ├── symptom → Rash
 └── caregiver → Dad
```

Graph must be derived from actual stored memory/relationships, not hardcoded decorative nodes.

Use React Flow.

---

# 10. Technical Stack

## Application

- Next.js
- TypeScript
- React
- App Router
- Server Actions / Route Handlers
- Tailwind CSS
- shadcn/ui

## Database

- Supabase Postgres

Use Postgres as the source of truth.

## Auth

- Supabase Auth
- Google OAuth provider

## Files / Record Storage

- Cloudinary

Store:
- images
- PDFs where appropriate
- upload metadata

Postgres should store:
- Cloudinary public ID
- secure URL
- MIME type
- uploaded timestamp
- related family member
- record type

## AI / Agent Layer

- LangGraph JS
- LangChain JS provider adapters

## LLM providers

Support:
- Gemini
- Groq
- OpenRouter

The app must not be tightly coupled to one provider.

## Memory

Preferred:
- Cognee

Fallback/alternative:
- Mem0

Use a memory-provider abstraction.

## Voice

### STT
Primary candidate:
- Deepgram

Fallback:
- Groq Whisper

### TTS
V1:
- Browser SpeechSynthesis API

Optional later:
- dedicated TTS provider

## Calendar

- Google Calendar API / OAuth

## Optional Later

- WhatsApp Cloud API

---

# 11. Architecture Principles

```text
LangGraph = orchestration
LLM = reasoning
Postgres = application truth
Cognee/Mem0 = long-term contextual memory
Cloudinary = raw uploaded records
Google Calendar = external scheduling action
Deepgram/Groq Whisper = speech input
```

Do not store the same kind of truth in multiple systems without clear ownership.

---

# 12. Postgres vs Memory Responsibilities

## Postgres owns deterministic state

Store here:

- users
- families
- family members
- uploaded records
- care episodes
- medications
- medication schedules
- medication doses
- dose status
- caregivers
- follow-ups
- appointments
- calendar connection metadata
- health events
- agent action logs if needed

Examples:

```text
Dose #12 = taken
Follow-up date = Sep 20
Care Episode status = active
Medication duration = 15 days
```

## Cognee / Mem0 owns long-term contextual understanding

Examples:

```text
Emma previously had an ear infection.
Emma was prescribed amoxicillin.
A rash was reported during that treatment.
Dad often handles evening medication.
Dr Smith treated Emma.
```

Memory can hold:
- episodic memory
- semantic memory
- relational context

It should not replace deterministic relational state.

---

# 13. Memory Model

## Episodic Memory

Events with time/context.

Examples:

```text
Sep 6 — Emma started amoxicillin.
Sep 9 — Rash reported.
Sep 11 — Evening dose missed.
```

## Semantic Memory

Long-term facts/relationships.

Examples:

```text
Emma’s pediatrician is Dr Smith.
Emma previously had a rash during amoxicillin treatment.
Dad often handles evening care.
```

## Memory provenance

Every important memory should ideally include:

- source type
- source ID
- created at
- family member ID
- care episode ID if relevant
- confidence/category

Example:

```text
Memory:
Rash reported during treatment

Source:
User message / voice transcript

Family member:
Emma

Episode:
Ear Infection Sep 2026

Status:
Parent-reported
```

---

# 14. Memory Provider Abstraction

Create a provider interface.

Example:

```ts
export interface MemoryProvider {
  addMemory(input: AddMemoryInput): Promise<MemoryRecord>
  searchMemory(input: SearchMemoryInput): Promise<MemoryRecord[]>
  updateMemory(input: UpdateMemoryInput): Promise<MemoryRecord>
  deleteMemory?(id: string): Promise<void>
}
```

Implement:

```text
CogneeMemoryProvider
```

Optional later:

```text
Mem0MemoryProvider
```

The rest of the application should depend only on the interface.

---

# 15. LLM Provider Abstraction

Do not directly call Gemini/Groq/OpenRouter throughout the codebase.

Create one model layer.

Example:

```ts
type Provider = "gemini" | "groq" | "openrouter"

type ModelPurpose =
  | "chat"
  | "record_understanding"
  | "reasoning"
  | "summary"
```

Config example:

```ts
interface ModelConfig {
  provider: Provider
  model: string
  temperature?: number
}
```

Recommended environment structure:

```env
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_LLM_MODEL=<model-name>

RECORD_LLM_PROVIDER=gemini
RECORD_LLM_MODEL=<vision-capable-model>

FAST_LLM_PROVIDER=groq
FAST_LLM_MODEL=<fast-model>

FALLBACK_LLM_PROVIDER=openrouter
FALLBACK_LLM_MODEL=<fallback-model>
```

---

# 16. Model Fallback Strategy

Implement provider fallback.

Example:

```text
Primary model
   ↓
success → return result
   ↓
timeout / rate-limit / provider error
   ↓
fallback model
   ↓
optional second fallback
```

Do not retry dangerous/invalid structured output forever.

Suggested fallback categories:

### Record understanding
1. Gemini multimodal
2. OpenRouter multimodal model

### Fast conversation
1. Groq
2. Gemini
3. OpenRouter

### Complex summary/reasoning
1. Gemini/OpenRouter
2. fallback provider

All LangGraph nodes should request a model by **purpose**, not by provider name.

Example:

```ts
getModel("record_understanding")
getModel("chat")
getModel("summary")
```

---

# 17. Record Understanding Pipeline

This pipeline must be generic.

Do not assume every upload is a prescription.

## Pipeline

```text
Upload
  ↓
Cloudinary
  ↓
Create HealthRecord row
  ↓
Send asset to multimodal understanding model
  ↓
Classify document
  ↓
Extract structured content
  ↓
Evaluate confidence
  ↓
If uncertain → ask user
  ↓
Show structured review
  ↓
User confirms
  ↓
Create/update care data
  ↓
Write relevant memory
```

---

# 18. Record Classification Schema

Possible values:

```ts
type HealthRecordType =
  | "prescription"
  | "lab_report"
  | "vaccination"
  | "discharge_summary"
  | "doctor_note"
  | "imaging_report"
  | "other"
  | "unknown"
```

Structured model output should include:

```ts
interface RecordUnderstandingResult {
  recordType: HealthRecordType
  confidence: number
  memberCandidate?: {
    name?: string
    confidence?: number
  }
  summary: string
  medications?: ExtractedMedication[]
  followUps?: ExtractedFollowUp[]
  tests?: ExtractedTest[]
  healthFacts?: ExtractedHealthFact[]
  requiresUserClarification: boolean
  clarificationQuestion?: string
}
```

---

# 19. Human Confirmation

Any record-derived action should be user-confirmed before activation.

Especially:

- medication schedule
- follow-up
- test reminder
- calendar event
- assigning a family member

Flow:

```text
AI extracts
↓
Review screen
↓
User confirms/edits
↓
Persist
↓
Create actions
```

---

# 20. Care Episode Model

A Care Episode is the central product object.

Example:

```text
Emma
└── Ear Infection
    ├── original records
    ├── medications
    ├── dose history
    ├── symptoms
    ├── caregiver activity
    ├── follow-up
    └── generated summary
```

Possible statuses:

```ts
"draft" | "active" | "completed" | "archived"
```

---

# 21. Suggested Database Schema

## users

```text
id
email
name
avatar_url
created_at
```

## families

```text
id
owner_user_id
name
created_at
```

## family_members

```text
id
family_id
name
relationship
date_of_birth
avatar_url
notes
created_at
```

## health_records

```text
id
family_id
family_member_id
cloudinary_public_id
cloudinary_url
mime_type
record_type
record_date
status
raw_ai_output_json
confirmed_at
created_at
```

## care_episodes

```text
id
family_member_id
title
reason
status
start_date
end_date
primary_record_id
created_at
updated_at
```

## medications

```text
id
care_episode_id
name
dose
unit
frequency
duration_days
instructions
start_date
end_date
created_at
```

## medication_doses

```text
id
medication_id
scheduled_at
status
taken_at
caregiver_member_id
caregiver_user_id
notes
created_at
```

Statuses:

```text
scheduled
taken
missed
skipped
```

## health_events

```text
id
family_member_id
care_episode_id
event_type
title
description
occurred_at
source_type
source_id
reported_by_user_id
created_at
```

## follow_ups

```text
id
care_episode_id
family_member_id
title
due_at
status
source_record_id
google_calendar_event_id
created_at
```

## calendar_connections

```text
id
user_id
provider
access_metadata
created_at
updated_at
```

## agent_threads

```text
id
user_id
family_id
langgraph_thread_id
created_at
updated_at
```

Optional:
- agent_action_log
- memory_reference
- notification table

---

# 22. LangGraph Architecture

Use one main orchestrator.

Do not build a swarm.

## Main graph

```text
START
  ↓
Load Context
  ↓
Understand Intent
  ↓
Route
  ├── Ask Question
  ├── Health Record Flow
  ├── Care Action
  ├── Health Event / Memory
  ├── Follow-up / Calendar
  └── Generate Summary
  ↓
Execute Tools
  ↓
Persist Changes
  ↓
Update Memory if appropriate
  ↓
Generate Response
  ↓
END
```

---

# 23. LangGraph State

Suggested state:

```ts
interface CareAgentState {
  userId: string
  familyId: string
  activeFamilyMemberId?: string
  threadId: string

  messages: BaseMessage[]

  intent?: CareIntent

  familyContext?: FamilyContext
  activeEpisode?: CareEpisodeContext

  toolResults?: ToolResult[]

  memoryContext?: MemoryRecord[]

  pendingConfirmation?: ConfirmationRequest

  response?: string
}
```

---

# 24. Suggested Agent Intents

```ts
type CareIntent =
  | "ask_question"
  | "upload_record"
  | "mark_dose"
  | "add_health_event"
  | "create_follow_up"
  | "calendar_action"
  | "prepare_summary"
  | "family_member_action"
  | "unknown"
```

---

# 25. Agent Tools

Keep tools explicit and deterministic.

Suggested tools:

```text
getFamilyMembers
getFamilyMember
getActiveCareEpisode
getRecentCareEpisodes

createCareEpisode
updateCareEpisode

createMedicationPlan
getMedicationSchedule
markDoseTaken
markDoseMissed
assignDoseCaregiver

createHealthEvent
getHealthEvents

createFollowUp
getPendingFollowUps

searchMemory
writeMemory

createGoogleCalendarEvent
getRelevantCalendarEvents

generateCareSummary
```

Record parsing can be a specialized service/node rather than an agent tool.

---

# 26. Chat / Voice Technical Flow

Voice and text must use the same agent.

## Text

```text
Text input
↓
LangGraph
↓
Tool/action/memory
↓
Response
```

## Voice

```text
Mic
↓
Browser MediaRecorder
↓
STT provider
↓
Transcript
↓
same LangGraph flow
↓
Text response
↓
optional Browser SpeechSynthesis
```

No separate “voice memory” system.

---

# 27. STT Abstraction

Create:

```ts
interface SpeechToTextProvider {
  transcribe(audio: Blob | Buffer): Promise<string>
}
```

Possible implementations:

```text
DeepgramSpeechToTextProvider
GroqWhisperSpeechToTextProvider
```

Select with environment config.

---

# 28. TTS

V1:

```text
Browser speechSynthesis
```

No backend TTS dependency required.

Add a small audio toggle:
- Speak responses on/off

---

# 29. Google Calendar Flow

Use Calendar for meaningful commitments:

- doctor appointment
- follow-up
- blood test
- vaccination
- larger care task

Do not create every medication dose as Calendar events.

Example:

```text
Record says:
“Review after 2 weeks”
↓
AI extracts follow-up
↓
Create FollowUp row
↓
User confirms
↓
Prompt:
“Add this to Google Calendar?”
↓
Create Calendar event
↓
Store google_calendar_event_id
```

---

# 30. Proactive Follow-up

This is a major demo differentiator.

Create a scheduled/background check.

For demo purposes this can be:
- a cron route
- Supabase cron
- Vercel Cron
- manual “run proactive check” in development

Logic:

```text
Find unresolved follow-ups
↓
Due soon?
↓
Check linked calendar event/status
↓
If missing:
create proactive insight
```

Example:

```text
Emma’s follow-up is due in 3 days.
I don’t see it scheduled yet.
```

For demo, in-app proactive alert is enough.

---

# 31. WhatsApp — Optional Phase

Do not block core demo on WhatsApp.

If added:

```text
WhatsApp Cloud API
↓
Webhook
↓
Resolve user/family
↓
Send text into same LangGraph agent
↓
Agent executes tools
↓
Reply via WhatsApp
```

Same brain, same memory, same data.

No separate WhatsApp-specific AI.

---

# 32. Family Tree vs Memory Graph

These are separate concepts.

## Family Tree

Shows people and relationships.

```text
Parent A ─ Parent B
     │
 ┌───┴───┐
Emma    Noah
```

## Memory Graph

Shows what the AI understands about one member.

```text
Emma
 ├── had episode → Ear Infection
 ├── medication → Amoxicillin
 ├── symptom → Rash
 ├── doctor → Dr Smith
 └── caregiver → Dad
```

This distinction should be visible in UI.

---

# 33. Memory Graph Implementation

Use:
- React Flow
- API endpoint to retrieve normalized graph data

Example response:

```ts
interface MemoryGraphResponse {
  nodes: {
    id: string
    type: string
    label: string
    metadata?: Record<string, unknown>
  }[]

  edges: {
    id: string
    source: string
    target: string
    relation: string
  }[]
}
```

Adapter converts Cognee result → UI graph.

Do not make React Flow depend on Cognee’s native response shape directly.

---

# 34. Suggested Next.js Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   ├── page.tsx
│   │   ├── family/
│   │   ├── care/
│   │   ├── memory/
│   │   └── ask/
│   ├── api/
│   │   ├── chat/
│   │   ├── voice/
│   │   ├── records/
│   │   ├── calendar/
│   │   └── cron/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── family/
│   ├── care/
│   ├── records/
│   ├── chat/
│   └── memory/
│
├── lib/
│   ├── ai/
│   │   ├── models/
│   │   ├── langgraph/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   └── tools/
│   │
│   ├── memory/
│   │   ├── provider.ts
│   │   ├── cognee.ts
│   │   └── mem0.ts
│   │
│   ├── voice/
│   │   ├── provider.ts
│   │   ├── deepgram.ts
│   │   └── groq-whisper.ts
│   │
│   ├── cloudinary/
│   ├── supabase/
│   ├── calendar/
│   └── utils/
│
├── server/
│   ├── services/
│   ├── repositories/
│   └── actions/
│
├── types/
└── config/
```

---

# 35. Environment Variables

Example:

```env
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

DEFAULT_LLM_PROVIDER=gemini
DEFAULT_LLM_MODEL=

FAST_LLM_PROVIDER=groq
FAST_LLM_MODEL=

FALLBACK_LLM_PROVIDER=openrouter
FALLBACK_LLM_MODEL=

GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=

MEMORY_PROVIDER=cognee
COGNEE_API_KEY=
MEM0_API_KEY=

STT_PROVIDER=deepgram
DEEPGRAM_API_KEY=

# optional fallback
GROQ_WHISPER_MODEL=

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
```

Never expose server keys through `NEXT_PUBLIC_`.

---

# 36. Error Handling

## Record extraction failure

Show:

```text
I couldn’t confidently understand this record.
You can try another image or tell me what type of record it is.
```

## Model provider failure

- log provider error
- attempt configured fallback
- return safe user-facing message if all fail

## Memory provider failure

The core care action should still succeed if Postgres write succeeded.

Memory is enhancement, not source of truth.

Example:
- dose marked taken in Postgres
- Cognee write fails
- return successful dose action
- log/retry memory write separately

## Calendar failure

Do not fail care-plan creation because Google Calendar failed.

---

# 37. Security / Demo-Safe Principles

Even though this is a prototype:

- use authenticated routes
- scope all queries by family/user
- use Supabase RLS
- avoid public medical asset URLs if possible
- use signed/controlled Cloudinary delivery
- do not expose service role keys
- do not send unnecessary data to LLMs
- log minimal sensitive content
- clearly label parent-reported vs document-derived information
- never claim diagnosis
- require confirmation for extracted care actions

---

# 38. Build Milestones

## Milestone 0 — Repo + Foundations

Goal:
project runs with design system and auth shell.

Tasks:
- create Next.js TypeScript repo
- configure Tailwind + shadcn
- add design tokens
- configure Supabase
- Google auth
- authenticated app layout
- sidebar/navigation
- seed demo user/family

Done when:
- user can sign in
- sees styled app shell

---

## Milestone 1 — Family

Goal:
family context exists.

Tasks:
- families table
- family_members table
- add member form
- family list/tree UI
- member profile page

Done when:
- user can add Emma/Noah
- click a member and see profile

---

## Milestone 2 — Records + Cloudinary

Goal:
upload a generic health record.

Tasks:
- Cloudinary integration
- upload image/PDF
- health_records table
- file preview
- upload metadata

Done when:
- record is stored and linked to family member

---

## Milestone 3 — AI Record Understanding

Goal:
AI can understand uploaded health records.

Tasks:
- LLM abstraction
- Gemini/Groq/OpenRouter adapters
- fallback logic
- multimodal record understanding
- Zod structured output
- record classification
- confidence handling
- record review UI

Done when:
- upload → structured review works

---

## Milestone 4 — Care Episode + Medication

Goal:
confirmed prescription creates an actionable episode.

Tasks:
- care_episodes
- medications
- medication_doses
- care-plan service
- deterministic dose generation
- care episode page
- Today medication cards

Done when:
- 15 days × twice daily creates 30 dose rows
- user can mark dose taken/missed

---

## Milestone 5 — LangGraph Assistant

Goal:
text chat can reason and execute actions.

Tasks:
- LangGraph state
- intent routing
- tool registry
- family/member context loading
- mark-dose tool
- add-health-event tool
- query care episode
- generate response

Done when:
user can type:

```text
Dad gave Emma her evening medicine.
```

and the correct dose is updated.

---

## Milestone 6 — Memory

Goal:
important context persists beyond the current chat.

Tasks:
- MemoryProvider abstraction
- Cognee integration
- memory writes
- memory retrieval
- member-scoped memory
- episodic + semantic categorization

Done when:
- user reports rash
- new conversation can retrieve that event/context

---

## Milestone 7 — Memory Graph

Goal:
make memory visible.

Tasks:
- normalize Cognee graph output
- memory graph API
- React Flow UI
- Timeline view
- member graph filters

Done when:
Emma’s page visually shows:

```text
Emma → Ear Infection → Amoxicillin → Rash
```

---

## Milestone 8 — Voice

Goal:
same agent works via microphone.

Tasks:
- MediaRecorder
- STT abstraction
- Deepgram integration
- Groq Whisper fallback
- transcript UI
- send transcript to LangGraph
- Browser speechSynthesis optional response

Done when:
user can say:

```text
Emma developed a rash today.
```

and the same text-agent workflow executes.

---

## Milestone 9 — Follow-ups + Calendar

Goal:
care commitments become external actions.

Tasks:
- follow_ups table
- Google Calendar OAuth
- create event tool
- add-to-calendar UI
- calendar event ID linkage

Done when:
- extracted “review in 2 weeks”
- user can add follow-up to Google Calendar

---

## Milestone 10 — Proactive Care

Goal:
show agentic follow-up behavior.

Tasks:
- due-soon query
- cron/dev proactive checker
- unresolved commitment logic
- in-app proactive alert

Done when:
system can surface:

```text
Emma’s follow-up is due in 3 days and is not scheduled.
```

---

## Milestone 11 — Care Summary

Goal:
close the care loop.

Tasks:
- summary retrieval
- combine:
  - record
  - episode
  - dose adherence
  - events
  - memory
  - follow-up
- generate structured care brief

Done when:
user asks:

```text
Prepare Emma’s summary for the doctor.
```

and gets a clean sourced summary.

---

## Milestone 12 — Polish

Goal:
make it founder-demo ready.

Tasks:
- loading states
- animation
- empty states
- graph polish
- demo seed data
- failure handling
- responsive desktop layout
- preloaded sample document
- scripted demo scenario
- remove debug UI

---

# 39. Optional Milestone — WhatsApp

Only after core demo is complete.

Tasks:
- WhatsApp Cloud API webhook
- identity mapping
- send incoming message into same LangGraph agent
- send assistant reply back

Demo example:

```text
Dad gave Emma her medicine.
```

via WhatsApp updates the same care episode.

---

# 40. Founder Demo Script

Target length:
60–90 seconds.

## 0–10 sec

Show family home.

Explain:

> This explores what health memory could look like inside a family assistant.

## 10–25 sec

Upload prescription.

AI extracts:
- medicine
- dose
- frequency
- duration
- follow-up

Confirm care plan.

## 25–40 sec

Show:
- 30 expected doses
- Today screen

Mark or say:

> Dad gave Emma her evening medicine.

Agent updates the dose.

## 40–55 sec

Say/type:

> Emma developed a rash today.

Show:
- timeline event
- memory update

## 55–70 sec

Open Memory Graph.

Show:

```text
Emma → Ear Infection → Amoxicillin → Rash
```

## 70–80 sec

Show proactive card:

> Emma’s follow-up is due soon and is not scheduled.

Add to Calendar.

## 80–90 sec

Ask:

> Prepare Emma’s doctor summary.

Show concise care brief.

End.

---

# 41. Acceptance Criteria

The founder demo is ready when:

- Google sign-in works
- family member can be added
- record can be uploaded
- AI can classify and extract useful information
- user confirms care plan
- medication schedule is created
- dose status can be updated through chat
- voice input reaches same agent
- health event can be added naturally
- memory persists across sessions
- per-member memory graph renders
- follow-up can be added to Google Calendar
- proactive unscheduled follow-up alert can be shown
- care summary can be generated
- all main screens match the intended design language

---

# 42. Recommended Build Order

Do not start with LangGraph.

Recommended order:

```text
1. UI shell
2. Auth
3. Family
4. DB schema
5. Record upload
6. Record understanding
7. Care plan
8. Medication state
9. LangGraph
10. Memory
11. Graph
12. Voice
13. Calendar
14. Proactive logic
15. Summary
16. Polish
```

This keeps the app usable while AI layers are being added.

---

# 43. Suggested GitHub Repository Names

Keep the repo name neutral because this is a prototype inspired by a product direction, not an official Anna codebase.

## Best options

```text
family-care-agent
```

```text
family-health-memory
```

```text
care-memory-ai
```

```text
family-care-ai
```

```text
care-episode-agent
```

```text
health-memory-agent
```

```text
family-health-copilot
```

```text
careloop-ai
```

```text
family-care-memory
```

```text
caregraph-ai
```

## Recommended

### `family-care-agent`

Why:
- clear
- technically accurate
- not overbranded
- works well for a public GitHub repo
- leaves room for records, memory, voice, calendar, and agents

Alternative if the memory graph is the main technical showcase:

### `caregraph-ai`

Alternative if you want the product concept to be obvious:

### `family-health-memory`

---

# 44. Suggested Internal Working Name

For UI/demo copy, use a neutral temporary name such as:

```text
Care Memory
```

or:

```text
Family Care
```

Avoid presenting it as an official Anna feature unless explicitly positioning the demo as an “exploration for Anna”.

Suggested demo intro:

> “An exploration of what family health memory and care coordination could look like inside an assistant like Anna.”

---

# 45. AI Build Instructions

When giving this blueprint to an AI coding assistant:

1. implement milestone-by-milestone
2. do not jump ahead
3. do not replace architecture without explaining why
4. use TypeScript everywhere possible
5. keep providers abstract
6. validate LLM structured output with Zod
7. keep business state in Postgres
8. keep memory provider isolated
9. keep tools deterministic
10. require confirmation before creating health actions from AI extraction
11. do not hardcode graph nodes
12. do not expose provider API keys client-side
13. keep UI aligned with the design tokens in this document
14. write reusable services instead of mixing provider calls directly into components
15. prefer demo reliability over excessive architectural complexity

---

# 46. Final Architecture Summary

```text
                    USER
                      │
        ┌─────────────┼───────────────┐
        │             │               │
       Chat          Voice          Upload
        │             │               │
        │            STT          Cloudinary
        │             │               │
        └─────────────┼───────────────┘
                      ↓
                LangGraph Agent
                      │
      ┌───────────────┼────────────────┐
      │               │                │
      ▼               ▼                ▼
   Postgres          Memory         Integrations
   Supabase       Cognee/Mem0      Google Calendar
      │               │              WhatsApp later
      │               │
      └───────┬───────┘
              ↓
         AI Response
              │
       Text + optional TTS
```

Final principle:

> **LLM understands and reasons. LangGraph orchestrates. Postgres owns factual state. Cognee/Mem0 provides long-term context. Cloudinary stores records. Calendar/WhatsApp execute external actions.**

---

# 47. Definition of Done

The prototype is done when a founder can watch one short demo and understand all of the following without explanation:

- this is a family product, not a generic health chatbot
- the AI can understand real health records
- it converts those records into actionable care
- family members can coordinate medication and follow-ups
- chat and voice use the same intelligent assistant
- the assistant remembers health context over time
- the memory is visible and relational
- the assistant can proactively catch something that may be forgotten
- the product closes the loop with a useful care summary

That is the target.