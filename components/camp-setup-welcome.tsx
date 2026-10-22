"use client"

import * as React from "react"
import Image from "next/image"
import { differenceInCalendarDays, format } from "date-fns"
import { IconCopy, IconExternalLink, IconEye, IconInfoCircle } from "@tabler/icons-react"
import { toast } from "sonner"

import { FieldError, InfoTip, SetupCard, SetupField, ValueBox, type CampId, type FieldSpec } from "@/components/camp-setup"
import { WelcomePreviewDialog, type PreviewCamp } from "@/components/welcome-preview"
import { campRecord, publicSite, runningCamps, type CampRecord } from "@/lib/camp-data"
import { formatCamperDateRange, formatNumber } from "@/lib/format"
import { Button } from "@/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import { Input } from "@/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip"
import { Textarea } from "@/ui/textarea"

// The public welcome page (campfearless-welcome). Its address is fixed; the content below is what Camp setup feeds it.
const welcomeLink = `https://${publicSite}`
// Short enough for about three lines on the card. A character limit cannot be dodged by typing without spaces.
const maxChars = 160
const maxImageBytes = 5 * 1024 * 1024

const campTabs: { id: CampId; label: string; defaultImage: string }[] = [
  { id: "MYF", label: campRecord("MYF").label, defaultImage: "/camps/myf.webp" },
  { id: "MYA", label: campRecord("MYA").label, defaultImage: "/camps/mya.webp" },
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

// What the welcome page's Register button says, from the camp's own setup (paused, dates, capacity).
function registerState(record: CampRecord) {
  const today = new Date()
  const { opens, closes } = record.details
  if (!opens || !closes) return { open: false, label: "Registration not open yet" }
  if (differenceInCalendarDays(closes, today) < 0) return { open: false, label: "Registration closed" }
  if (record.paused) return { open: false, label: "Registration paused" }
  if (opens > today) return { open: false, label: `Opens ${format(opens, "d MMM")}` }
  if (record.spotsUsed >= record.details.camperLimit) return { open: false, label: "Registration closed" }
  return { open: true, label: `Register for ${record.id}` }
}

function previewCamps(settings: WelcomeSettings): PreviewCamp[] {
  return campTabs.filter(({ id }) => runningCamps().includes(id)).map(({ id, label, defaultImage }) => {
    const record = campRecord(id)
    return {
      id,
      label,
      name: record.name,
      ageLabel: record.ageLabel,
      description: settings[keyOf(id, "description")].trim(),
      image: settings[keyOf(id, "image")] || defaultImage,
      dates: formatCamperDateRange(record.details.campStart, record.details.campEnd),
      fee: `KES ${formatNumber(record.details.onlineFee)}`,
      register: registerState(record),
      bring: items(settings[keyOf(id, "bring")]),
      expect: items(settings[keyOf(id, "expect")]),
      know: items(settings[keyOf(id, "know")]),
    }
  })
}

function TextBox({ children }: { children: React.ReactNode }) {
  return <div className="min-h-8 rounded-lg border bg-muted/20 px-2.5 py-1.5 text-sm font-normal">{children}</div>
}

function ListField({ label, value, editing, hint, onChange }: { label: string; value: string; editing: boolean; hint?: string; onChange: (value: string) => void }) {
  return (
    <SetupField label={label} editing={editing}>
      {editing ? (
        <>
          <Textarea className="min-h-28 bg-muted/40 text-sm font-normal" value={value} onChange={(event) => onChange(event.target.value)} />
          <span className="text-sm font-normal text-muted-foreground">One item per line.{hint ? ` ${hint}` : ""}</span>
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
    if (!file.type.startsWith("image/")) { setError("Choose an image file, such as JPG, PNG or WebP."); return }
    if (file.size > maxImageBytes) { setError("Choose an image under 5 MB."); return }
    setError("")
    onChange(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      <span className="flex items-center gap-1">
        Camp image
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="About the camp image" className="text-muted-foreground"><IconInfoCircle /></Button>
          </PopoverTrigger>
          <PopoverContent aria-label="About the camp image" className="w-64 text-sm" align="start" collisionPadding={16}>
            {value ? "This camp uses a custom image." : "This camp uses the default image."} A camp always has an image. Without a custom one, the default is used.
          </PopoverContent>
        </Popover>
      </span>
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
    </div>
  )
}

// The page's address is permanent: set up once with the website, never generated per edition, and it always shows
// the current camps. One muted line under the card description: the link opens the page, with copy and open icons.
function WelcomeLinkLine() {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(welcomeLink)
      toast.success("Welcome page link successfully copied")
    } catch {
      toast.error("Failed to copy link. Something went wrong on our end. Please try again.")
    }
  }
  return (
    <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
      <a href={welcomeLink} target="_blank" rel="noreferrer" className="min-w-0 truncate text-link underline decoration-link/30 underline-offset-4 hover:decoration-link">{welcomeLink.replace("https://", "")}</a>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Copy welcome page link" onClick={copy}><IconCopy /></Button>
        </TooltipTrigger>
        <TooltipContent>Copy link</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon-xs" asChild><a href={welcomeLink} target="_blank" rel="noreferrer" aria-label="Open welcome page"><IconExternalLink /></a></Button>
        </TooltipTrigger>
        <TooltipContent>Open page</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function WelcomePageCard({ saved, lastSaved, canEdit, onDirtyChange, onSave }: { saved: WelcomeSettings; lastSaved: { by: string; at: Date }; canEdit: boolean; onDirtyChange: (dirty: boolean) => void; onSave: (settings: WelcomeSettings) => void }) {
  // Only the camps the open edition runs are shown; a camp that is switched off has no welcome page content to edit.
  const shownTabs = campTabs.filter(({ id }) => runningCamps().includes(id))
  const [tab, setTab] = React.useState<CampId>(shownTabs[0]?.id ?? "MYF")
  const [preview, setPreview] = React.useState<WelcomeSettings | null>(null)

  return (
    <>
    <SetupCard
      title="Welcome page"
      description={<>What campers see when they choose a camp.<InfoTip label="Where the camp names, dates and fees come from">Camp names, dates, fees and registration links come from each camp&apos;s setup.</InfoTip></>}
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
      headerExtra={<WelcomeLinkLine />}
      headerAction={(value) => (
        <Button type="button" variant="outline" onClick={() => setPreview(value)}>
          <IconEye />
          Preview
        </Button>
      )}
    >
      {(settings, editing, update) => (
        <div className="flex flex-col gap-6">
          <Tabs value={tab} onValueChange={(value) => setTab(value as CampId)} className="flex flex-col gap-4">
            {shownTabs.length > 1 && <TabsList className="grid w-full max-w-md grid-cols-2">
              {shownTabs.map(({ id, label }) => <TabsTrigger key={id} className="w-full" value={id}>{label}</TabsTrigger>)}
            </TabsList>}
            {shownTabs.map(({ id, defaultImage }) => {
              const description = settings[keyOf(id, "description")]
              const chars = description.length
              const set = (part: Part) => (value: string) => update({ [keyOf(id, part)]: value } as Partial<WelcomeSettings>)
              return (
                <TabsContent key={id} value={id} className="grid gap-x-4 gap-y-6 md:grid-cols-2">
                  <section className="flex min-w-0 flex-col gap-4">
                    <h3 className="-mb-2 text-sm text-muted-foreground">Card</h3>
                    <ImageField camp={id} defaultImage={defaultImage} value={settings[keyOf(id, "image")]} editing={editing} onChange={set("image")} />
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
                  </section>
                  <section className="flex min-w-0 flex-col gap-4">
                    <h3 className="-mb-2 text-sm text-muted-foreground">Requirements</h3>
                    <ListField label="What to bring" value={settings[keyOf(id, "bring")]} editing={editing} hint="The first 3 show on the camp card." onChange={set("bring")} />
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
    <WelcomePreviewDialog open={preview !== null} camps={preview ? previewCamps(preview) : []} onClose={() => setPreview(null)} />
    </>
  )
}
