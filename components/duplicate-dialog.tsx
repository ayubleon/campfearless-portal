"use client"

import * as React from "react"
import { AlertCircle, X } from "lucide-react"

import type { DuplicateMatch } from "@/lib/records"
import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"

export type DuplicateState = { same: DuplicateMatch[]; similar: DuplicateMatch[]; proceed: () => void }

// Shown before a registration or waiver is saved. A "same" match blocks it; "similar" matches ask staff to confirm.
export function DuplicateDialog({ state, onClose }: { state: DuplicateState | null; onClose: () => void }) {
  const blocked = (state?.same.length ?? 0) > 0
  const lines = blocked ? state!.same : state?.similar ?? []
  return (
    <Dialog open={state !== null} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 pr-10 text-lg font-semibold leading-none tracking-tight"><AlertCircle className="text-destructive" />{blocked ? "Already registered" : "Possible duplicate"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {blocked ? "The same person can't be registered twice in one edition. Check the existing record instead." : "Check these before you continue. If it is a different person, you can register them."}
          </DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close duplicate check" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
        </DialogHeader>
        <ul className="flex flex-col gap-2 pt-4 text-sm text-muted-foreground">
          {lines.map((line, index) => <li key={index} className="rounded-lg border bg-muted/20 px-4 py-3"><strong className="text-foreground">{line.who}</strong> · {line.reason}</li>)}
        </ul>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          {blocked ? (
            <Button type="button" className="col-span-2" onClick={onClose}>Got it</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="button" onClick={() => { state?.proceed(); onClose() }}>Register anyway</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
