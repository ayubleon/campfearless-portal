"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"

// An action that has already taken effect, with a few seconds to undo it.
// Done, the close button, Escape, a click outside and the timer running out all accept it.
export function UndoOverlay({ title, description, onUndo, onDone, duration = 5000 }: { title: string; description: React.ReactNode; onUndo: () => void; onDone: () => void; duration?: number }) {
  const [progress, setProgress] = React.useState(100)
  const done = React.useRef(onDone)
  React.useEffect(() => { done.current = onDone })

  React.useEffect(() => {
    const startedAt = Date.now()
    const interval = window.setInterval(() => setProgress(Math.max(0, 100 - ((Date.now() - startedAt) / duration) * 100)), 50)
    const timeout = window.setTimeout(() => done.current(), duration)
    return () => { window.clearInterval(interval); window.clearTimeout(timeout) }
  }, [duration])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onDone() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader className="relative space-y-1 pr-10 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Dismiss confirmation" className="absolute right-0 top-0" onClick={onDone}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-75" style={{ width: `${progress}%` }} /></div>
        <DialogFooter className="grid grid-cols-2 gap-3 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onUndo}>Undo</Button>
          <Button type="button" onClick={onDone}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
