"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, X } from "lucide-react"

import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"

function LeaveDialog({ href, unsaved, onStay, onLeave }: { href: string | null; unsaved: string[]; onStay: () => void; onLeave: () => void }) {
  return (
    <Dialog open={href !== null} onOpenChange={(open) => !open && onStay()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-bold leading-none tracking-tight"><AlertCircle className="text-destructive" />Leave without saving?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">You have unsaved changes to <strong className="text-foreground">{unsaved.join(" and ")}</strong>. Leaving this page will discard them.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close leave page dialog" className="absolute right-0 top-0" onClick={onStay}><X className="size-4" /></Button>
        </DialogHeader>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onStay}>Stay on page</Button>
          <Button type="button" onClick={onLeave}>Leave page</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function useLeaveGuard(active: boolean) {
  const [href, setHref] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!active) return
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
      const anchor = (event.target as HTMLElement | null)?.closest("a")
      const target = anchor?.getAttribute("href")
      if (!anchor || !target?.startsWith("/") || anchor.target === "_blank" || target === window.location.pathname) return
      event.preventDefault()
      setHref(target)
    }
    window.addEventListener("beforeunload", beforeUnload)
    document.addEventListener("click", click, true)
    return () => {
      window.removeEventListener("beforeunload", beforeUnload)
      document.removeEventListener("click", click, true)
    }
  }, [active])

  return [href, setHref] as const
}

export function LeaveGuard({ active, unsaved }: { active: boolean; unsaved: string[] }) {
  const router = useRouter()
  const [href, setHref] = useLeaveGuard(active)
  return <LeaveDialog href={href} unsaved={unsaved} onStay={() => setHref(null)} onLeave={() => { const target = href; setHref(null); if (target) router.push(target) }} />
}
