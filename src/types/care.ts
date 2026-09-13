export type DoseStatus = "scheduled" | "taken" | "missed" | "skipped";

export type HealthRecordType =
  | "prescription"
  | "lab_report"
  | "vaccination"
  | "discharge_summary"
  | "doctor_note"
  | "imaging_report"
  | "other"
  | "unknown";

export type CareIntent =
  | "ask_question"
  | "upload_record"
  | "mark_dose"
  | "add_health_event"
  | "create_follow_up"
  | "calendar_action"
  | "prepare_summary"
  | "family_member_action"
  | "unknown";

export type MemoryCategory = "episodic" | "semantic";

export type MemoryRecord = {
  id: string;
  memberId: string;
  episodeId?: string;
  category: MemoryCategory;
  text: string;
  sourceType: "record" | "message" | "care_action";
  sourceId: string;
  createdAt: string;
};
