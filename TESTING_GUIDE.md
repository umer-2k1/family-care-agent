# Care Memory - Founder Demo and Test Guide

## Purpose

This guide lets you run a confident founder demo and verify the application in a structured way. It separates the safe local demo from production-mode checks that require real credentials.

Care Memory helps families turn health records and everyday updates into confirmed care plans, medication actions, follow-ups, long-term context, and doctor-ready summaries. It is not a diagnostic, emergency, pharmacy, or clinical decision-making product.

## Before you start

### Quick founder demo

Use the built-in isolated demo. It has seeded Emma care data and makes no external changes.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Confirm `.env.local` includes:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Open [http://localhost:3000](http://localhost:3000).

### Automated quality gate

Run these before a demo, especially after a code change:

```bash
pnpm test
pnpm lint
pnpm build
```

Expected result: all commands finish successfully. A failure means the build should not be presented as verified.

## Recommended founder story

Use this sequence. It demonstrates the most compelling connected experience in under ten minutes.

1. Start at **Home** and explain that Emma has an active care plan with a next dose and a follow-up that needs attention.
2. Open **Care**, show the Amoxicillin plan, select a caregiver if desired, and mark the next dose as taken.
3. Open **Ask**, send `Dad gave Emma her evening medicine.` Show that the assistant understands the care context and caregiver attribution.
4. Send `Emma developed a rash today.` Show that a caregiver update becomes a health event and episodic memory.
5. Send `Prepare Emma's summary for the doctor.` Show the concise, context-aware summary.
6. Open **Memory** and show Emma's connected history, including treatment, reported rash, and caregiver context.
7. Return to **Home** and point out the follow-up. Select **Add to calendar** only in a credential-backed environment, since demo mode intentionally has no calendar side effect.

Founder message: Care Memory does not silently turn AI output into care actions. A person reviews and confirms extracted plans before medication schedules or follow-ups become active.

## Manual feature checklist

Record the date, tester, environment, and result for each item. Use `Pass`, `Fail`, `Blocked`, or `Not applicable`.

| Area | Test steps | Expected result | Wrong result |
| --- | --- | --- | --- |
| App shell | Visit `/`, then use Home, Family, Care, Memory, and Ask navigation. Resize to a narrow browser window. | All routes load; desktop sidebar becomes mobile bottom navigation; active section is clear. | Broken links, hidden primary navigation, or overlapping content. |
| Home dashboard | Open **Home**. | Emma's active care, next scheduled dose, progress, and unresolved follow-up are visible in demo mode. | Missing care context or misleading completed state. |
| Family list | Open **Family** and select Emma. | Family cards appear; Emma opens a scoped profile. | A member is missing, wrong profile opens, or an unknown profile displays data. |
| Member profile | On Emma's profile, review care overview, timeline, records, memory count, memory graph, and member details. | Details reconcile with the demo story. | Care, history, record, or memory data conflict. |
| Add family member | In configured mode, select **Add member**, enter name and relationship, then save. In demo mode, attempt the same action. | Configured mode saves a member within the signed-in family. Demo mode clearly says it must be connected to Supabase to save. | An invalid form saves, another family's member appears, or demo mode pretends to persist data. |
| Update family member | In configured mode, change Emma's notes and save. Refresh the page. | The change persists only for the authenticated family. | Change disappears, updates the wrong person, or unauthorized data appears. |
| Care workspace | Open **Care**. | Active medication, dose count, next dose controls, follow-up, and dose timeline are visible. | Medication instructions, count, or follow-up are absent or inconsistent. |
| Dose recording | Select a caregiver, then use **Mark taken**, **Mark missed**, and **Skip** on separate scheduled doses. | Status updates immediately; selected caregiver appears when one was selected. | Wrong dose changes, status does not update, or caregiver attribution is wrong. |
| Record upload and review | On **Care**, choose a family member and upload a JPG, PNG, WebP, or PDF under 10 MB. Review the extracted plan. | Preview and review dialog appear. In demo mode, the plan shows Amoxicillin, 5 ml, twice daily, 15 days. | File is accepted without a family member, unsupported file is accepted, no review occurs, or values cannot be reviewed. |
| Human confirmation | In the review dialog, edit a field if desired, then select **Confirm and create care plan**. | Confirmation is required before the care plan is created. A twice-daily 15-day plan reports 30 doses. | Care state appears before confirmation, or dose count is not 30. |
| Clarification path | In configured mode, upload a record with uncertain classification. | The application asks a clarification question and requires user confirmation. | Low-confidence extraction directly creates active care. |
| Assistant: dose update | Open **Ask** and send `Dad gave Emma her evening medicine.` | Assistant confirms the evening Amoxicillin dose and Dad's attribution. | Assistant changes unrelated care or invents unsupported information. |
| Assistant: health event | Send `Emma developed a rash today.` | Assistant records a parent-reported rash and advises mentioning it at follow-up. | The assistant diagnoses the rash, makes unsupported claims, or does not retain the event. |
| Assistant: summary | Send `Prepare Emma's summary for the doctor.` | A concise summary includes treatment, dose progress, rash, and follow-up context. | Summary omits important stored context or presents clinical diagnosis. |
| Assistant: calendar boundary | Send `Can you add the follow-up to my calendar?` | Assistant describes the pending follow-up and requires confirmation before any Calendar action. | A calendar event is created without user confirmation. |
| Assistant: general question | Ask a neutral care question. | Assistant states it can help with active medication, timeline, follow-up, and sourced summary. | Assistant promises diagnosis, triage, or emergency advice. |
| Voice input | On **Ask**, select the microphone, allow access, say a short update, then stop recording. | Browser captures audio and displays transcript plus assistant response. Demo mode returns the seeded rash transcript. | Permission denial is unclear, recording does not stop, or no failure message appears when access is denied. |
| Spoken replies | Select **Speak replies**, send a message, and listen. | Browser speech synthesis reads the next assistant reply when supported by the browser. | Toggle does nothing on a supported browser or reads the wrong message. |
| Memory graph | Open **Memory** and switch among family members. | Graph and memory cards change for the selected member. Source label accurately says Demo seed, Cognee knowledge graph, or Postgres availability fallback. | Graph is attributed to Cognee when it is fallback data, or member selection does not change context. |
| Follow-up Calendar | In configured mode with Google connected, choose **Add to Google Calendar** from Home or Care and complete confirmation. | One linked event is created for the confirmed meaningful follow-up. Repeating the action does not create duplicates. | Individual medication doses create events, event is created without confirmation, or duplicate events appear. |
| Sign-in and sign-out | In configured mode, visit `/login`, sign in with Google, then sign out. | Authenticated routes resolve the user's family; sign-out ends the session. | Routes expose family data without a session, or user remains signed in after sign-out. |
| Health endpoint | In demo mode and configured mode, visit `/api/health`. | Demo responds as ready for demo. Configured mode identifies incomplete integration groups with HTTP 503 until all required settings exist. | Missing production configuration is treated as ready. |

## Production-mode acceptance tests

Only use this section after completing `.env.local`, applying Supabase migrations, and setting:

```env
NEXT_PUBLIC_DEMO_MODE=false
```

Do not use real patient information for a founder rehearsal unless your organization has approved the data handling and access controls.

| Integration | Setup needed | Test | Pass condition |
| --- | --- | --- | --- |
| Supabase and RLS | Supabase URL, keys, migrations, Google provider | Sign in as two separate test users and create separate family data. | Each user can access only their own family workspace. |
| Cloudinary | Cloud name, API key, API secret | Upload an image and PDF. | Protected assets upload and their metadata is linked to the correct family record. |
| Record AI | At least one record model provider | Upload a clear prescription and an ambiguous record. | Clear record enters review; ambiguous record requests clarification; no plan is activated before confirmation. |
| Care persistence | Supabase schema applied | Confirm the 5 ml, twice-daily, 15-day prescription and refresh. | Exactly 30 durable doses are created and status changes persist with caregiver provenance. |
| Assistant providers | Default and fallback model credentials | Repeat the dose, rash, summary, and calendar prompts. | Agent uses the active episode and saved context; provider failure uses configured bounded fallback when available. |
| Memory provider | Cognee or Mem0 credentials | Report a health event, open a new assistant thread, then view Memory. | Context can be retrieved later; graph source label honestly identifies provider or fallback. |
| Voice transcription | Deepgram and optional Groq fallback | Record a spoken update. Temporarily make primary transcription unavailable if safely possible. | Transcript reaches the same assistant flow; configured fallback is used when primary fails. |
| Google Calendar | OAuth, encrypted token key, callback allow list | Confirm a follow-up event twice. | One idempotent Calendar event is created only after confirmation. |
| Proactive checks | Strong `CRON_SECRET` and scheduler | Call `GET /api/cron/proactive` with `Authorization: Bearer <secret>`. | Authorized job processes pending checks; missing or bad authorization is rejected. |

## Edge and failure checks

These checks demonstrate quality and safety, not just happy paths.

- Upload a file over 10 MB or an unsupported format such as `.txt`. Expect a clear rejection stating that only JPG, PNG, WebP, or PDF files up to 10 MB are supported.
- Try uploading without selecting a family member. The action should not proceed.
- Submit the Add member form without a name or relationship. The form should display validation feedback and not save.
- Send an empty assistant message. No request should be submitted.
- Deny microphone permission. The assistant should explain that microphone permission is unavailable.
- Try a Calendar action without confirmation. No Calendar event should be created.
- Run configured mode without required secrets. `/api/health` should expose readiness problems and protected flows should fail closed.
- In a two-user test, manually change a URL member ID to the other user's member. No cross-family profile, care, record, memory, or dose data should be returned.

## Founder-ready test record

Copy this section for each rehearsal or release candidate.

```text
Build or commit:
Environment: Demo / Configured
Tester:
Date and time:

Automated checks
- pnpm test: Pass / Fail
- pnpm lint: Pass / Fail
- pnpm build: Pass / Fail

Founder story completed: Pass / Fail
Manual checklist result: ___ passed, ___ failed, ___ blocked
Production integrations tested: [list]
Known limitations or blockers:
Decision: Ready for founder demo / Needs fixes
```

## Known demo boundaries

The default demo mode is intentionally safe and non-persistent. It is appropriate for showing the product narrative, interface, record-review experience, dose controls, assistant responses, voice interface, and seeded memory graph.

It does not prove live Google sign-in, database persistence, RLS, Cloudinary storage, model-provider calls, external memory retrieval, speech-to-text, Google Calendar creation, or scheduled proactive checks. Those items must be marked as tested only after the production-mode acceptance tests above have passed with test accounts and credentials.
