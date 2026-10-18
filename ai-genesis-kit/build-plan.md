# Build Plan

The implementation blueprint is the detailed technical authority. This checklist is the execution order and durable progress record.

## Current delivery state

Founder-demo items 0-12 are implemented in the current feature branch. They remain unchecked until credential-backed browser and integration verification closes the P1 findings and the AI Genesis Kit completion gate archives the feature. Item 13 remains explicitly out of scope.

## Founder Demo

- [ ] 0. **Repo and foundations** - establish the Next.js app, Care Memory design system, Supabase auth boundary, app shell, and reliable demo seed path.
- [ ] 1. **Family context** - persist and manage family members, show a family tree, and provide a member profile.
- [ ] 2. **Health-record upload** - upload generic image/PDF records to Cloudinary, persist metadata, and show linked previews.
- [ ] 3. **Record understanding and review** - classify records with validated structured AI output, handle uncertainty, and require user confirmation.
- [ ] 4. **Care episodes and medication plans** - create confirmed episodes, deterministic dose schedules, adherence updates, and Today cards.
- [ ] 5. **Text care assistant** - route text through one LangGraph orchestrator with deterministic care tools and family context.
- [ ] 6. **Persistent care memory** - add a provider abstraction, member-scoped episodic and semantic memory, provenance, and graceful degradation.
- [ ] 7. **Member memory graph** - expose normalized provider-independent graph data, timeline, and React Flow visualization from stored relationships.
- [ ] 8. **Voice care assistant** - transcribe microphone input through the same assistant graph, with provider fallback and optional browser speech output.
- [ ] 9. **Follow-ups and calendar** - persist follow-ups, connect Google Calendar, and create only confirmed meaningful calendar events.
- [ ] 10. **Proactive care gaps** - identify unresolved due-soon follow-ups and surface in-app alerts through a cron/dev check.
- [ ] 11. **Care summary** - generate a concise, sourced doctor-ready summary from records, deterministic care state, events, memory, and follow-up status.
- [ ] 12. **Founder-demo polish** - complete loading, empty, error, responsive, sample-data, and scripted-demo states without adding non-goals.

## Later, only after the founder demo

- [ ] 13. **WhatsApp channel** - route WhatsApp webhooks into the same family identity, LangGraph assistant, state, and memory without a second AI system.
