"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarSyncButton } from "@/components/calendar/CalendarSyncButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalDateTime } from "@/components/shared/LocalDateTime";
import type { RecordUnderstandingResult } from "@/lib/ai/schemas/record-understanding";
import { cn } from "@/lib/utils";
import type { CareDashboard } from "@/server/repositories/care";
import { Check, FileUp, LoaderCircle, Pill, Upload } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useState } from "react";

type MemberOption = { id: string; name: string };
type Review = { id: string; understanding: RecordUnderstandingResult; preview?: { url: string; mimeType: string } };
type UploadResponse = Review & { error?: string; autoCalendarEpisodeId?: string };

export function CareWorkspace({ initialCare, members, showUploadControls = true }: { initialCare: CareDashboard | null; members: MemberOption[]; showUploadControls?: boolean }) {
  const [care, setCare] = useState(initialCare);
  const [review, setReview] = useState<Review | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [caregiverMemberId, setCaregiverMemberId] = useState("");
  const [savingReviewAs, setSavingReviewAs] = useState<"record_only" | "create_care_plan" | null>(null);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const member = members.find((item) => item.id === selectedMemberId);
    if (!file || !member) return;
    setUploading(true);
    setError(undefined);
    const preview = { url: URL.createObjectURL(file), mimeType: file.type };
    const form = new FormData();
    form.set("file", file);
    form.set("memberId", member.id);
    const response = await fetch("/api/records", { method: "POST", body: form });
    const body = await response.json() as UploadResponse;
    if (!response.ok) {
      URL.revokeObjectURL(preview.url);
      setError(body.error ?? "Upload failed.");
    } else if (body.autoCalendarEpisodeId) {
      const calendarResponse = await fetch("/api/calendar/google", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ episodeId: body.autoCalendarEpisodeId }) });
      const calendarBody = await calendarResponse.json() as { error?: string };
      URL.revokeObjectURL(preview.url);
      if (!calendarResponse.ok) setError(calendarBody.error ?? "The care plan was created, but Calendar synchronization failed.");
      else window.location.reload();
    } else {
      setReview({ ...body, preview });
    }
    setUploading(false);
  }

  async function saveReview(action: "record_only" | "create_care_plan") {
    if (!review || !selectedMemberId || savingReviewAs) return;
    setSavingReviewAs(action);
    setError(undefined);
    const response = await fetch("/api/records/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, recordId: review.id, memberId: selectedMemberId, episodeTitle: `${review.understanding.medications[0]?.name ?? "Care"} treatment`, understanding: review.understanding }),
    });
    const body = await response.json() as { error?: string };
    if (!response.ok) {
      setSavingReviewAs(null);
      return setError(body.error ?? "Unable to save the reviewed record.");
    }
    if (review.preview) URL.revokeObjectURL(review.preview.url);
    setReview(null);
    window.location.reload();
  }

  async function updateDose(id: string, status: "taken" | "missed" | "skipped") {
    const caregiver = members.find((member) => member.id === caregiverMemberId);
    const response = await fetch(`/api/doses/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, caregiverMemberId: caregiverMemberId || null }),
    });
    if (!response.ok) return setError("Dose update failed.");
    setCare((current) => current ? { ...current, doses: current.doses.map((dose) => dose.id === id ? { ...dose, status, caregiverName: caregiver?.name } : dose) } : current);
  }

  const nextDose = care?.doses.find((dose) => dose.status === "scheduled");
  const taken = care?.doses.filter((dose) => dose.status === "taken").length ?? 0;
  const memberItems = members.map((member) => ({ value: member.id, label: member.name }));

  return <div className="space-y-6 pb-20 lg:pb-0">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-primary-dark">Care workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{care ? `${care.memberName} - ${care.title}` : "Start a care episode"}</h1><p className="mt-2 text-sm text-muted-foreground">Records require review before they create medication or follow-up actions.</p></div>
      {showUploadControls && <div className="flex gap-2">
        <Select items={memberItems} value={selectedMemberId} onValueChange={(value) => setSelectedMemberId(value ?? "")}>
          <SelectTrigger aria-label="Family member" className="h-10 rounded-xl bg-card"><SelectValue placeholder="Family member"/></SelectTrigger>
          <SelectContent>{members.map((member) => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent>
        </Select>
        <label className={cn(buttonVariants({ size: "lg" }), "cursor-pointer rounded-xl", uploading && "cursor-wait")}><span className="inline-flex items-center gap-2">{uploading ? <LoaderCircle className="animate-spin"/> : <Upload/>}{uploading ? "Analyzing record..." : "Add health record"}</span><input onChange={upload} disabled={uploading || !selectedMemberId} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" className="sr-only"/></label>
      </div>}
    </section>

    {uploading && <p aria-live="polite" className="text-sm text-muted-foreground">Extracting medication and follow-up details. This can take up to 45 seconds.</p>}
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    {care ? <>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-border p-6 shadow-card">
          <div className="flex gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-dark"><Pill size={21}/></div><div><h2 className="font-semibold">{care.medicationName}</h2><p className="mt-1 text-sm text-muted-foreground">{care.dose} {care.unit} · {care.frequencyPerDay} times daily · {care.instructions}</p></div></div>
          <p className="text-sm"><strong>{taken} of {care.doses.length} doses</strong> recorded</p>
          {nextDose && <div className="rounded-2xl bg-muted p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next dose</p><p className="mt-1 font-semibold"><LocalDateTime value={nextDose.scheduledAt}/></p>
            <Select items={memberItems} value={caregiverMemberId || null} onValueChange={(value) => setCaregiverMemberId(value ?? "")}><SelectTrigger aria-label="Caregiver" className="mt-3 h-10 w-full bg-card"><SelectValue placeholder="Recorded by me"/></SelectTrigger><SelectContent>{members.map((member) => <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>)}</SelectContent></Select>
            <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => updateDose(nextDose.id, "taken")}>Mark taken</Button><Button variant="outline" onClick={() => updateDose(nextDose.id, "missed")}>Mark missed</Button><Button variant="outline" onClick={() => updateDose(nextDose.id, "skipped")}>Skip</Button></div>
          </div>}
        </Card>
        <Card className="rounded-3xl border-border p-6 shadow-card"><h2 className="font-semibold">Calendar</h2><p className="text-sm text-muted-foreground">{care.followUp ? <>Follow-up: {care.followUp.title} · <LocalDateTime value={care.followUp.dueAt} dateOnly/></> : "No follow-up recorded."}</p><p className="text-xs text-muted-foreground">Synchronizes {care.doses.length} medication doses{care.followUp ? " and 1 follow-up" : ""} without leaving Care Memory.</p><CalendarSyncButton episodeId={care.episodeId} doseCount={care.doses.length} hasFollowUp={Boolean(care.followUp)} initiallySynced={Boolean(care.calendarSyncedAt)} className="w-fit rounded-xl"/></Card>
      </section>
      <Card className="rounded-3xl border-border p-6 shadow-card"><h2 className="font-semibold">Dose timeline</h2><div className="divide-y divide-border">{care.doses.slice(0, 12).map((dose) => <div key={dose.id} className="flex items-center justify-between gap-4 py-3 text-sm"><LocalDateTime value={dose.scheduledAt}/><span className="text-right font-medium capitalize">{dose.status}{dose.caregiverName ? ` · ${dose.caregiverName}` : ""}</span></div>)}</div></Card>
    </> : <Card className="items-center rounded-3xl border-dashed border-primary-light p-10 text-center"><FileUp className="text-primary-dark"/><h2 className="font-semibold">Upload the first health record</h2><p className="text-sm text-muted-foreground">Choose a family member first, then upload an image or PDF.</p></Card>}

    {review && <ReviewDialog review={review} setReview={setReview} saveReview={saveReview} savingReviewAs={savingReviewAs}/>}
  </div>;
}

function ReviewDialog({ review, setReview, saveReview, savingReviewAs }: { review: Review; setReview: (review: Review | null) => void; saveReview: (action: "record_only" | "create_care_plan") => Promise<void>; savingReviewAs: "record_only" | "create_care_plan" | null }) {
  const medication = review.understanding.medications[0] ?? { name: null, dose: null, unit: null, frequencyPerDay: null, durationDays: null, instructions: null, startDate: null, asNeeded: false };
  const close = () => { if (review.preview) URL.revokeObjectURL(review.preview.url); setReview(null); };
  const updateMedication = (field: string, value: string | number | null) => setReview({ ...review, understanding: { ...review.understanding, medications: [{ ...medication, [field]: value }, ...review.understanding.medications.slice(1)] } });
  const isMedicationComplete = medication.name !== null && medication.dose !== null && medication.unit !== null && medication.frequencyPerDay !== null && medication.durationDays !== null && medication.instructions !== null && medication.startDate !== null && medication.asNeeded === false;

  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[90vh] overflow-auto rounded-3xl p-6 sm:max-w-lg">
      <DialogHeader><DialogTitle>Review extracted care plan</DialogTitle><DialogDescription>{review.understanding.recordType} · {Math.round(review.understanding.confidence * 100)}% confidence</DialogDescription></DialogHeader>
      {review.preview && (review.preview.mimeType === "application/pdf" ? <iframe title="Uploaded health record preview" src={review.preview.url} className="h-56 w-full rounded-xl border border-border"/> : <div className="relative h-56 w-full overflow-hidden rounded-xl border border-border"><Image unoptimized fill alt="Uploaded health record preview" src={review.preview.url} className="object-contain"/></div>)}
      <Alert className="bg-muted"><AlertDescription>{review.understanding.summary}</AlertDescription></Alert>
      {medication.asNeeded && <Alert><AlertDescription>This medicine is prescribed as needed. Care Memory will save the record but will not create fixed dose reminders for a PRN medicine.</AlertDescription></Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="review-medication">Medication</Label><Input id="review-medication" value={medication.name ?? ""} onChange={(event) => updateMedication("name", event.target.value || null)}/></div>
        <div className="grid gap-2"><Label htmlFor="review-dose">Dose</Label><Input id="review-dose" type="number" value={medication.dose ?? ""} onChange={(event) => updateMedication("dose", event.target.value === "" ? null : Number(event.target.value))}/></div>
        <div className="grid gap-2"><Label htmlFor="review-unit">Unit</Label><Input id="review-unit" value={medication.unit ?? ""} onChange={(event) => updateMedication("unit", event.target.value || null)}/></div>
        <div className="grid gap-2"><Label htmlFor="review-frequency">Times daily</Label><Input id="review-frequency" type="number" value={medication.frequencyPerDay ?? ""} onChange={(event) => updateMedication("frequencyPerDay", event.target.value === "" ? null : Number(event.target.value))}/></div>
        <div className="grid gap-2"><Label htmlFor="review-duration">Duration days</Label><Input id="review-duration" type="number" value={medication.durationDays ?? ""} onChange={(event) => updateMedication("durationDays", event.target.value === "" ? null : Number(event.target.value))}/></div>
        <div className="grid gap-2"><Label htmlFor="review-start-date">Course start date</Label><Input id="review-start-date" type="date" value={medication.startDate ?? ""} onChange={(event) => updateMedication("startDate", event.target.value || null)}/></div>
        <div className="grid gap-2"><Label htmlFor="review-instructions">Instructions</Label><Input id="review-instructions" value={medication.instructions ?? ""} onChange={(event) => updateMedication("instructions", event.target.value || null)}/></div>
      </div>
      {review.understanding.requiresUserClarification && <Alert><AlertDescription>{review.understanding.clarificationQuestion ?? "Please review the extracted details before continuing."}</AlertDescription><Button variant="outline" onClick={() => setReview({ ...review, understanding: { ...review.understanding, recordType: "prescription", requiresUserClarification: false } })}>Confirm this is a prescription</Button></Alert>}
      {!isMedicationComplete && <Alert><AlertDescription>Some medication details are missing. Complete them to create a care plan, or save this as a health record only.</AlertDescription></Alert>}
      <div className="sticky -bottom-6 z-10 -mx-6 mt-2 flex flex-col-reverse gap-3 border-t border-border bg-card px-6 py-4 sm:flex-row sm:justify-end">
        <Button disabled={savingReviewAs !== null} variant="outline" size="lg" onClick={() => saveReview("record_only")} className="rounded-xl">{savingReviewAs === "record_only" ? "Saving record..." : "Save record only"}</Button>
        <Button disabled={savingReviewAs !== null || review.understanding.requiresUserClarification || !isMedicationComplete} size="lg" onClick={() => saveReview("create_care_plan")} className="rounded-xl">{savingReviewAs === "create_care_plan" ? <LoaderCircle className="animate-spin"/> : <Check/>}{savingReviewAs === "create_care_plan" ? "Creating care plan..." : "Save and create care plan"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
