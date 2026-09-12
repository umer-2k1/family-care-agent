import type { MemoryRecord } from "@/types/care";

export const demoFamily = [
  { id: "emma", name: "Emma", relationship: "Daughter", age: 6, initials: "E", color: "#E8B9A6", status: "Active care plan" },
  { id: "noah", name: "Noah", relationship: "Son", age: 9, initials: "N", color: "#B9D7CC", status: "No active care" },
  { id: "amina", name: "Amina", relationship: "Grandmother", age: 67, initials: "A", color: "#D8C5E6", status: "Caregiver" },
];

export const demoMemories: MemoryRecord[] = [
  { id: "episode", memberId: "emma", episodeId: "ear-infection-sep", category: "semantic", text: "Emma has an active ear infection care episode.", sourceType: "record", sourceId: "record-1", createdAt: "2026-09-03" },
  { id: "medication", memberId: "emma", episodeId: "ear-infection-sep", category: "semantic", text: "Emma was prescribed Amoxicillin, 5 ml twice daily for 15 days.", sourceType: "record", sourceId: "record-1", createdAt: "2026-09-03" },
  { id: "rash", memberId: "emma", episodeId: "ear-infection-sep", category: "episodic", text: "A rash was parent-reported during treatment.", sourceType: "message", sourceId: "message-1", createdAt: "2026-09-06" },
  { id: "caregiver", memberId: "emma", episodeId: "ear-infection-sep", category: "semantic", text: "Dad often handles Emma's evening medicine.", sourceType: "care_action", sourceId: "dose-30", createdAt: "2026-09-06" },
];
