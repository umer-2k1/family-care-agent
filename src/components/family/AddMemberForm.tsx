"use client";

import { createFamilyMember, type FamilyActionState } from "@/actions/family";
import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: FamilyActionState = { success: false };

export function AddMemberForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createFamilyMember, initialState);
  useEffect(() => {
    if (!state.success) return;
    toast.success("Family member added");
    const closeDialog = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(closeDialog);
  }, [state.success]);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button size="lg" className="rounded-xl" />}><Plus data-icon="inline-start"/> Add member</DialogTrigger>
    <DialogContent className="max-w-lg rounded-3xl p-6 sm:max-w-lg">
      <DialogHeader><DialogTitle className="text-xl">Add family member</DialogTitle><DialogDescription>Add someone to your private family care workspace.</DialogDescription></DialogHeader>
      <form action={action}>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2"><Label htmlFor="member-name">Name</Label><Input required id="member-name" name="name" className="h-10 rounded-xl"/></div>
          <div className="grid gap-2"><Label htmlFor="member-relationship">Relationship</Label><Input required id="member-relationship" name="relationship" className="h-10 rounded-xl"/></div>
          <div className="grid gap-2"><Label htmlFor="member-dob">Date of birth</Label><Input id="member-dob" type="date" name="dateOfBirth" className="h-10 rounded-xl"/></div>
          <div className="grid gap-2"><Label htmlFor="member-notes">Notes</Label><Textarea id="member-notes" name="notes" className="rounded-xl"/></div>
        </div>
        {state.error && <Alert variant="destructive" className="mt-2"><AlertDescription>{state.error}</AlertDescription></Alert>}
        <Button disabled={pending} size="lg" type="submit" className="mt-5 w-full rounded-xl">{pending ? "Saving..." : "Save member"}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
