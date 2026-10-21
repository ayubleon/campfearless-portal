"use client"

import * as React from "react"
import Image from "next/image"
import { toast } from "sonner"

import { FieldError, SetupCard, SetupField, ValueBox, type CampId, type FieldSpec } from "@/components/camp-setup"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"
import { Textarea } from "@/ui/textarea"

// The public welcome page (campfearless-welcome). Its address is fixed; the content below is what Camp setup feeds it.
const welcomeLink = "https://campfearless-welcome.vercel.app"
// Short enough for about three lines on the card. A character limit cannot be dodged by typing without spaces.
const maxChars = 160
const maxImageBytes = 5 * 1024 * 1024

const campTabs: { id: CampId; label: string; defaultImage: string }[] = [
  { id: "MYF", label: "MYF (14 - 17)", defaultImage: "/camps/myf.webp" },
  { id: "MYA", label: "MYA (18+)", defaultImage: "/camps/mya.webp" },
]

type Part = "description" | "image" | "bring" | "expect" | "know"
type Key = `${"myf" | "mya"}${Capitalize<Part>}`

// Lists are stored one item per line. An empty image means the default image.
export type WelcomeSettings = Record<Key, string>

const keyOf = (camp: CampId, part: Part) => `${camp.toLowerCase()}${part[0].toUpperCase()}${part.slice(1)}` as Key
const limitText = (value: string) => value.slice(0, maxChars)
const items = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean)

const partLabels: Record<Part, string> = { description: "description", image: "image", bring: "what to bring", expect: "what to expect", know: "good to know" }
const formatPart: Record<Part, (value: string) => string> = {
  description: (value) => value.trim() || "-",
  image: (value) => (value ? "Custom image" : "Default image"),
  bring: (value) => items(value).join(" · ") || "-",
  expect: (value) => items(value).join(" · ") || "-",
  know: (value) => items(value).join(" · ") || "-",
}

export const welcomeFields: FieldSpec<WelcomeSettings>[] = campTabs.flatMap(({ id }) =>
  (Object.keys(partLabels) as Part[]).map((part) => ({ key: keyOf(id, part), label: `${id} ${partLabels[part]}`, format: formatPart[part] as (value: never) => string }))
)

// Sample content, the same as the welcome page's sample data.
export const initialWelcome: WelcomeSettings = {
  myfDescription: "Empowering teenagers through mentorship and engaging activities designed for this crucial development stage.",
  myfImage: "",
  myfBring: "Bible and a notebook\nBedding: a sleeping bag or sheets and a blanket\nToiletries and a towel\nComfortable clothes and a warm jacket\nA water bottle\nAny medication, to hand to the camp nurse at check-in",
  myfExpect: "Check-in from 8:00 AM on the first day\nWorship, teaching and small group sessions\nOutdoor activities and games\nMeals provided for the whole camp\nCheck-out after the closing session on the last day",
  myfKnow: "Keep your M-Pesa confirmation code. You'll need it at check-in.\nA guardian's contact details are required for every camper under 18.\nLeave valuables at home.\nTell the registration team about any allergy or medical condition.",
  myaDescription: "A space for young adults navigating post-high school life, campus, careers, and building lasting communities.",
  myaImage: "",
  myaBring: "Bible and a notebook\nBedding: a sleeping bag or sheets and a blanket\nToiletries and a towel\nComfortable clothes and a warm jacket\nA water bottle",
  myaExpect: "Check-in from 8:00 AM on the first day\nWorkshops on careers, campus life and community\nWorship, teaching and small group sessions\nMeals provided for the whole camp\nCheck-out after the closing session on the last day",
  myaKnow: "Keep your M-Pesa confirmation code. You'll need it at check-in.\nTell the registration team about any allergy or medical condition.",
}

export function welcomeValid(settings: WelcomeSettings) {
  return campTabs.every(({ id }) => {
    const description = settings[keyOf(id, "description")]
    return description.trim() !== "" && description.length <= maxChars && items(settings[keyOf(id, "bring")]).length > 0
  })
}

function TextBox({ children }: { children: React.ReactNode }) {
  return <div className="min-h-8 rounded-lg border bg-muted/20 px-2.5 py-1.5 text-sm font-normal">{children}</div>
}

function ListField({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (value: string) => void }) {
  return (
    <SetupField label={label} editing={editing}>
      {editing ? (
        <>
          <Textarea className="min-h-28 bg-muted/40 text-sm font-normal" value={value} onChange={(event) => onChange(event.target.value)} />
          <span className="text-sm font-normal text-muted-foreground">One item per line.</span>
        </>
      ) : (
        <TextBox>
          {items(value).length === 0 ? "-" : <ul className="flex list-disc flex-col gap-1 pl-4">{items(value).map((item) => <li key={item}>{item}</li>)}</ul>}
        </TextBox>
      )}
    </SetupField>
  )
}

function ImageField({ camp, defaultImage, value, editing, onChange }: { camp: CampId; defaultImage: string; value: string; editing: boolean; onChange: (value: string) => void }) {
  const input = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState("")

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > maxImageBytes) { setError("Choose an image under 5 MB."); return }
    setError("")
    onChange(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      Camp image
      <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
        <Image src={value || defaultImage} alt={`${camp} camp image`} fill sizes="384px" unoptimized loading="eager" className="object-cover" />
      </div>
      {editing && (
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => input.current?.click()}>Replace image</Button>
          {value && <Button type="button" variant="outline" onClick={() => { setError(""); onChange("") }}>Use default image</Button>}
          <Input ref={input} type="file" accept="image/*" aria-label={`Replace ${camp} image`} tabIndex={-1} className="hidden" onChange={(event) => { pick(event.target.files?.[0]); event.target.value = "" }} />
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
      <span className="font-normal text-muted-foreground">{value ? "Custom image." : "Default image."} A camp always has an image. Without a custom one, the default is used.</span>
    </div>
  )
}

function WelcomeLink() {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(welcomeLink)
      toast.success("Welcome page link successfully copied")
    } catch {
      toast.error("Failed to copy link. Something went wrong on our end. Please try again.")
    }
  }
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="text-sm text-muted-foreground">Welcome page link</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><ValueBox><span className="text-muted-foreground">{welcomeLink.replace("https://", "")}</span></ValueBox></div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={copy}>Copy link</Button>
          <Button type="button" variant="outline" asChild><a href={welcomeLink} target="_blank" rel="noreferrer">Open page</a></Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Share this link so campers can choose their camp. Each camp's own registration link is in its setup card.</p>
    </section>
  )
}

export function WelcomePageCard({ saved, lastSaved, canEdit, onDirtyChange, onSave }: { saved: WelcomeSettings; lastSaved: { by: string; at: Date }; canEdit: boolean; onDirtyChange: (dirty: boolean) => void; onSave: (settings: WelcomeSettings) => void }) {
  const [tab, setTab] = React.useState<CampId>("MYF")

  return (
    <SetupCard
      title="Welcome page"
      description="What campers see when they choose a camp. Camp names, dates, fees and registration links come from each camp's setup."
      saved={saved}
      fields={welcomeFields}
      saveLabel="Save welcome page"
      successMessage="Welcome page successfully saved"
      lastSaved={lastSaved}
      auditHref="/audit-log?area=camp-setup&q=Welcome"
      canEdit={canEdit}
      onDirtyChange={onDirtyChange}
      onSave={onSave}
      validate={welcomeValid}
      warnings={() => ["Campers see these changes on the welcome page as soon as you save."]}
    >
      {(settings, editing, update) => (
        <div className="flex flex-col gap-6">
          <WelcomeLink />
          <Tabs value={tab} onValueChange={(value) => setTab(value as CampId)} className="flex flex-col gap-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              {campTabs.map(({ id, label }) => <TabsTrigger key={id} className="w-full" value={id}>{label}</TabsTrigger>)}
            </TabsList>
            {campTabs.map(({ id, defaultImage }) => {
              const description = settings[keyOf(id, "description")]
              const chars = description.length
              const set = (part: Part) => (value: string) => update({ [keyOf(id, part)]: value } as Partial<WelcomeSettings>)
              return (
                <TabsContent key={id} value={id} className="grid gap-x-4 gap-y-6 md:grid-cols-2">
                  <section className="flex min-w-0 flex-col gap-4">
                    <h3 className="text-sm text-muted-foreground">Card</h3>
                    <SetupField label="Description" editing={editing}>
                      {editing ? (
                        <>
                          <Textarea className="min-h-20 bg-muted/40 text-sm font-normal" value={description} onChange={(event) => set("description")(limitText(event.target.value))} />
                          <span className={description.trim() === "" ? "text-sm font-normal text-destructive" : "text-sm font-normal text-muted-foreground"}>
                            {description.trim() === "" ? "Add a short description." : chars >= maxChars ? `${chars} of ${maxChars} characters. That's the limit.` : `${chars} of ${maxChars} characters.`}
                          </span>
                        </>
                      ) : (
                        <TextBox>{description}</TextBox>
                      )}
                    </SetupField>
                    <ImageField camp={id} defaultImage={defaultImage} value={settings[keyOf(id, "image")]} editing={editing} onChange={set("image")} />
                  </section>
                  <section className="flex min-w-0 flex-col gap-4">
                    <h3 className="text-sm text-muted-foreground">Requirements</h3>
                    <ListField label="What to bring" value={settings[keyOf(id, "bring")]} editing={editing} onChange={set("bring")} />
                    {editing && items(settings[keyOf(id, "bring")]).length === 0 && <FieldError>Add at least one item to bring.</FieldError>}
                    <ListField label="What to expect" value={settings[keyOf(id, "expect")]} editing={editing} onChange={set("expect")} />
                    <ListField label="Good to know" value={settings[keyOf(id, "know")]} editing={editing} onChange={set("know")} />
                  </section>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      )}
    </SetupCard>
  )
}
