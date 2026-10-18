import type { CareIntent } from "@/types/care";

export type CareAgentResponse = { intent: CareIntent; response: string; actions: string[] };

export function routeCareIntent(input: string): CareIntent {
  const message = input.toLowerCase();
  if (message.includes("rash") || message.includes("symptom")) return "add_health_event";
  if (message.includes("dose") || message.includes("medicine") || message.includes("gave")) return "mark_dose";
  if (message.includes("summary") || message.includes("doctor")) return "prepare_summary";
  if (message.includes("calendar") || message.includes("follow-up") || message.includes("follow up")) return "calendar_action";
  return "ask_question";
}

export function runDemoCareAgent(input: string): CareAgentResponse {
  const intent = routeCareIntent(input);
  const responses: Record<CareIntent, Omit<CareAgentResponse, "intent">> = {
    add_health_event: { response: "I added a parent-reported rash to Emma's active ear infection episode and saved it as an episodic memory. Consider mentioning it at her follow-up.", actions: ["createHealthEvent", "writeMemory"] },
    mark_dose: { response: "I recorded Emma's evening Amoxicillin dose as taken and noted Dad as the caregiver.", actions: ["markDoseTaken", "writeMemory"] },
    prepare_summary: { response: "Doctor summary: Emma is on day 4 of a 15-day Amoxicillin plan for an ear infection. Seven doses are recorded. A rash was parent-reported today. Her follow-up is due September 20 and is not yet on the calendar.", actions: ["generateCareSummary"] },
    calendar_action: { response: "Emma's follow-up is due in 3 days. It has not been scheduled yet, so I can prepare a Google Calendar event after you confirm.", actions: ["getPendingFollowUps"] },
    ask_question: { response: "I can help with Emma's active medication, care timeline, follow-up, and sourced doctor summary.", actions: ["getActiveCareEpisode", "searchMemory"] },
    upload_record: { response: "Upload a record to begin a classified, user-confirmed care-plan review.", actions: [] },
    create_follow_up: { response: "I can create a follow-up after you confirm the date and family member.", actions: [] },
    family_member_action: { response: "I can help update a family member after you confirm the details.", actions: [] },
    unknown: { response: "I need a little more detail to help with that care request.", actions: [] },
  };
  return { intent, ...responses[intent] };
}
