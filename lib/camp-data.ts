// The camp records. The backend will serve these; Camp setup, Registration, Waivers and anything else that
// shows a camp's name, dates, fees, limit or spots used reads them from here, so they cannot disagree.
import { campSpotsUsed } from "@/lib/dashboard-stats"
import { currentEditionIds } from "@/lib/editions"

export type CampId = "MYF" | "MYA"

export type CampDetails = {
  campStart: Date
  campEnd: Date
  camperLimit: number
  onlineFee: number
  walkInFee: number
  opens: Date
  closes: Date
}

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
  details: CampDetails
  lastSaved: { by: string; at: Date }
}

const ageRange = (min: number, max: number | null) => (max === null ? `${min}+` : `${min} - ${max}`)
const ageRangeLabel = (id: string, min: number, max: number | null) => `${id} (${ageRange(min, max)})`

// MYF comes before MYA everywhere.
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
    get spotsUsed() { return campSpotsUsed("MYF") },
    link: "register.mavuno.org/myf-2026-x7k2",
    paused: false,
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
    get spotsUsed() { return campSpotsUsed("MYA") },
    link: "register.mavuno.org/mya-2026-p4m9",
    paused: true,
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

// Camp dates of editions that are closed (their other settings are not kept in the sample).
const pastCampDates: Record<string, Record<CampId, { campStart: Date; campEnd: Date }>> = {
  "aug-2026": { MYF: { campStart: new Date(2026, 7, 3), campEnd: new Date(2026, 7, 8) }, MYA: { campStart: new Date(2026, 7, 10), campEnd: new Date(2026, 7, 15) } },
  "easter-2026": { MYF: { campStart: new Date(2026, 3, 6), campEnd: new Date(2026, 3, 11) }, MYA: { campStart: new Date(2026, 3, 13), campEnd: new Date(2026, 3, 18) } },
}

// An edition's dates come from its camps: the earliest start to the latest end. Null while none are set.
export function editionDates(editionId: string): { start: Date; end: Date } | null {
  const dates = campRecords.filter((record) => record.editionId === editionId).map((record) => ({ campStart: record.details.campStart, campEnd: record.details.campEnd }))
  const past = pastCampDates[editionId]
  const all = past ? [...dates, past.MYF, past.MYA] : dates
  if (all.length === 0) return null
  return { start: new Date(Math.min(...all.map((item) => item.campStart.getTime()))), end: new Date(Math.max(...all.map((item) => item.campEnd.getTime()))) }
}

// The camps of an edition run one after the other, never together. Returns the days two camps share, or null.
export function campOverlap(a: CampDetails, b: CampDetails): { start: Date; end: Date } | null {
  if (a.campStart > b.campEnd || b.campStart > a.campEnd) return null
  return { start: a.campStart > b.campStart ? a.campStart : b.campStart, end: a.campEnd < b.campEnd ? a.campEnd : b.campEnd }
}
