"use client"

import * as React from "react"
import { X } from "lucide-react"
import { toast } from "sonner"

import { currentUser } from "@/lib/session"
import { LeaveGuard } from "@/components/leave-guard"
import { Button } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"

const readOnlyField = "flex h-8 min-w-0 items-center rounded-lg border bg-muted/20 px-2.5 text-sm font-normal"

type Profile = { name: string; phone: string }

export function AccountScreen() {
  const [saved, setSaved] = React.useState<Profile>({ name: currentUser.name, phone: "0712345678" })
  const [draft, setDraft] = React.useState<Profile | null>(null)
  const [reviewing, setReviewing] = React.useState(false)
  const [changingPassword, setChangingPassword] = React.useState(false)

  const editing = draft !== null
  const changes = draft
    ? ([
        draft.name.trim() !== saved.name ? { label: "Name", from: saved.name, to: draft.name.trim() } : null,
        draft.phone.trim() !== saved.phone ? { label: "Phone", from: saved.phone || "-", to: draft.phone.trim() || "-" } : null,
      ].filter(Boolean) as { label: string; from: string; to: string }[])
    : []
  const nameError = draft && draft.name.trim() === "" ? "Enter your name." : ""
  const phoneError = draft && draft.phone.trim() !== "" && !/^0\d{9}$/.test(draft.phone.trim()) ? "Enter a 10-digit number starting with 0, like 0712345678." : ""
  const valid = changes.length > 0 && !nameError && !phoneError

  const confirmSave = () => {
    if (!draft) return
    setSaved({ name: draft.name.trim(), phone: draft.phone.trim() })
    setDraft(null)
    setReviewing(false)
    toast.success("Profile successfully updated")
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your details as other people see them in the portal.</CardDescription>
          {!editing && <CardAction><Button variant="outline" onClick={() => setDraft({ ...saved })}>Edit</Button></CardAction>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            {editing && draft ? (
              <>
                <label className="flex flex-col gap-2 text-sm font-medium">Name
                  <Input className="bg-muted/40" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                  {nameError && <p className="text-sm font-normal text-destructive">{nameError}</p>}
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">Phone
                  <Input className="bg-muted/40 tabular-nums" inputMode="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
                  {phoneError && <p className="text-sm font-normal text-destructive">{phoneError}</p>}
                </label>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 text-sm font-medium">Name<div className={readOnlyField}>{saved.name}</div></div>
                <div className="flex flex-col gap-2 text-sm font-medium">Phone<div className={`${readOnlyField} tabular-nums`}>{saved.phone || "-"}</div></div>
              </>
            )}
            <div className="flex flex-col gap-2 text-sm font-medium">Email<div className={readOnlyField}>{currentUser.email}</div></div>
            <div className="flex flex-col gap-2 text-sm font-medium">Role<div className={readOnlyField}>{currentUser.role}</div></div>
          </div>
          <p className="text-sm text-muted-foreground">Your email and role are set by a Super admin in Users and roles.</p>
          {editing && (
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button disabled={!valid} onClick={() => setReviewing(true)}>Save profile</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Use a password you don't use anywhere else.</CardDescription>
          <CardAction><Button variant="outline" onClick={() => setChangingPassword(true)}>Change password</Button></CardAction>
        </CardHeader>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Last changed on 02/09/2026</p>
        </CardFooter>
      </Card>

      <Dialog open={reviewing} onOpenChange={setReviewing}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="text-base font-semibold leading-none tracking-tight">Review profile changes</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Check these changes before you save them.</DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close review dialog" className="absolute right-0 top-0" onClick={() => setReviewing(false)}><X className="size-4" /></Button>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {changes.map((change) => (
              <div key={change.label} className="rounded-lg border bg-muted/20 px-4 py-3">
                <div className="text-sm text-muted-foreground">{change.label}</div>
                <div className="text-sm text-muted-foreground">{change.from} → <strong className="text-foreground">{change.to}</strong></div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
            <Button variant="outline" onClick={() => setReviewing(false)}>Cancel</Button>
            <Button onClick={confirmSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeaveGuard active={editing && changes.length > 0} unsaved={["Profile"]} />
      <PasswordDialog open={changingPassword} onOpenChange={setChangingPassword} />
    </main>
  )
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [confirm, setConfirm] = React.useState("")

  React.useEffect(() => {
    if (open) { setCurrent(""); setNext(""); setConfirm("") }
  }, [open])

  const nextError = next !== "" && next.length < 8 ? "Use at least 8 characters." : next !== "" && next === current ? "Choose a password different from your current one." : ""
  const confirmError = confirm !== "" && confirm !== next ? "The passwords don't match." : ""
  const valid = current !== "" && next.length >= 8 && next !== current && confirm === next

  const submit = () => {
    onOpenChange(false)
    toast.success("Password successfully changed")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4 p-4 sm:max-w-lg sm:p-6">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-semibold leading-none tracking-tight">Change password</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Enter your current password, then choose a new one.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close change password" className="absolute right-0 top-0" onClick={() => onOpenChange(false)}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">Current password
            <Input type="password" autoComplete="current-password" className="bg-muted/40" value={current} onChange={(event) => setCurrent(event.target.value)} />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">New password
            <Input type="password" autoComplete="new-password" className="bg-muted/40" value={next} onChange={(event) => setNext(event.target.value)} />
            {nextError && <p className="text-sm font-normal text-destructive">{nextError}</p>}
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">Confirm new password
            <Input type="password" autoComplete="new-password" className="bg-muted/40" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            {confirmError && <p className="text-sm font-normal text-destructive">{confirmError}</p>}
          </label>
        </div>
        <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid} onClick={submit}>Change password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
