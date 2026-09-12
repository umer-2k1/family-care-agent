"use client";

import { useId } from "react";

function InlineScript({ html }: { html: string }) {
  return <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }}/>;
}

export function LocalDateTime({ value, dateOnly = false }: { value: string; dateOnly?: boolean }) {
  const id = useId();
  const method = dateOnly ? "toLocaleDateString" : "toLocaleString";
  const display = dateOnly ? new Date(value).toLocaleDateString() : new Date(value).toLocaleString();
  const script = `{var n=document.getElementById(${JSON.stringify(id)});if(n)n.textContent=new Date(${JSON.stringify(value)}).${method}()}`;

  return <><time id={id} dateTime={value} suppressHydrationWarning>{display}</time><InlineScript html={script}/></>;
}
