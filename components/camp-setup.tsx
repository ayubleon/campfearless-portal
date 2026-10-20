"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { differenceInCalendarDays, format } from "date-fns"
import { AlertCircle, X } from "lucide-react"
import { IconCalendar } from "@tabler/icons-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { statusClass } from "@/lib/status"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Calendar } from "@/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import { Progress } from "@/ui/progress"

// Until Users and roles exists, the signed-in user's name is hardcoded like the sidebar's.
const currentUser = "John Doe"

type CampId = "MYF" | "MYA"

type CampDetails = {
  editionName: string
  campStart: Date
  campEnd: Date
  camperLimit: number
  onlineFee: number
  walkInFee: number
  opens: Date
  closes: Date
}

type Camp = {
  id: CampId
  description: string
  spotsUsed: number
  link: string
  paused: boolean
  details: CampDetails
  lastSaved: { by: string; at: Date }
}

type SharedSettings = { facilitatorFee: number }

type FieldSpec<T> = { key: keyof T; label: string; format: (value: never) => string }

const initialCamps: Camp[] = [
  { id: "MYF", description: "Mavuno Young and Fearless, ages 14 to 17", spotsUsed: 320, link: "register.mavuno.org/myf-2026-x7k2", paused: false, lastSaved: { by: "John Doe", at: new Date(2026, 9, 18, 14, 2) }, details: { editionName: "MYF Camp 2026", campStart: new Date(2026, 11, 1), campEnd: new Date(2026, 11, 6), camperLimit: 1000, onlineFee: 1000, walkInFee: 2000, opens: new Date(2026, 9, 1), closes: new Date(2026, 10, 30) } },
  { id: "MYA", description: "Mavuno Young Adults, age 18 and above", spotsUsed: 470, link: "register.mavuno.org/mya-2026-p4m9", paused: true, lastSaved: { by: "John Doe", at: new Date(2026, 9, 16, 9, 45) }, details: { editionName: "MYA Camp 2026", campStart: new Date(2026, 11, 1), campEnd: new Date(2026, 11, 6), camperLimit: 1000, onlineFee: 1000, walkInFee: 2000, opens: new Date(2026, 9, 1), closes: new Date(2026, 10, 30) } },
]

const formatDate = (value: Date) => format(value, "dd/MM/yyyy")
const formatNumber = (value: number) => value.toLocaleString("en-US")
const formatMoney = (value: number) => `KES ${formatNumber(value)}`
const formatSavedAt = (value: Date) => format(value, "d MMM yyyy, HH:mm")

const campFields: FieldSpec<CampDetails>[] = [
  { key: "editionName", label: "Edition name", format: String },
  { key: "campStart", label: "Camp start", format: formatDate },
  { key: "campEnd", label: "Camp end", format: formatDate },
  { key: "camperLimit", label: "Camper limit", format: formatNumber },
  { key: "onlineFee", label: "Online registration", format: formatMoney },
  { key: "walkInFee", label: "Walk-in (desk) registration", format: formatMoney },
  { key: "opens", label: "Registration opens", format: formatDate },
  { key: "closes", label: "Registration closes", format: formatDate },
]

const sharedFields: FieldSpec<SharedSettings>[] = [
  { key: "facilitatorFee", label: "Facilitator registration", format: formatMoney },
]

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function linkStatus(camp: Camp) {
  const today = new Date()
  if (differenceInCalendarDays(camp.details.closes, today) < 0) return "Inactive"
  if (camp.paused) return "Paused"
  return camp.details.opens > today ? "Scheduled" : "Active link"
}

function linkHint(camp: Camp, status: string) {
  const today = new Date()
  if (status === "Inactive") return `Closed on ${formatDate(camp.details.closes)}.`
  if (status === "Paused") return "Campers can't sign up until you resume the link."
  if (status === "Scheduled") {
    const days = differenceInCalendarDays(camp.details.opens, today)
    return days === 1 ? "Opens tomorrow." : `Opens in ${plural(days, "day")}.`
  }
  const days = differenceInCalendarDays(camp.details.closes, today)
  return days === 0 ? "Closes today." : `Closes in ${plural(days, "day")}.`
}

function parseNumber(value: string) {
  return Number(value.replace(/\D/g, "").slice(0, 9)) || 0
}

function sameValues<T>(fields: FieldSpec<T>[], a: T, b: T) {
  return fields.every((field) => field.format(a[field.key] as never) === field.format(b[field.key] as never))
}

function ValueBox({ children }: { children: React.ReactNode }) {
  return <div className="flex h-10 min-w-0 items-center rounded-md border bg-muted/20 px-3 text-sm font-normal tabular-nums"><span className="truncate">{children}</span></div>
}

function Field({ label, editing, children }: { label: string; editing: boolean; children: React.ReactNode }) {
  const Wrapper = editing ? "label" : "div"
  return <Wrapper className="flex min-w-0 flex-col gap-2 text-sm font-medium">{label}{children}</Wrapper>
}

function TextField({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (value: string) => void }) {
  return (
    <Field label={label} editing={editing}>
      {editing ? <Input className="bg-muted/40" value={value} onChange={(event) => onChange(event.target.value)} /> : <ValueBox>{value}</ValueBox>}
    </Field>
  )
}

function NumberField({ label, value, editing, money, onChange }: { label: string; value: number; editing: boolean; money?: boolean; onChange: (value: number) => void }) {
  return (
    <Field label={label} editing={editing}>
      {editing ? (
        <span className="relative">
          {money && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-normal text-muted-foreground">KES</span>}
          <Input inputMode="numeric" className={cn("bg-muted/40 tabular-nums", money && "pl-12")} value={formatNumber(value)} onChange={(event) => onChange(parseNumber(event.target.value))} />
        </span>
      ) : (
        <ValueBox>{money ? formatMoney(value) : formatNumber(value)}</ValueBox>
      )}
    </Field>
  )
}

function DateField({ label, value, editing, onChange, disabled }: { label: string; value: Date; editing: boolean; onChange: (value: Date) => void; disabled?: React.ComponentProps<typeof Calendar>["disabled"] }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Field label={label} editing={editing}>
      {editing ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full min-w-0 justify-between bg-muted/40 px-3 font-normal tabular-nums">
              <span className="min-w-0 truncate">{formatDate(value)}</span>
              <IconCalendar className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar mode="single" selected={value} defaultMonth={value} disabled={disabled} onSelect={(date) => { if (date) { onChange(date); setOpen(false) } }} />
          </PopoverContent>
        </Popover>
      ) : (
        <ValueBox>{formatDate(value)}</ValueBox>
      )}
    </Field>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>
}

type Change = { label: string; from: string; to: string }

function ReviewDialog({ open, title, changes, warnings, onCancel, onConfirm }: { open: boolean; title: string; changes: Change[]; warnings: string[]; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-semibold leading-none tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Check these changes before you save them.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close review changes" className="absolute right-0 top-0" onClick={onCancel}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pt-4">
          {changes.map((change) => (
            <div key={change.label} className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
              <div className="text-muted-foreground">{change.label}</div>
              <div className="tabular-nums">{change.from} → <strong className="text-foreground">{change.to}</strong></div>
            </div>
          ))}
        </div>
        {warnings.length > 0 && (
          <div className="flex flex-col gap-2 pt-4">
            {warnings.map((warning) => <p key={warning} className="flex gap-2 text-sm text-muted-foreground"><AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />{warning}</p>)}
          </div>
        )}
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={onConfirm}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SetupCard<T>({ title, description, saved, fields, note, saveLabel, successMessage, lastSaved, canEdit, onDirtyChange, onSave, validate, warnings, children }: {
  title: string
  description: string
  saved: T
  fields: FieldSpec<T>[]
  note: string
  saveLabel: string
  successMessage: string
  lastSaved: { by: string; at: Date }
  canEdit: boolean
  onDirtyChange: (dirty: boolean) => void
  onSave: (value: T) => void
  validate: (value: T) => boolean
  warnings: (draft: T, saved: T) => string[]
  children: (value: T, editing: boolean, update: (patch: Partial<T>) => void) => React.ReactNode
}) {
  const [draft, setDraft] = React.useState<T | null>(null)
  const [reviewing, setReviewing] = React.useState(false)
  const editing = draft !== null
  const value = draft ?? saved
  const dirty = editing && !sameValues(fields, draft, saved)
  const changes = draft ? fields.filter((field) => field.format(saved[field.key] as never) !== field.format(draft[field.key] as never)).map((field) => ({ label: field.label, from: field.format(saved[field.key] as never), to: field.format(draft[field.key] as never) })) : []

  React.useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const confirmSave = () => {
    if (!draft) return
    try {
      onSave(draft)
      setReviewing(false)
      setDraft(null)
      toast.success(successMessage)
    } catch {
      toast.error("Failed to save changes. Something went wrong on our end. Please try again.")
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {canEdit && !editing && <Button type="button" variant="outline" onClick={() => setDraft(saved)}>Edit</Button>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children(value, editing, (patch) => setDraft((current) => ({ ...(current ?? saved), ...patch })))}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{note}</p>
            <p className="text-xs text-muted-foreground">Last saved by {lastSaved.by}, <span className="tabular-nums">{formatSavedAt(lastSaved.at)}</span></p>
          </div>
          {editing && (
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="button" disabled={!dirty || !validate(value)} onClick={() => setReviewing(true)}>{saveLabel}</Button>
            </div>
          )}
        </div>
      </CardContent>
      <ReviewDialog open={reviewing} title={`Review ${title} changes`} changes={changes} warnings={draft ? warnings(draft, saved) : []} onCancel={() => setReviewing(false)} onConfirm={confirmSave} />
    </Card>
  )
}

function CampCard({ camp, canEdit, onDirtyChange, onSave, onTogglePause }: { camp: Camp; canEdit: boolean; onDirtyChange: (dirty: boolean) => void; onSave: (details: CampDetails) => void; onTogglePause: () => void }) {
  const status = linkStatus(camp)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${camp.link}`)
      toast.success("Registration link successfully copied")
    } catch {
      toast.error("Failed to copy link. Something went wrong on our end. Please try again.")
    }
  }

  return (
    <SetupCard
      title={`${camp.id} setup`}
      description={camp.description}
      saved={camp.details}
      fields={campFields}
      note={`Changes here only affect ${camp.id}. Existing registrations keep the fee they were charged.`}
      saveLabel={`Save ${camp.id} setup`}
      successMessage={`${camp.id} setup successfully saved`}
      lastSaved={camp.lastSaved}
      canEdit={canEdit}
      onDirtyChange={onDirtyChange}
      onSave={onSave}
      validate={(details) => details.editionName.trim() !== "" && details.camperLimit >= camp.spotsUsed && details.camperLimit > 0}
      warnings={(draft, saved) => [
        ...(draft.onlineFee !== saved.onlineFee || draft.walkInFee !== saved.walkInFee ? [`New fees apply to new registrations only. The ${formatNumber(camp.spotsUsed)} campers already registered keep what they paid.`] : []),
        ...(draft.closes < saved.closes && status !== "Inactive" ? [`Registration will now close on ${formatDate(draft.closes)}. Campers can't sign up after that date.`] : []),
        ...(draft.closes > draft.campStart ? ["Registration closes after the camp starts."] : []),
      ]}
    >
      {(details, editing, update) => {
        const spotsLeft = Math.max(details.camperLimit - camp.spotsUsed, 0)
        const usedPercent = details.camperLimit ? Math.min((camp.spotsUsed / details.camperLimit) * 100, 100) : 100
        return (
          <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <section className="flex min-w-0 flex-col gap-4">
              <h3 className="text-sm text-muted-foreground">Dates</h3>
              <TextField label="Edition name" value={details.editionName} editing={editing} onChange={(editionName) => update({ editionName })} />
              <div className="grid grid-cols-2 gap-4">
                <DateField label="Camp start" value={details.campStart} editing={editing} onChange={(campStart) => update({ campStart, campEnd: details.campEnd < campStart ? campStart : details.campEnd })} />
                <DateField label="Camp end" value={details.campEnd} editing={editing} disabled={{ before: details.campStart }} onChange={(campEnd) => update({ campEnd })} />
              </div>
              <div className="flex flex-col gap-2">
                <NumberField label="Camper limit" value={details.camperLimit} editing={editing} onChange={(camperLimit) => update({ camperLimit })} />
                <Progress value={usedPercent} aria-label="Camper spots used" className="h-1.5 bg-muted [&>div]:bg-emerald-500" />
                {editing && details.camperLimit < camp.spotsUsed && <FieldError>The limit can&apos;t be below the {formatNumber(camp.spotsUsed)} spots already used.</FieldError>}
                <p className="text-sm text-muted-foreground"><span className="tabular-nums">{formatNumber(camp.spotsUsed)} of {formatNumber(details.camperLimit)}</span> camper spots used. <span className="tabular-nums">{formatNumber(spotsLeft)}</span> left.</p>
                <p className="text-sm text-muted-foreground">Facilitators and waived campers are counted. Cancelled registrations free up a spot.</p>
              </div>
            </section>
            <section className="flex min-w-0 flex-col gap-4">
              <h3 className="text-sm text-muted-foreground">Fees, full payment only</h3>
              <NumberField label="Online registration" money value={details.onlineFee} editing={editing} onChange={(onlineFee) => update({ onlineFee })} />
              <NumberField label="Walk-in (desk) registration" money value={details.walkInFee} editing={editing} onChange={(walkInFee) => update({ walkInFee })} />
            </section>
            <section className="flex min-w-0 flex-col gap-4 md:col-span-2 xl:col-span-1">
              <h3 className="text-sm text-muted-foreground">Registration link</h3>
              <Field label="Registration link" editing={false}>
                <span className="flex items-center gap-3">
                  <span className="min-w-0 flex-1"><ValueBox><span className="text-muted-foreground">{camp.link}</span></ValueBox></span>
                  <Badge variant="outline" className={cn("whitespace-nowrap", statusClass(status))}>{status}</Badge>
                </span>
              </Field>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                  <DateField label="Opens" value={details.opens} editing={editing} onChange={(opens) => update({ opens, closes: details.closes < opens ? opens : details.closes })} />
                  <DateField label="Closes" value={details.closes} editing={editing} disabled={{ before: details.opens }} onChange={(closes) => update({ closes })} />
                </div>
                {editing && details.closes > details.campStart && <FieldError>Registration closes after the camp starts.</FieldError>}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={copyLink}>Copy link</Button>
                  <Button type="button" variant="outline" disabled={status === "Inactive"} onClick={onTogglePause}>{camp.paused ? "Resume link" : "Pause link"}</Button>
                </div>
                <p className="text-right text-sm text-muted-foreground">{linkHint(camp, status)}</p>
              </div>
            </section>
          </div>
        )
      }}
    </SetupCard>
  )
}

function PauseOverlay({ camp, onUndo, onDone }: { camp: Camp; onUndo: () => void; onDone: () => void }) {
  const [progress, setProgress] = React.useState(100)
  React.useEffect(() => {
    const startedAt = Date.now()
    const interval = window.setInterval(() => setProgress(Math.max(0, 100 - ((Date.now() - startedAt) / 5000) * 100)), 50)
    return () => window.clearInterval(interval)
  }, [])
  const title = camp.paused ? "Registration link paused" : "Registration link resumed"
  const description = camp.paused ? `${camp.id} campers can't sign up until you resume the link.` : `${camp.id} campers can sign up again.`

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
      <div role="status" className="relative w-[min(580px,calc(100vw-2rem))] rounded-lg border bg-background p-4 shadow-2xl">
        <Button type="button" variant="ghost" size="icon" aria-label="Dismiss link confirmation" className="absolute right-4 top-4" onClick={onDone}><X className="size-4" /></Button>
        <div className="space-y-2">
          <p className="text-base font-semibold leading-none tracking-tight">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-75" style={{ width: `${progress}%` }} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onUndo}>Undo</Button>
            <Button type="button" onClick={() => { onDone(); toast.success(camp.paused ? "Registration link successfully paused" : "Registration link successfully resumed") }}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaveDialog({ href, unsaved, onStay, onLeave }: { href: string | null; unsaved: string[]; onStay: () => void; onLeave: () => void }) {
  return (
    <Dialog open={href !== null} onOpenChange={(open) => !open && onStay()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight"><AlertCircle className="text-destructive" />Leave without saving?</DialogTitle>
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

export function CampSetupScreen({ canEdit = true }: { canEdit?: boolean }) {
  const router = useRouter()
  const [camps, setCamps] = React.useState(initialCamps)
  const [shared, setShared] = React.useState<{ settings: SharedSettings; lastSaved: { by: string; at: Date } }>({ settings: { facilitatorFee: 500 }, lastSaved: { by: "John Doe", at: new Date(2026, 9, 12, 11, 20) } })
  const [dirty, setDirty] = React.useState<Record<string, boolean>>({})
  const [pauseNotice, setPauseNotice] = React.useState<CampId | null>(null)
  const unsaved = Object.keys(dirty).filter((key) => dirty[key])
  const [leaveHref, setLeaveHref] = useLeaveGuard(unsaved.length > 0)

  const dirtyHandlers = React.useMemo(() => Object.fromEntries(["MYF setup", "MYA setup", "Shared settings"].map((name) => [name, (value: boolean) => setDirty((current) => (current[name] === value ? current : { ...current, [name]: value }))])), [])
  const updateCamp = (id: CampId, patch: (camp: Camp) => Partial<Camp>) => setCamps((current) => current.map((camp) => (camp.id === id ? { ...camp, ...patch(camp) } : camp)))

  React.useEffect(() => {
    if (!pauseNotice) return
    const timeout = window.setTimeout(() => setPauseNotice(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [pauseNotice])

  const noticeCamp = camps.find((camp) => camp.id === pauseNotice)

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      {camps.map((camp) => (
        <CampCard
          key={camp.id}
          camp={camp}
          canEdit={canEdit}
          onDirtyChange={dirtyHandlers[`${camp.id} setup`]}
          onSave={(details) => updateCamp(camp.id, () => ({ details, lastSaved: { by: currentUser, at: new Date() } }))}
          onTogglePause={() => { updateCamp(camp.id, (current) => ({ paused: !current.paused })); setPauseNotice(camp.id) }}
        />
      ))}
      <SetupCard
        title="Shared settings"
        description="Fees that apply to both MYF and MYA."
        saved={shared.settings}
        fields={sharedFields}
        note="Changes here affect both MYF and MYA. Existing registrations keep the fee they were charged."
        saveLabel="Save shared settings"
        successMessage="Shared settings successfully saved"
        lastSaved={shared.lastSaved}
        canEdit={canEdit}
        onDirtyChange={dirtyHandlers["Shared settings"]}
        onSave={(settings) => setShared({ settings, lastSaved: { by: currentUser, at: new Date() } })}
        validate={() => true}
        warnings={() => ["This fee applies to both MYF and MYA. Facilitators already registered keep what they paid."]}
      >
        {(settings, editing, update) => (
          <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <section className="flex min-w-0 flex-col gap-4">
              <h3 className="text-sm text-muted-foreground">Fees, full payment only</h3>
              <NumberField label="Facilitator registration" money value={settings.facilitatorFee} editing={editing} onChange={(facilitatorFee) => update({ facilitatorFee })} />
            </section>
          </div>
        )}
      </SetupCard>
      {noticeCamp && <PauseOverlay key={`${noticeCamp.id}-${noticeCamp.paused}`} camp={noticeCamp} onUndo={() => { updateCamp(noticeCamp.id, (current) => ({ paused: !current.paused })); setPauseNotice(null) }} onDone={() => setPauseNotice(null)} />}
      <LeaveDialog href={leaveHref} unsaved={unsaved} onStay={() => setLeaveHref(null)} onLeave={() => { const href = leaveHref; setDirty({}); setLeaveHref(null); if (href) router.push(href) }} />
    </main>
  )
}
