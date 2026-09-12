# Project Plan

## 1. Problem - What problem are we solving?

Family caregivers need one calm place to turn health records and conversations into confirmed care plans, medication coordination, follow-ups, and lasting family health context.

## 2. Users - Who is this for?

Primary users are family caregivers coordinating care for children, parents, or partners. The first release is a founder-demo web app centered on one family and one active care episode.

## 3. Features - What does the MVP need?

Google sign-in, family member profiles, generic health-record upload and review, confirmed care episodes and medication doses, one text and voice assistant, persistent member-scoped memory and graph, follow-ups with Google Calendar, proactive care gaps, and sourced doctor summaries.

## 4. Data - What are we storing?

Supabase Postgres owns users, families, members, records, care episodes, medications and doses, health events, follow-ups, calendar links, and agent threads. Cloudinary stores raw files. A memory provider stores derived episodic and semantic context with provenance.

## 5. Tech - What stack are we using?

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth and Postgres, Cloudinary, LangGraph JS, purpose-based provider adapters for Gemini/Groq/OpenRouter, Cognee or Mem0 behind a memory-provider interface, Deepgram with Groq Whisper fallback, and Google Calendar.

## 6. Monetize - How will this make money?

This is a founder demo. Pricing and billing are deliberately out of scope until the core care-coordination workflow is validated.

## 7. UI/UX - How should this look and feel?

Use the working name Care Memory. The desktop-first interface is calm, premium, and family-friendly: warm cream backgrounds, sage primary (#7B9A8E), green-charcoal text, rounded cards, gentle shadows, minimal chrome, and no hospital-dashboard feel.

## 8. Deployment - Where and how will this ship?

Target Vercel after the demo is ready. The app will use `npm run build` and `npm run start`; environment variables include Supabase, Cloudinary, Google OAuth/Calendar, LLM, memory, and speech-provider credentials. A later `/release` step will add health-check and deployment evidence without deploying automatically.
