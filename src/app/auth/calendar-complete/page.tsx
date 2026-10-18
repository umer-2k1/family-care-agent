"use client";

import { useEffect } from "react";

export default function CalendarAuthorizationCompletePage() {
  useEffect(() => {
    window.opener?.postMessage({ type: "care-memory-calendar-authorized" }, window.location.origin);
    window.close();
  }, []);

  return <main className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-xl font-semibold">Google Calendar connected</h1><p className="mt-2 text-sm text-muted-foreground">You can close this window. Care Memory is continuing the synchronization.</p></div></main>;
}
