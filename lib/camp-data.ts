// The camp records. The backend will serve these; Camp setup, Registration, Waivers and anything else that
// shows a camp's name, dates, fees, limit or spots used reads them from here, so they cannot disagree.
import { campSpotsUsed } from "@/lib/dashboard-stats"
import { currentEditionIds } from "@/lib/editions"

export type CampId = "MYF" | "MYA"

// Each camp has one registration address that never changes, so a link shared in a WhatsApp group or printed on a poster keeps working in
// every edition. The public site sends the camper to whichever edition is open (or says registration is closed or not running).
export const publicSite = "campfearless-welcome.vercel.app"
export const campAddress = (id: CampId) => `${publicSite}/register/${id.toLowerCase()}`

export type CampDetails = {
  campStart: Date | null // null in a new edition, until a Super admin sets it: the camp can't open for registration before that
  campEnd: Date | null
  camperLimit: number
  onlineFee: number
  walkInFee: number
  opens: Date | null
  closes: Date | null
}

// A new edition starts with the four dates empty, and nobody can register until all four are set.
export const campDatesSet = (details: CampDetails) => details.campStart !== null && details.campEnd !== null && details.opens !== null && details.closes !== null

export type CampRecord = {
  id: CampId
  editionId: string // the edition these settings belong to: the open one
  label: string
  name: string // as campers see it on the welcome page
  ageMin: number // youngest camper allowed
  ageMax: number | null // oldest camper allowed; null for no upper limit
  ageLabel: string
  description: string
  spotsUsed: number // derived from the dashboard counts: campers plus every facilitator serving the camp
  link: string
  paused: boolean
  runs: boolean // false when the open edition does not include this camp (for example, only MYA runs)
  details: CampDetails
  lastSaved: { by: string; at: Date }
}

const ageRange = (min: number, max: number | null) => (max === null ? `${min}+` : `${min} - ${max}`)
const ageRangeLabel = (id: string, min: number, max: number | null) => `${id} (${ageRange(min, max)})`

// MYF comes before MYA everywhere. The sample registrations belong to the edition that is open now; a newly created edition has none.
const sampleEditionId = currentEditionIds[0]
export const campRecords: CampRecord[] = [
  {
    id: "MYF",
    editionId: currentEditionIds[0],
    label: ageRangeLabel("MYF", 14, 17),
    name: "MYF: Mavuno Young & Fearless",
    ageMin: 14,
    ageMax: 17,
    ageLabel: `Age ${ageRange(14, 17)}`,
    description: "Mavuno Young and Fearless, ages 14 to 17",
    get spotsUsed() { return this.editionId === sampleEditionId ? campSpotsUsed("MYF") : 0 },
    link: campAddress("MYF"),
    paused: false,
    runs: true,
    lastSaved: { by: "John Doe", at: new Date(2026, 9, 18, 14, 2) },
    details: {
      campStart: new Date(2026, 11, 1),
      campEnd: new Date(2026, 11, 6),
      camperLimit: 1000,
      onlineFee: 1000,
      walkInFee: 2000,
      opens: new Date(2026, 9, 1),
      closes: new Date(2026, 10, 30),
    },
  },
  {
    id: "MYA",
    editionId: currentEditionIds[0],
    label: ageRangeLabel("MYA", 18, null),
    name: "MYA: Mavuno Young Adults",
    ageMin: 18,
    ageMax: null,
    ageLabel: `Age ${ageRange(18, null)}`,
    description: "Mavuno Young Adults, age 18 and above",
    get spotsUsed() { return this.editionId === sampleEditionId ? campSpotsUsed("MYA") : 0 },
    link: campAddress("MYA"),
    paused: true,
    runs: true,
    lastSaved: { by: "John Doe", at: new Date(2026, 9, 16, 9, 45) },
    details: {
      campStart: new Date(2026, 11, 8),
      campEnd: new Date(2026, 11, 13),
      camperLimit: 1000,
      onlineFee: 1000,
      walkInFee: 2000,
      opens: new Date(2026, 9, 1),
      closes: new Date(2026, 10, 30),
    },
  },
]

export const campRecord = (id: CampId) => campRecords.find((record) => record.id === id)!

// The camps the open edition runs. A camp that doesn't run is left out of the welcome page, the registration link, the dashboard tabs, the
// Registration, Waivers and Payments screens and their camp filters. Its past records stay in Reports.
export const runningCamps = (): CampId[] => campRecords.filter((record) => record.runs).map((record) => record.id)
// Starting a new edition: both camps keep the last edition's fees and camper limit, but the four dates are cleared so the Super admin has to
// set them, the link stays closed until they do, and the edition starts with nobody registered.
export function startNewEditionCamps(editionId: string) {
  // The edition that was open keeps its camp dates, for its row in the Editions list and for Reports.
  const previous = campRecords[0].editionId
  const kept = {} as Record<CampId, { campStart: Date; campEnd: Date }>
  for (const record of campRecords) if (record.details.campStart && record.details.campEnd) kept[record.id] = { campStart: record.details.campStart, campEnd: record.details.campEnd }
  if (kept.MYF && kept.MYA) pastCampDates[previous] = kept
  for (const record of campRecords) {
    record.editionId = editionId
    record.paused = false
    record.runs = true
    record.details = { ...record.details, campStart: null, campEnd: null, opens: null, closes: null }
  }
}

export const setCampRuns = (id: CampId, runs: boolean) => { campRecord(id).runs = runs }

// A camp can be switched off only while nobody is registered for it, and only if the edition keeps at least one other camp.
export const canSwitchOffCamp = (spotsUsed: number, otherCampsRunning: number) => spotsUsed === 0 && otherCampsRunning > 0

// Camp dates of editions that are closed (their other settings are not kept in the sample).
const pastCampDates: Record<string, Record<CampId, { campStart: Date; campEnd: Date }>> = {
  "aug-2026": { MYF: { campStart: new Date(2026, 7, 3), campEnd: new Date(2026, 7, 8) }, MYA: { campStart: new Date(2026, 7, 10), campEnd: new Date(2026, 7, 15) } },
  "easter-2026": { MYF: { campStart: new Date(2026, 3, 6), campEnd: new Date(2026, 3, 11) }, MYA: { campStart: new Date(2026, 3, 13), campEnd: new Date(2026, 3, 18) } },
}

// An edition's dates come from its camps: the earliest start to the latest end. Null while none are set.
export function editionDates(editionId: string): { start: Date; end: Date } | null {
  const dates = campRecords.filter((record) => record.editionId === editionId && record.details.campStart && record.details.campEnd).map((record) => ({ campStart: record.details.campStart!, campEnd: record.details.campEnd! }))
  const past = pastCampDates[editionId]
  const all = past ? [...dates, past.MYF, past.MYA] : dates
  if (all.length === 0) return null
  return { start: new Date(Math.min(...all.map((item) => item.campStart.getTime()))), end: new Date(Math.max(...all.map((item) => item.campEnd.getTime()))) }
}

// The camps of an edition run one after the other, never together. Returns the days two camps share, or null.
export function campOverlap(a: CampDetails, b: CampDetails): { start: Date; end: Date } | null {
  if (!a.campStart || !a.campEnd || !b.campStart || !b.campEnd) return null
  if (a.campStart > b.campEnd || b.campStart > a.campEnd) return null
  return { start: a.campStart > b.campStart ? a.campStart : b.campStart, end: a.campEnd < b.campEnd ? a.campEnd : b.campEnd }
}
