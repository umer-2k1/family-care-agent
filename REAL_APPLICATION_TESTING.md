# Real Application Testing Steps

Use this document only when testing Care Memory with real integrations. Do not use demo mode.

Use test accounts and non-sensitive sample records. Do not upload real patient records unless privacy, access-control, and compliance requirements have been approved.

## 1. Configure the real environment

Create the local environment file:

```bash
cp .env.example .env.local
```

Set demo mode to false:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add the following real values to `.env.local`.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Google sign-in and Google Calendar
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
TOKEN_ENCRYPTION_KEY=YOUR_64_CHARACTER_HEX_KEY

# Cloudinary record uploads
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_SECRET

# AI provider
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_LLM_MODEL=YOUR_MODEL_NAME
RECORD_LLM_PROVIDER=gemini
RECORD_LLM_MODEL=YOUR_MODEL_NAME
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Optional AI fallback
FALLBACK_LLM_PROVIDER=openrouter
FALLBACK_LLM_MODEL=YOUR_FALLBACK_MODEL_NAME
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY

# Voice transcription
STT_PROVIDER=deepgram
DEEPGRAM_API_KEY=YOUR_DEEPGRAM_KEY

# Long-term memory
MEMORY_PROVIDER=cognee
COGNEE_API_URL=YOUR_COGNEE_URL
COGNEE_API_KEY=YOUR_COGNEE_KEY

# Scheduled proactive checks
CRON_SECRET=YOUR_LONG_RANDOM_SECRET
```

Generate `TOKEN_ENCRYPTION_KEY` with:

```bash
openssl rand -hex 32
```

Keep `.env.local` private. Never commit it or paste its values into chat, tickets, screenshots, or documentation.

## 2. Configure Supabase and Google

1. Create a Supabase project.
2. In Supabase, enable the Google provider under **Authentication**.
3. Create a Google OAuth client in Google Cloud.
4. Copy the Google client ID and secret into Supabase and `.env.local`.
5. Add Supabase's displayed OAuth callback URL in Google Cloud's authorized redirect URIs.
6. Add the application callback URL to Supabase's redirect allow list.
7. Apply both database migrations in this exact order:

```text
supabase/migrations/20260906143000_initial_care_schema.sql
supabase/migrations/20260906150000_confirm_care_plan.sql
```

1. Create two Google test accounts. Use one as **Test User A** and one as **Test User B**.



## 3. Confirm the application is ready

Start the app:

```bash
pnpm dev
```

Open this address:

```text
http://localhost:3000/api/health
```

Expected result: the endpoint reports the configured integration groups as ready. Stop and fix configuration if it responds with HTTP `503` or reports missing integrations.

Run the automated checks before starting manual testing:

```bash
pnpm test
pnpm lint
pnpm build
```

Expected result: all three commands pass.

## 4. Create safe test data

Use the included fictional upload fixture:

```text
test-fixtures/fictional-test-prescription.png
```

When the file picker opens in the Care workspace, navigate to the project folder, open `test-fixtures`, and select `fictional-test-prescription.png`.

It is clearly marked as fictional and not valid for medical use. Its intended extracted values are:

```text
Patient: Test Child
Medication: Amoxicillin
Dose: 5 ml
Frequency: twice daily
Duration: 15 days
Instructions: after meals
Follow-up: pediatrician review in two weeks
```

This input should create exactly `2 × 15 = 30` medication doses after confirmation.

## 5. Test sign-in and family setup

1. Open `http://localhost:3000/login`.
2. Select **Continue with Google**.
3. Sign in as Test User A.
4. Confirm you arrive inside the Care Memory application.
5. Open **Family**.
6. Select **Add member**.
7. Add a test member, for example:

```text
Name: Test Child
Relationship: Daughter
Date of birth: any test date
Notes: Test account only
```

1. Select **Save member**.
2. Refresh the page and open the new member profile.

Expected result: the member persists after refresh and appears only in Test User A's family workspace.

Record: member name, time created, and whether the refresh retained it.

## 6. Test record upload and human confirmation

1. Open **Care**.
2. Select **Test Child** in the family member selector.
3. Select **Add health record**.
4. Choose the fictional prescription image or PDF prepared above.
5. Wait for the extraction review dialog.
6. Check that the dialog shows the file preview and extracted values.
7. Verify or edit these values:

```text
Medication: Amoxicillin
Dose: 5
Unit: ml
Times daily: 2
Duration days: 15
Instructions: after meals
```

1. Select **Confirm and create care plan**.
2. Refresh the Care page.

Expected result:

- No medication plan exists before the confirmation button is selected.
- After confirmation, the care episode and follow-up are visible.
- The page shows `0 of 30 doses recorded` or the equivalent 30-dose total.
- The uploaded record is listed on the member profile.

Record: extracted values, any edits you made, and displayed dose count.

## 7. Test medication dose actions

1. Stay on **Care**.
2. In the caregiver selector, choose a family member or leave the default if recording as yourself.
3. Select **Mark taken** for the next scheduled dose.
4. Verify the dose count increases and the timeline shows `taken`.
5. Use a later scheduled dose to select **Mark missed**.
6. Verify the timeline shows `missed`.
7. Use another scheduled dose to select **Skip**.
8. Verify the timeline shows `skipped`.
9. Refresh the page.

Expected result: each selected status and caregiver attribution persists after refresh. Only the targeted dose changes.

Record: the three dose statuses and the caregiver shown for each relevant action.

## 8. Test the assistant and saved care context

1. Open **Ask**.
2. Send this message:

```text
Dad gave Test Child her evening medicine.
```

1. Confirm the reply identifies the active medication and records the dose with caregiver context.
2. Send this message:

```text
Test Child developed a rash today.
```

1. Confirm the reply records it as a caregiver-reported health event. It must not diagnose the rash.
2. Send this message:

```text
Prepare Test Child's summary for the doctor.
```

1. Confirm the summary includes the medication, duration, dose progress, reported rash, and follow-up context.
2. Refresh the browser, return to **Ask**, and request the doctor summary again.

Expected result: the assistant uses persisted care data and a later summary includes the saved health event. It should never present a diagnosis or emergency triage advice.

Record: screenshots of the three assistant responses and the response after refresh.

## 9. Test voice input

1. Stay on **Ask**.
2. Select the microphone button.
3. Allow browser microphone permission.
4. Say: `Test Child developed a mild rash today.`
5. Select the microphone button again to stop recording.
6. Wait for the transcription and assistant response.

Expected result: the transcript appears as a user message and the assistant handles it in the same way as a typed health update.

If it fails, check Deepgram settings first, then the configured Groq Whisper fallback. If microphone access was denied, expect a clear permission message.

Record: transcript text and assistant response.

## 10. Test Memory

1. Open **Memory**.
2. Select **Test Child**.
3. Inspect memory cards and the graph.
4. Confirm the reported rash and medication context appear after the assistant update.
5. Read the source label above the graph.

Expected result: the source label is accurate:

- `Cognee knowledge graph` when Cognee data is available.
- `Postgres availability fallback` when the memory provider is unavailable.

The application must never label fallback information as a provider graph.

Record: source label, visible memory entries, and a screenshot of the graph.

## 11. Test Google Calendar confirmation and idempotency

1. Return to **Home** or **Care**.
2. Find the pending follow-up.
3. Select **Add to Google Calendar**.
4. Complete the Google authorization if requested.
5. Confirm the follow-up event creation.
6. Open Google Calendar and verify the event details.
7. Return to Care Memory and repeat the same Calendar action.
8. Refresh Google Calendar.

Expected result:

- Calendar action happens only after user confirmation.
- One follow-up event is created.
- Repeating the action does not create a duplicate event.
- Individual medication doses are never sent to Google Calendar.

Record: Calendar event link or screenshot and confirmation that only one event exists.

## 12. Test family data isolation with a second account

1. Sign out Test User A.
2. Open a private or incognito browser window.
3. Sign in as Test User B.
4. Open **Family**, **Care**, and **Memory**.
5. Confirm Test User A's Test Child and care data do not appear.
6. Create a separate member under Test User B.
7. Sign back in as Test User A.
8. Confirm Test User B's member and data do not appear.
9. As an extra check, copy a member profile URL from Test User A and attempt to open it as Test User B.

Expected result: each user can access only their own family workspace. The other user's profile, care records, doses, events, and memory must not be visible.

Record: pass or fail for each user and any unexpected accessible URL.

## 13. Final test report

Complete this after testing:

```text
Date:
Tester:
Application URL:
Environment: Configured real environment

pnpm test: Pass / Fail
pnpm lint: Pass / Fail
pnpm build: Pass / Fail
/api/health: Pass / Fail

Google sign-in: Pass / Fail
Family member persistence: Pass / Fail
Record upload and review: Pass / Fail
30-dose schedule: Pass / Fail
Dose status persistence: Pass / Fail
Assistant context after refresh: Pass / Fail
Voice transcription: Pass / Fail
Memory retrieval and graph label: Pass / Fail
Google Calendar single-event behavior: Pass / Fail
Second-user isolation: Pass / Fail

Issues found:
Screenshots or evidence location:
Ready for founder review: Yes / No
```
