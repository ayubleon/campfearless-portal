"use client"

import * as React from "react"
import Link from "next/link"
import { differenceInCalendarDays, format } from "date-fns"
import { AlertCircle, X } from "lucide-react"
import { IconCalendar, IconInfoCircle } from "@tabler/icons-react"
import { toast } from "sonner"

import { campDatesSet, campOverlap, campRecords, canSwitchOffCamp, setCampRuns, startNewEditionCamps, type CampDetails, type CampId, type CampRecord } from "@/lib/camp-data"
import { currentUser } from "@/lib/session"
import { cn } from "@/lib/utils"
import { formatDateTime, formatNumber } from "@/lib/format"
import { statusClass } from "@/lib/status"
import { Badge } from "@/ui/badge"
import { LoadingButton } from "@/components/loading-button"
import { useAction } from "@/lib/use-action"
import { UndoOverlay } from "@/components/undo-overlay"
import { LeaveGuard } from "@/components/leave-guard"
import { editionLabel, editions, facilitatorFeeOf } from "@/lib/editions"
import { EditionsCard } from "@/components/camp-editions"
import { WelcomePageCard, initialWelcome } from "@/components/camp-setup-welcome"
import { Button } from "@/ui/button"
import { Calendar } from "@/ui/calendar"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import { Progress } from "@/ui/progress"
import { Switch } from "@/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"

// Until Users and roles exists, the signed-in user's name is hardcoded like the sidebar's.

export type { CampId }
type Camp = CampRecord

type SharedSettings = { facilitatorFee: number }

export type FieldSpec<T> = { key: keyof T; label: string; format: (value: never) => string }

const initialCamps: Camp[] = campRecords

const formatDate = (value: Date | null) => (value ? format(value, "dd/MM/yyyy") : "Not set")
const formatMoney = (value: number) => `KES ${formatNumber(value)}`

const campFields: FieldSpec<CampDetails>[] = [
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

function linkStatus(camp: Camp, closed = false) {
  if (closed) return "Closed"
  const today = new Date()
  const { opens, closes } = camp.details
  if (!opens || !closes) return "Dates needed"
  if (differenceInCalendarDays(closes, today) < 0) return "Inactive"
  if (camp.paused) return "Paused"
  return opens > today ? "Scheduled" : "Active link"
}

function linkHint(camp: Camp, status: string) {
  if (status === "Closed") return "This edition is closed. Campers can't sign up."
  const today = new Date()
  const { opens, closes } = camp.details
  if (!opens || !closes) return "Set the camp dates and the registration window to open registration."
  if (status === "Inactive") return `Closed on ${formatDate(closes)}.`
  if (status === "Paused") return "Campers can't sign up until you resume the link."
  if (status === "Scheduled") {
    const days = differenceInCalendarDays(opens, today)
    return days === 1 ? "Opens tomorrow." : `Opens in ${plural(days, "day")}.`
  }
  const days = differenceInCalendarDays(closes, today)
  return days === 0 ? "Closes today." : `Closes in ${plural(days, "day")}.`
}

function parseNumber(value: string) {
  return Number(value.replace(/\D/g, "").slice(0, 9)) || 0
}

function sameValues<T>(fields: FieldSpec<T>[], a: T, b: T) {
  return fields.every((field) => field.format(a[field.key] as never) === field.format(b[field.key] as never))
}

export function ValueBox({ children }: { children: React.ReactNode }) {
  return <div className="flex h-8 min-w-0 items-center rounded-lg border bg-muted/20 px-2.5 text-sm font-normal tabular-nums"><span className="truncate">{children}</span></div>
}

export function SetupField({ label, editing, children }: { label: string; editing: boolean; children: React.ReactNode }) {
  const Wrapper = editing ? "label" : "div"
  return <Wrapper className="flex min-w-0 flex-col gap-2 text-sm font-medium">{label}{children}</Wrapper>
}

function TextField({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (value: string) => void }) {
  return (
    <SetupField label={label} editing={editing}>
      {editing ? <Input className="bg-muted/40" value={value} onChange={(event) => onChange(event.target.value)} /> : <ValueBox>{value}</ValueBox>}
    </SetupField>
  )
}

function NumberField({ label, value, editing, money, onChange }: { label: string; value: number; editing: boolean; money?: boolean; onChange: (value: number) => void }) {
  return (
    <SetupField label={label} editing={editing}>
      {editing ? (
        <span className="relative">
          {money && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-normal text-muted-foreground">KES</span>}
          <Input inputMode="numeric" className={cn("bg-muted/40 tabular-nums", money && "pl-11")} value={formatNumber(value)} onChange={(event) => onChange(parseNumber(event.target.value))} />
        </span>
      ) : (
        <ValueBox>{money ? formatMoney(value) : formatNumber(value)}</ValueBox>
      )}
    </SetupField>
  )
}

function DateField({ label, value, editing, onChange, disabled }: { label: string; value: Date | null; editing: boolean; onChange: (value: Date) => void; disabled?: React.ComponentProps<typeof Calendar>["disabled"] }) {
  const [open, setOpen] = React.useState(false)
  return (
    <SetupField label={label} editing={editing}>
      {editing ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full min-w-0 justify-between bg-muted/40 px-2.5 font-normal tabular-nums">
              <span className={cn("min-w-0 truncate", !value && "text-muted-foreground")}>{value ? formatDate(value) : "dd/mm/yyyy"}</span>
              <IconCalendar className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent aria-label={`Choose ${label.toLowerCase()}`} className="w-auto overflow-hidden p-0" align="start">
            <Calendar mode="single" selected={value ?? undefined} defaultMonth={value ?? undefined} disabled={disabled} onSelect={(date) => { if (date) { onChange(date); setOpen(false) } }} />
          </PopoverContent>
        </Popover>
      ) : (
        <ValueBox>{formatDate(value)}</ValueBox>
      )}
    </SetupField>
  )
}

// The small "i" button that explains something in a few words. A popover, so it opens on tap as well as on a mouse click.
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-xs" aria-label={label} className="text-muted-foreground">
          <IconInfoCircle />
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={label} className="w-64 text-sm" align="start" collisionPadding={16}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

function SpotsInfo() {
  return <InfoTip label="How camper spots are counted">Facilitators and waived campers are counted. Cancelled registrations free up a spot.</InfoTip>
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>
}

type Change = { label: string; from: string; to: string }

function ReviewDialog({ open, title, changes, warnings, pending, onCancel, onConfirm }: { open: boolean; title: string; changes: Change[]; warnings: string[]; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">{title}</DialogTitle>
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
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>Cancel</Button>
          <LoadingButton type="button" pending={pending} loadingLabel="Saving..." onClick={onConfirm}>Save changes</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SetupCard<T>({ title, description, saved, fields, saveLabel, successMessage, lastSaved, auditHref, canEdit, onDirtyChange, onSave, validate, warnings, headerAction, headerExtra, children }: {
  title: string
  description: React.ReactNode
  saved: T
  fields: FieldSpec<T>[]
  saveLabel: string
  successMessage: string
  lastSaved: { by: string; at: Date }
  auditHref: string
  canEdit: boolean
  onDirtyChange: (dirty: boolean) => void
  onSave: (value: T) => void
  validate: (value: T) => boolean
  warnings: (draft: T, saved: T) => string[]
  headerAction?: (value: T) => React.ReactNode // beside Edit, e.g. a Preview button
  headerExtra?: React.ReactNode // a line under the description, e.g. a share link
  children: (value: T, editing: boolean, update: (patch: Partial<T>) => void) => React.ReactNode
}) {
  // A card whose saved values aren't valid yet (a new edition's empty dates) opens straight in edit mode and can't be cancelled.
  const mustComplete = canEdit && !validate(saved)
  const [draft, setDraft] = React.useState<T | null>(mustComplete ? saved : null)
  const [reviewing, setReviewing] = React.useState(false)
  const editing = draft !== null
  const value = draft ?? saved
  const dirty = editing && !sameValues(fields, draft, saved)
  const changes = draft ? fields.filter((field) => field.format(saved[field.key] as never) !== field.format(draft[field.key] as never)).map((field) => ({ label: field.label, from: field.format(saved[field.key] as never), to: field.format(draft[field.key] as never) })) : []

  React.useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const { pending, run } = useAction()
  const confirmSave = async () => {
    if (!draft) return
    if (!(await run(() => onSave(draft), "save the changes"))) return
    setReviewing(false)
    setDraft(null)
    toast.success(successMessage)
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {headerExtra}
        {(headerAction || (canEdit && !editing)) && (
          <CardAction>
            <div className="flex gap-3">
              {headerAction?.(value)}
              {canEdit && !editing && <Button type="button" variant="outline" onClick={() => setDraft(saved)}>Edit</Button>}
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {children(value, editing, (patch) => setDraft((current) => ({ ...(current ?? saved), ...patch })))}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <Link href={auditHref} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Last saved by {lastSaved.by}, <span className="tabular-nums">{formatDateTime(lastSaved.at)}</span></Link>
          {editing && (
            <div className="flex justify-end gap-3">
              {!mustComplete && <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>}
              <Button type="button" disabled={!dirty || !validate(value)} onClick={() => setReviewing(true)}>{saveLabel}</Button>
            </div>
          )}
        </div>
      </CardContent>
      <ReviewDialog open={reviewing} title={`Review ${title} changes`} changes={changes} warnings={draft ? warnings(draft, saved) : []} pending={pending} onCancel={() => setReviewing(false)} onConfirm={confirmSave} />
    </Card>
  )
}

function CampCard({ camp, other, canEdit, closed, onDirtyChange, onSave, onTogglePause, onRuns }: { camp: Camp; other: Camp; canEdit: boolean; closed: boolean; onDirtyChange: (dirty: boolean) => void; onRuns: (runs: boolean) => void; onSave: (details: CampDetails) => void; onTogglePause: () => void }) {
  const status = linkStatus(camp, closed)
  const overlapMessage = (details: CampDetails) => {
    if (!other.runs || !camp.runs) return null
    const overlap = campOverlap(details, other.details)
    return overlap ? `MYF and MYA overlap from ${formatDate(overlap.start)} to ${formatDate(overlap.end)}. Camps should not run at the same time.` : null
  }

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
      headerExtra={<CampRunsLine camp={camp} other={other} canEdit={canEdit} closed={closed} onChange={onRuns} />}
      saved={camp.details}
      fields={campFields}
      saveLabel={`Save ${camp.id} setup`}
      successMessage={`${camp.id} setup successfully saved`}
      lastSaved={camp.lastSaved}
      auditHref={`/audit-log?camp=${camp.id}&area=camp-setup`}
      canEdit={canEdit}
      onDirtyChange={onDirtyChange}
      onSave={onSave}
      validate={(details) => campDatesSet(details) && details.campEnd! >= details.campStart! && details.closes! >= details.opens! && details.camperLimit >= camp.spotsUsed && details.camperLimit > 0}
      warnings={(draft, saved) => [
        ...(draft.onlineFee !== saved.onlineFee || draft.walkInFee !== saved.walkInFee ? [`New fees apply to new registrations only. The ${formatNumber(camp.spotsUsed)} campers already registered keep what they paid.`] : []),
        ...(draft.closes && saved.closes && draft.closes < saved.closes && status !== "Inactive" ? [`Registration will now close on ${formatDate(draft.closes)}. Campers can't sign up after that date.`] : []),
        ...(draft.closes && draft.campStart && draft.closes > draft.campStart ? ["Registration closes after the camp starts."] : []),
        ...(overlapMessage(draft) ? [overlapMessage(draft)!] : []),
      ]}
    >
      {(details, editing, update) => {
        const spotsLeft = Math.max(details.camperLimit - camp.spotsUsed, 0)
        const usedPercent = details.camperLimit ? Math.min((camp.spotsUsed / details.camperLimit) * 100, 100) : 100
        return (
          <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <section className="flex min-w-0 flex-col gap-4">
              <h3 className="-mb-2 text-sm text-muted-foreground">Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <DateField label="Camp start" value={details.campStart} editing={editing} onChange={(campStart) => update({ campStart, campEnd: details.campEnd && details.campEnd < campStart ? campStart : details.campEnd })} />
                <DateField label="Camp end" value={details.campEnd} editing={editing} disabled={details.campStart ? { before: details.campStart } : undefined} onChange={(campEnd) => update({ campEnd })} />
              </div>
              {overlapMessage(details) && <FieldError>{overlapMessage(details)}</FieldError>}
              <div className="flex flex-col gap-2">
                <NumberField label="Camper limit" value={details.camperLimit} editing={editing} onChange={(camperLimit) => update({ camperLimit })} />
                <Progress value={usedPercent} aria-label="Camper spots used" className="h-1.5 bg-muted [&>div]:bg-emerald-500" />
                {editing && details.camperLimit < camp.spotsUsed && <FieldError>The limit can&apos;t be below the {formatNumber(camp.spotsUsed)} spots already used.</FieldError>}
                <p className="flex items-center gap-1 text-sm text-muted-foreground"><span><span className="tabular-nums">{formatNumber(camp.spotsUsed)} of {formatNumber(details.camperLimit)}</span> camper spots used. <span className="tabular-nums">{formatNumber(spotsLeft)}</span> left.</span><SpotsInfo /></p>
              </div>
            </section>
            <section className="flex min-w-0 flex-col gap-4">
              <h3 className="-mb-2 text-sm text-muted-foreground">Fees, full payment only</h3>
              <NumberField label="Online registration" money value={details.onlineFee} editing={editing} onChange={(onlineFee) => update({ onlineFee })} />
              <NumberField label="Walk-in (desk) registration" money value={details.walkInFee} editing={editing} onChange={(walkInFee) => update({ walkInFee })} />
            </section>
            <section className="flex min-w-0 flex-col gap-4 md:col-span-2 xl:col-span-1">
              <h3 className="-mb-2 flex items-center gap-1 text-sm text-muted-foreground">Registration link<InfoTip label="What the registration link does">Sends campers straight to {camp.id} registration. The address never changes, so a link you shared earlier keeps working in every edition.</InfoTip></h3>
              <SetupField label="Registration link" editing={false}>
                <span className="flex items-center gap-3">
                  <span className="min-w-0 flex-1"><ValueBox><span className="text-muted-foreground">{camp.link}</span></ValueBox></span>
                  <Badge variant="outline" className={cn("whitespace-nowrap", statusClass(status))}>{status}</Badge>
                </span>
              </SetupField>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-4">
                  <DateField label="Opens" value={details.opens} editing={editing} onChange={(opens) => update({ opens, closes: details.closes && details.closes < opens ? opens : details.closes })} />
                  <DateField label="Closes" value={details.closes} editing={editing} disabled={details.opens ? { before: details.opens } : undefined} onChange={(closes) => update({ closes })} />
                </div>
                {editing && details.closes && details.campStart && details.closes > details.campStart && <FieldError>Registration closes after the camp starts.</FieldError>}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={copyLink}>Copy link</Button>
                  <Button type="button" variant="outline" disabled={status === "Inactive" || status === "Dates needed" || status === "Closed"} onClick={onTogglePause}>{camp.paused ? "Resume link" : "Pause link"}</Button>
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

// "Runs in this edition": switches a camp off for the open edition (for example when only MYA is held). Turning it back on is instant;
// turning it off asks first, and is not allowed while anyone is registered for the camp or if it is the edition's only camp.
function CampRunsLine({ camp, other, canEdit, closed, onChange }: { camp: Camp; other: Camp; canEdit: boolean; closed: boolean; onChange: (runs: boolean) => void }) {
  const [dialog, setDialog] = React.useState<"off" | "blocked" | null>(null)
  const allowed = canSwitchOffCamp(camp.spotsUsed, other.runs ? 1 : 0)
  const close = () => setDialog(null)
  if (closed) return <p className="text-sm text-muted-foreground">{camp.runs ? "Ran in this edition." : "Did not run in this edition."}</p>
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="flex items-center gap-3">
        <Switch checked={camp.runs} disabled={!canEdit} aria-label={`${camp.id} runs in this edition`} onCheckedChange={(next) => (next ? onChange(true) : setDialog(allowed ? "off" : "blocked"))} />
        <span className="text-sm font-medium">Runs in this edition</span>
      </div>
      {!camp.runs && <span className="text-sm text-muted-foreground">Hidden from the welcome page, registration and the dashboard.</span>}
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 pr-10 text-base font-bold leading-none tracking-tight"><AlertCircle className="text-destructive" />{dialog === "blocked" ? `Can't switch off ${camp.id} yet` : `Switch off ${camp.id}?`}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {dialog === "blocked"
                ? camp.spotsUsed > 0
                  ? <><strong className="text-foreground">{formatNumber(camp.spotsUsed)}</strong> {camp.spotsUsed === 1 ? "person has" : "people have"} already registered for {camp.id} in this edition. A camp with registrations has to stay on.</>
                  : <>{camp.id} is the only camp in this edition. An edition needs at least one camp, so switch the other camp on first.</>
                : <><strong className="text-foreground">{camp.id}</strong> will be hidden from the welcome page, its registration link will stop taking sign-ups, and it will leave the dashboard, Registration, Waivers and Payments for this edition. Its settings are kept and you can switch it on again.</>}
            </DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close" className="absolute right-0 top-0" onClick={close}><X className="size-4" /></Button>
          </DialogHeader>
          <DialogFooter className={cn("mt-4 gap-3 sm:mt-6", dialog === "blocked" ? "flex-row justify-end" : "grid grid-cols-2 sm:justify-stretch")}>
            {dialog === "blocked" ? (
              <Button type="button" onClick={close}>Got it</Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="button" onClick={() => { onChange(false); close() }}>Switch off {camp.id}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PauseOverlay({ camp, onUndo, onDone }: { camp: Camp; onUndo: () => void; onDone: () => void }) {
  return (
    <UndoOverlay
      title={camp.paused ? "Registration link paused" : "Registration link resumed"}
      description={camp.paused ? `${camp.id} campers can't sign up until you resume the link.` : `${camp.id} campers can sign up again.`}
      onUndo={onUndo}
      onDone={() => { onDone(); toast.success(camp.paused ? "Registration link successfully paused" : "Registration link successfully resumed") }}
    />
  )
}

export function CampSetupScreen({ canEdit = true }: { canEdit?: boolean }) {
  const [camps, setCamps] = React.useState(initialCamps)
  const [editionId, setEditionId] = React.useState(campRecords[0].editionId)
  // The edition list lives outside this screen (closing or opening one changes it), so re-read it after every change.
  const [, refresh] = React.useReducer((count: number) => count + 1, 0)
  const closed = !editions.some((edition) => edition.open)
  const editable = canEdit && !closed
  const today = new Date()
  const running = camps.filter((camp) => camp.runs)
  const allEnded = !closed && running.length > 0 && running.every((camp) => camp.details.campEnd !== null && camp.details.campEnd < today)
  const [shared, setShared] = React.useState<{ settings: SharedSettings; lastSaved: { by: string; at: Date } }>({ settings: { facilitatorFee: facilitatorFeeOf(campRecords[0].editionId) }, lastSaved: { by: "John Doe", at: new Date(2026, 9, 12, 11, 20) } })
  const [welcome, setWelcome] = React.useState({ settings: initialWelcome, lastSaved: { by: "John Doe", at: new Date(2026, 9, 14, 16, 30) } })
  const [dirty, setDirty] = React.useState<Record<string, boolean>>({})
  const [tab, setTab] = React.useState("editions")
  const [pauseNotice, setPauseNotice] = React.useState<CampId | null>(null)
  const unsaved = Object.keys(dirty).filter((key) => dirty[key])

  const dirtyHandlers = React.useMemo(() => Object.fromEntries(["Welcome page", "MYF setup", "MYA setup", "Shared settings"].map((name) => [name, (value: boolean) => setDirty((current) => (current[name] === value ? current : { ...current, [name]: value }))])), [])
  const updateCamp = (id: CampId, patch: (camp: Camp) => Partial<Camp>) => setCamps((current) => current.map((camp) => (camp.id === id ? { ...camp, ...patch(camp) } : camp)))

  const noticeCamp = camps.find((camp) => camp.id === pauseNotice)

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger className="w-full" value="editions">Editions</TabsTrigger>
          <TabsTrigger className="w-full" value="setup">Camp settings</TabsTrigger>
        </TabsList>

        <TabsContent value="editions">
          <EditionsCard canEdit={canEdit} onEditionsChange={refresh} onNewEdition={(id) => { setCamps(campRecords.map((record) => ({ ...record }))); setEditionId(id); setPauseNotice(null); setTab("setup"); refresh() }} />
        </TabsContent>

        {/* Kept mounted so a card with unsaved edits keeps them while someone looks at the editions. */}
        <TabsContent value="setup" forceMount className="flex flex-col gap-4 data-[state=inactive]:hidden">
          {closed ? (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p><strong className="text-foreground">{editionLabel(editionId)}</strong> is closed. Its settings are read-only and its records stay in Reports. Create a new edition to set up the next camp.</p>
              <Button type="button" variant="outline" className="w-fit" onClick={() => setTab("editions")}>Go to Editions</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Everything below applies to <strong className="text-foreground">{editionLabel(editionId)}</strong>, the open edition.</p>
          )}
          {allEnded && (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p><strong className="text-foreground">{running.length > 1 ? "The camps have ended." : "This camp has ended."}</strong> Close the edition when you&apos;re done.</p>
              <Button type="button" variant="outline" className="w-fit" onClick={() => setTab("editions")}>Go to Editions</Button>
            </div>
          )}
          {!closed && camps.some((camp) => !campDatesSet(camp.details)) && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Set the dates to begin.</strong> Each camp needs its camp dates and registration window before campers can sign up.</p>}
          <WelcomePageCard
            saved={welcome.settings}
            lastSaved={welcome.lastSaved}
            canEdit={editable}
            onDirtyChange={dirtyHandlers["Welcome page"]}
            onSave={(settings) => setWelcome({ settings, lastSaved: { by: currentUser.name, at: new Date() } })}
          />
          {camps.map((camp) => (
            <CampCard
              key={`${editionId}-${camp.id}`}
              camp={camp}
              other={camps.find((item) => item.id !== camp.id)!}
              canEdit={editable}
              closed={closed}
              onDirtyChange={dirtyHandlers[`${camp.id} setup`]}
              onSave={(details) => updateCamp(camp.id, () => ({ details, lastSaved: { by: currentUser.name, at: new Date() } }))}
              onTogglePause={() => { updateCamp(camp.id, (current) => ({ paused: !current.paused })); setPauseNotice(camp.id) }}
              onRuns={(runs) => { setCampRuns(camp.id, runs); updateCamp(camp.id, () => ({ runs })); toast.success(runs ? `${camp.id} successfully switched on` : `${camp.id} successfully switched off`) }}
            />
          ))}
          <SetupCard
            title="Shared settings"
            description="Fees that apply to both MYF and MYA."
            saved={shared.settings}
            fields={sharedFields}
            saveLabel="Save shared settings"
            successMessage="Shared settings successfully saved"
            lastSaved={shared.lastSaved}
            auditHref="/audit-log?camp=system&area=camp-setup"
            canEdit={editable}
            onDirtyChange={dirtyHandlers["Shared settings"]}
            onSave={(settings) => setShared({ settings, lastSaved: { by: currentUser.name, at: new Date() } })}
            validate={() => true}
            warnings={() => ["This fee applies to both MYF and MYA. Facilitators already registered keep what they paid."]}
          >
            {(settings, editing, update) => (
              <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
                <section className="flex min-w-0 flex-col gap-4">
                  <h3 className="-mb-2 text-sm text-muted-foreground">Fees, full payment only</h3>
                  <NumberField label="Facilitator registration" money value={settings.facilitatorFee} editing={editing} onChange={(facilitatorFee) => update({ facilitatorFee })} />
                </section>
              </div>
            )}
          </SetupCard>
        </TabsContent>
      </Tabs>
      {noticeCamp && <PauseOverlay key={`${noticeCamp.id}-${noticeCamp.paused}`} camp={noticeCamp} onUndo={() => { updateCamp(noticeCamp.id, (current) => ({ paused: !current.paused })); setPauseNotice(null) }} onDone={() => setPauseNotice(null)} />}
      <LeaveGuard active={unsaved.length > 0} unsaved={unsaved} />
    </main>
  )
}
