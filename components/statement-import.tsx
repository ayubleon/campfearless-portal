"use client"

import * as React from "react"
import { X } from "lucide-react"

import { formatNumber } from "@/lib/format"
import { readSheet } from "read-excel-file/browser"
import { parseStatement, parseTable, tally, type Declared, type StatementRow, type Tally } from "@/lib/statement"
import { statusClass } from "@/lib/status"
import { cn } from "@/lib/utils"
import { LoadingButton } from "@/components/loading-button"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"

const maxFileBytes = 2 * 1024 * 1024

// Import a Safaricom paybill statement (CSV) and tally it against the codes declared at registration. Applying fills the
// "Amount on SMS" of every open payment found in the statement; verifying stays a separate step.
export function StatementImportDialog({ open, onOpenChange, declared, pending, onApply }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  declared: Declared[]
  pending: boolean
  onApply: (entries: { id: string; paid: number }[]) => Promise<void>
}) {
  const input = React.useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = React.useState("")
  const [error, setError] = React.useState("")
  const [statement, setStatement] = React.useState<StatementRow[] | null>(null)

  const close = () => { onOpenChange(false); setFileName(""); setError(""); setStatement(null) }
  const pick = async (file: File | undefined) => {
    if (!file) return
    setError(""); setStatement(null); setFileName(file.name)
    if (file.size > maxFileBytes) return setError("This file is over 2 MB. Export a shorter date range from Safaricom.")
    const excel = /\.xlsx$/i.test(file.name)
    if (!excel && !/\.(csv|txt)$/i.test(file.name)) return setError("Choose an Excel (.xlsx) or CSV file. For an older .xls file, open it in Excel and save it as .xlsx first.")
    let result
    try {
      result = excel ? parseTable(await readSheet(file)) : parseStatement(await file.text())
    } catch {
      return setError("This file couldn't be read. Check that it is the statement and not damaged.")
    }
    if (result.error) return setError(result.error)
    setStatement(result.rows)
  }

  const result: Tally | null = statement ? tally(statement, declared) : null
  const openFound = result?.found.filter((item) => declared.find((payment) => payment.id === item.id)?.status === "pending") ?? []
  const counts = result ? {
    matched: result.found.filter((item) => item.check.kind === "matched").length,
    off: result.found.filter((item) => item.check.kind !== "matched").length,
    missing: result.missing.length,
    unknown: result.unknown.length,
  } : null

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 p-4 sm:max-w-xl">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">Import Safaricom statement</DialogTitle>
          <DialogDescription className="pr-10 text-sm text-muted-foreground">Upload the paybill statement as an Excel or CSV file with the date, M-Pesa code, name and amount.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close import statement" className="absolute right-0 top-0" onClick={close}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="mt-4 flex min-h-0 flex-col">
          <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-1">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => input.current?.click()}>{fileName ? "Choose another file" : "Choose file"}</Button>
              <span className="min-w-0 truncate text-sm text-muted-foreground">{fileName || "No file chosen"}</span>
              <Input ref={input} type="file" accept=".xlsx,.csv,.txt,text/csv" aria-label="Safaricom statement file" tabIndex={-1} className="hidden" onChange={(event) => { void pick(event.target.files?.[0]); event.target.value = "" }} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}

            {result && counts && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["Matched", counts.matched],
                    ["Short or over", counts.off],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border bg-muted/20 px-4 py-3">
                      <div className="text-base font-semibold tabular-nums">{value}</div>
                      <div className="text-sm text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>

                {counts.off > 0 && (
                  <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
                    {result.found.filter((item) => item.check.kind !== "matched").map((item) => (
                      <Line key={item.id} left={<><span className="tabular-nums">{item.code}</span> <span className="text-muted-foreground">{declared.find((payment) => payment.id === item.id)?.who ?? item.name}</span></>}
                        right={<Badge variant="outline" className={cn("whitespace-nowrap", statusClass(item.check.kind === "short" ? "Short" : "Over"))}>{item.check.kind === "short" ? "Short" : "Over"} {item.check.kind !== "matched" && item.check.kind !== "enter" ? formatNumber(item.check.difference) : ""}</Badge>} />
                    ))}
                  </div>
                )}

                {(counts.missing > 0 || counts.unknown > 0) && (
                  <p className="text-sm text-muted-foreground">
                    {counts.missing > 0 && <>{counts.missing} registered {counts.missing === 1 ? "payment is" : "payments are"} not in this statement. </>}
                    {counts.unknown > 0 && <>{counts.unknown} {counts.unknown === 1 ? "payment in the statement has" : "payments in the statement have"} no matching registration.</>}
                  </p>
                )}
                {openFound.length < result.found.length && <p className="text-sm text-muted-foreground">Verified and flagged payments keep their amount.</p>}
              </>
            )}
          </div>
          <DialogFooter className="mt-4 flex-row justify-end gap-3">
            <Button type="button" variant="outline" disabled={pending} onClick={close}>Cancel</Button>
            <LoadingButton type="button" pending={pending} loadingLabel="Filling..." disabled={!result || openFound.length === 0} onClick={async () => { await onApply(openFound.map((item) => ({ id: item.id, paid: item.paid }))); close() }}>
              {openFound.length > 0 ? `Fill ${openFound.length} ${openFound.length === 1 ? "amount" : "amounts"}` : "Fill amounts"}
            </LoadingButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Line({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm"><span className="min-w-0 truncate">{left}</span>{right}</div>
}
