"use client"

import * as React from "react"
import { IconMinus, IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"

import { campusesByNetwork } from "@/lib/campuses"
import { cn } from "@/lib/utils"
import { LeaveGuard } from "@/components/leave-guard"
import { Field } from "@/components/field"
import { Button } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { UndoOverlay } from "@/components/undo-overlay"
import { Checkbox } from "@/ui/checkbox"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"

export type Camp = "MYF" | "MYA"

export type CamperForm = {
  firstName: string
  lastName: string
  age: string
  gender: "" | "Male" | "Female"
  phone: string
  baptised: "" | "Yes" | "No"
  fromMavuno: "Yes" | "No"
  campus: string
  church: string
  medical: boolean
  medicalDetails: string
  specialNeeds: boolean
  specialNeedsDetails: string
}

export type ContactForm = { firstName: string; lastName: string; phone: string; relationship: string }

// Same sample numbers as Camp setup until registrations are real.
export const camps: Record<Camp, { label: string; spotsUsed: number; camperLimit: number; walkInFee: number; campStart: Date; campEnd: Date; relationships: string[] }> = {
  MYF: { label: "MYF (14 - 17)", spotsUsed: 320, camperLimit: 1000, walkInFee: 2000, campStart: new Date(2026, 11, 1), campEnd: new Date(2026, 11, 6), relationships: ["Parent", "Guardian", "Sibling", "Relative", "Other"] },
  MYA: { label: "MYA (18+)", spotsUsed: 470, camperLimit: 1000, walkInFee: 2000, campStart: new Date(2026, 11, 1), campEnd: new Date(2026, 11, 6), relationships: ["Parent", "Spouse", "Sibling", "Relative", "Friend", "Other"] },
}
const maxBatch = 10
// One A–Z list: campers often don't know which network their campus belongs to.
const allCampuses = Object.values(campusesByNetwork).flat().sort((a, b) => a.localeCompare(b))
const paybill = { number: "400200", account: "CAMPFEARLESS" }

export const emptyCamper = (): CamperForm => ({ firstName: "", lastName: "", age: "", gender: "", phone: "", baptised: "", fromMavuno: "Yes", campus: "", church: "", medical: false, medicalDetails: "", specialNeeds: false, specialNeedsDetails: "" })
export const emptyContact = (): ContactForm => ({ firstName: "", lastName: "", phone: "", relationship: "" })

const formatNumber = (value: number) => value.toLocaleString("en-US")
export const phoneValid = (value: string) => /^0[17]\d{8}$/.test(value.replace(/\s/g, ""))
const codeValid = (value: string) => /^[A-Z0-9]{10}$/.test(value)
const ageValid = (camp: Camp, age: string) => (camp === "MYF" ? ["14", "15", "16", "17"].includes(age) : /^\d{2}$/.test(age) && Number(age) >= 18)

export function camperValid(camp: Camp, camper: CamperForm) {
  return (
    camper.firstName.trim() !== "" &&
    camper.lastName.trim() !== "" &&
    ageValid(camp, camper.age) &&
    camper.gender !== "" &&
    camper.baptised !== "" &&
    (camper.phone === "" || phoneValid(camper.phone)) &&
    (camper.fromMavuno === "No" || camper.campus !== "")
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-normal text-destructive">{children}</span>
}

export function Choice<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T | ""; onChange: (value: T) => void }) {
  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {label}
      <div className="flex gap-3">
        {options.map((option) => <Button key={option} type="button" variant={value === option ? "default" : "outline"} onClick={() => onChange(option)}>{option}</Button>)}
      </div>
    </div>
  )
}

function OptionCard({ name, checked, title, helper, detailsLabel, placeholder, details, onToggle, onDetails }: { name: string; checked: boolean; title: string; helper: string; detailsLabel: string; placeholder: string; details: string; onToggle: () => void; onDetails: (value: string) => void }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border bg-muted/30 p-4 text-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20">
      <span className="flex items-start gap-2 font-medium"><Checkbox checked={checked} onCheckedChange={() => onToggle()} className="mt-0.5" />{title}</span>
      <span className="pl-6 text-muted-foreground">{helper}</span>
      <span className={cn("grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out", checked ? "grid-rows-[1fr] opacity-100" : "-mt-2 grid-rows-[0fr] opacity-0")}>
        <span className="flex min-h-0 flex-col gap-2 pt-2">
          <span className="font-medium">{detailsLabel}</span>
          <Textarea className="min-h-20 resize-none bg-background text-sm font-normal" placeholder={placeholder} value={details} onChange={(event) => onDetails(event.target.value)} />
        </span>
      </span>
    </label>
  )
}

export function CamperFields({ camp, camper, id, onChange }: { camp: Camp; camper: CamperForm; id: string; onChange: (patch: Partial<CamperForm>) => void }) {
  return (
    <>
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="First name"><Input className="bg-muted/40" value={camper.firstName} onChange={(event) => onChange({ firstName: event.target.value })} /></Field>
      <Field label="Last name"><Input className="bg-muted/40" value={camper.lastName} onChange={(event) => onChange({ lastName: event.target.value })} /></Field>
      {camp === "MYF" ? (
        <Field label="Age">
          <Select value={camper.age} onValueChange={(age) => onChange({ age })}>
            <SelectTrigger className="w-full bg-muted/40"><SelectValue placeholder="Choose age" /></SelectTrigger>
            <SelectContent>{["14", "15", "16", "17"].map((age) => <SelectItem key={age} value={age}>{age}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      ) : (
        <Field label="Age">
          <Input inputMode="numeric" className="bg-muted/40 tabular-nums" value={camper.age} onChange={(event) => onChange({ age: event.target.value.replace(/\D/g, "").slice(0, 2) })} />
          {camper.age !== "" && !ageValid(camp, camper.age) && <FieldError>MYA is for campers aged 18 and above.</FieldError>}
        </Field>
      )}
      <Choice label="Gender" options={["Male", "Female"]} value={camper.gender} onChange={(gender) => onChange({ gender })} />
      <Field label="Phone number">
        <Input inputMode="tel" className="bg-muted/40 tabular-nums" placeholder="Optional" value={camper.phone} onChange={(event) => onChange({ phone: event.target.value })} />
        {camper.phone !== "" && !phoneValid(camper.phone) && <FieldError>Enter a 10-digit number starting with 07 or 01.</FieldError>}
      </Field>
      <Choice label="Want to be baptised?" options={["Yes", "No"]} value={camper.baptised} onChange={(baptised) => onChange({ baptised })} />
    </div>

    <section className="pt-6">
      <h3 className="text-base font-semibold">Church campus</h3>
      <p className="mb-3 text-sm text-muted-foreground">Drives the campus and network breakdowns</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Choice label="Are you from Mavuno?" options={["Yes", "No"]} value={camper.fromMavuno} onChange={(fromMavuno) => onChange({ fromMavuno, campus: "", church: "" })} />
        {camper.fromMavuno === "Yes" ? (
          <Field label="Select campus">
            <Select value={camper.campus} onValueChange={(campus) => onChange({ campus })}>
              <SelectTrigger className="w-full bg-muted/40"><SelectValue placeholder="Choose campus" /></SelectTrigger>
              <SelectContent>{allCampuses.map((campus) => <SelectItem key={campus} value={campus}>{campus}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        ) : (
          <Field label="Church or organisation"><Input className="bg-muted/40" placeholder="Optional" value={camper.church} onChange={(event) => onChange({ church: event.target.value })} /></Field>
        )}
      </div>
    </section>

    <section className="pt-6">
      <h3 className="mb-3 text-base font-semibold">Medical and special needs</h3>
      <div className="flex flex-col gap-4">
        <OptionCard name={`${id}-medical`} checked={camper.medical} title="Medical condition / Severe allergies" helper="Check if this camper has acute health conditions requiring medical staff awareness." detailsLabel="Specify medical condition (15 words)" placeholder="e.g Asthma, Peanuts allergy, Epilepsy, Diabetes" details={camper.medicalDetails} onToggle={() => onChange({ medical: !camper.medical })} onDetails={(medicalDetails) => onChange({ medicalDetails })} />
        <OptionCard name={`${id}-special-needs`} checked={camper.specialNeeds} title="Special needs / Accessibility support" helper="Check if this camper requires physical, sensory, or mobility accommodations." detailsLabel="Specify special needs and accommodations (15 words)" placeholder="e.g Deaf, Autism spectrum, Anxiety" details={camper.specialNeedsDetails} onToggle={() => onChange({ specialNeeds: !camper.specialNeeds })} onDetails={(specialNeedsDetails) => onChange({ specialNeedsDetails })} />
      </div>
    </section>
    </>
  )
}

function CamperCard({ camp, camper, number, total, onChange }: { camp: Camp; camper: CamperForm; number: number; total: number; onChange: (patch: Partial<CamperForm>) => void }) {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Camper details</CardTitle>
        <CardDescription>Fill in your details as per your legal documents</CardDescription>
        <CardAction><span className="text-sm text-attention tabular-nums">Camper {number}/{total}</span></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">
        <CamperFields camp={camp} camper={camper} id={`camper-${number}`} onChange={onChange} />
      </CardContent>
    </Card>
  )
}

export const contactValid = (contact: ContactForm) => contact.firstName.trim() !== "" && contact.lastName.trim() !== "" && phoneValid(contact.phone) && contact.relationship !== ""

// MYA adults see "Contact" instead of "Guardian"; the data saved is the same.
export function ContactFields({ camp, contact, campers, onChange }: { camp: Camp; contact: ContactForm; campers: number; onChange: (patch: Partial<ContactForm>) => void }) {
  const contactLabel = camp === "MYF" ? "Guardian" : "Contact"
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label={`${contactLabel} first name`}><Input className="bg-muted/40" value={contact.firstName} onChange={(event) => onChange({ firstName: event.target.value })} /></Field>
      <Field label={`${contactLabel} last name`}><Input className="bg-muted/40" value={contact.lastName} onChange={(event) => onChange({ lastName: event.target.value })} /></Field>
      <Field label="Phone number">
        <Input inputMode="tel" className="bg-muted/40 tabular-nums" value={contact.phone} onChange={(event) => onChange({ phone: event.target.value })} />
        {contact.phone !== "" && !phoneValid(contact.phone) && <FieldError>Enter a 10-digit number starting with 07 or 01.</FieldError>}
      </Field>
      <div className="sm:col-span-3">
        <Field label={campers === 1 ? "Relationship to camper" : "Relationship to campers"}>
          <Select value={contact.relationship} onValueChange={(relationship) => onChange({ relationship })}>
            <SelectTrigger className="w-full bg-muted/40"><SelectValue placeholder="Choose relationship" /></SelectTrigger>
            <SelectContent>{camps[camp].relationships.map((relationship) => <SelectItem key={relationship} value={relationship}>{relationship}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )
}

export function DoneOverlay({ title, description, onUndo, onDone }: { title: string; description: string; onUndo: () => void; onDone: () => void }) {
  return <UndoOverlay title={title} description={description} onUndo={onUndo} onDone={onDone} />
}

export function RegistrationScreen() {
  const [camp, setCamp] = React.useState<Camp>("MYF")
  const [campers, setCampers] = React.useState<CamperForm[]>([emptyCamper()])
  const [contact, setContact] = React.useState<ContactForm>(emptyContact())
  const [code, setCode] = React.useState("")
  const [submitted, setSubmitted] = React.useState<{ title: string; description: string; toast: string } | null>(null)

  const settings = camps[camp]
  const spotsLeft = Math.max(settings.camperLimit - settings.spotsUsed, 0)
  const maxCount = Math.max(1, Math.min(maxBatch, spotsLeft))
  const count = campers.length
  const total = settings.walkInFee * count
  const valid = campers.every((camper) => camperValid(camp, camper)) && contactValid(contact) && codeValid(code)
  const setCount = (next: number) => setCampers((current) => (next > current.length ? [...current, ...Array.from({ length: next - current.length }, emptyCamper)] : current.slice(0, next)))
  const updateCamper = (index: number, patch: Partial<CamperForm>) => setCampers((current) => current.map((camper, i) => (i === index ? { ...camper, ...patch } : camper)))
  const switchCamp = (next: string) => {
    setCamp(next as Camp)
    setCampers((current) => current.map((camper) => ({ ...camper, age: "" })))
    setContact((current) => ({ ...current, relationship: camps[next as Camp].relationships.includes(current.relationship) ? current.relationship : "" }))
  }
  const reset = () => { setCampers([emptyCamper()]); setContact(emptyContact()); setCode("") }

  const submit = () => {
    const names = campers.map((camper) => `${camper.firstName.trim()} ${camper.lastName.trim()}`).join(", ")
    setSubmitted({ title: "Successfully registered and checked in", description: `${names} registered for ${camp} and checked in as present. M-Pesa code ${code}.`, toast: count === 1 ? "Camper successfully registered and checked in" : "Campers successfully registered and checked in" })
  }

  return (
    <main className="@container flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={camp} onValueChange={switchCamp} className="w-full sm:w-fit">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger className="w-full" value="MYF">{camps.MYF.label}</TabsTrigger>
            <TabsTrigger className="w-full" value="MYA">{camps.MYA.label}</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground tabular-nums">{formatNumber(settings.spotsUsed)} of {formatNumber(settings.camperLimit)} camper spots used. {formatNumber(spotsLeft)} left.</p>
      </div>

      <div className="grid gap-4 @7xl:grid-cols-[minmax(0,1fr)_24rem] @7xl:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Select number of campers</CardTitle>
              <CardDescription>How many attendees are you registering in this batch?</CardDescription>
              <CardAction>
                <div className="flex items-center gap-2">
                  <Button type="button" size="icon" aria-label="Remove a camper" disabled={count <= 1} onClick={() => setCount(count - 1)}><IconMinus /></Button>
                  <span className="flex h-8 w-10 items-center justify-center rounded-lg border bg-muted/40 text-sm tabular-nums" aria-live="polite">{count}</span>
                  <Button type="button" size="icon" aria-label="Add a camper" disabled={count >= maxCount} onClick={() => setCount(count + 1)}><IconPlus /></Button>
                </div>
              </CardAction>
            </CardHeader>
          </Card>

          {campers.map((camper, index) => <CamperCard key={index} camp={camp} camper={camper} number={index + 1} total={count} onChange={(patch) => updateCamper(index, patch)} />)}

          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Emergency contact</CardTitle>
              <CardDescription>Held in case of an emergency on site</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactFields camp={camp} contact={contact} campers={count} onChange={(patch) => setContact({ ...contact, ...patch })} />
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0 shadow-none @7xl:sticky @7xl:top-4">
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
            <CardDescription>Finish your registration by sending payment via M-Pesa. You&apos;ll get a confirmation code via SMS.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted/40 px-4 py-4 text-center">
              <div className="text-sm text-muted-foreground">Desk fee payment: Total amount due</div>
              <div className="py-1 text-xl font-semibold text-attention tabular-nums">Ksh {formatNumber(total)}</div>
              <div className="text-sm text-muted-foreground tabular-nums">for {count} {count === 1 ? "participant" : "participants"}</div>
            </div>
            <div className="grid grid-cols-2 rounded-lg bg-muted/40 px-4 py-3 text-center text-sm">
              <div><div className="font-medium">Paybill number</div><div className="font-semibold text-attention tabular-nums">{paybill.number}</div></div>
              <div><div className="font-medium">Account name</div><div className="font-semibold text-attention">{paybill.account}</div></div>
            </div>
            <Field label="M-Pesa confirmation code">
              <Input className="bg-muted/40 tabular-nums" placeholder="e.g UINKH7FJWL" maxLength={10} value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
              {code !== "" && !codeValid(code) && <FieldError>M-Pesa codes are 10 letters and numbers.</FieldError>}
            </Field>
            <div className="flex flex-col gap-2">
              <Button type="button" className="w-full" disabled={!valid} onClick={submit}>Complete & auto check-in</Button>
              {!valid && <p className="text-center text-xs text-muted-foreground">Fill in every camper, the emergency contact and the M-Pesa code to continue.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <LeaveGuard active={!submitted && (code !== "" || JSON.stringify(campers) !== JSON.stringify([emptyCamper()]) || JSON.stringify(contact) !== JSON.stringify(emptyContact()))} unsaved={["Registration"]} />
      {submitted && <DoneOverlay title={submitted.title} description={submitted.description} onUndo={() => setSubmitted(null)} onDone={() => { toast.success(submitted.toast); setSubmitted(null); reset() }} />}
    </main>
  )
}
