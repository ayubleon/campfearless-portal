import * as React from "react"

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-medium">{label}{children}</label>
}
