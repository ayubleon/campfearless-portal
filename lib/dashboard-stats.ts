// The counts the dashboard shows, worked out from the camper and facilitator records (lib/records.ts) so the charts, the Quick
// summary, every camp's "spots used" and the roster can never disagree. The backend will serve these as queries over the same tables.
// Only raw counts are kept: pending arrivals (registered - checked in) and present on site (checked in - departed early) are derived.
// Everything here is computed when it is asked for, never when the file loads (records and camp data import each other).
import { currentEditionIds } from "@/lib/editions"
import { campers, facilitators, type Camper, type Facilitator } from "@/lib/records"

export type CampKey = "MYF" | "MYA"
export type CampScope = "all" | CampKey // the dashboard tabs: All camps, MYF, MYA

type CampCounts = {
  registered: number // every camper registered for this camp, online and walk-in
  walkIn: number // registered at the desk, checked in as present straight away
  onlineCheckedIn: number // registered online (or in advance) and checked in on arrival
  departedEarly: number // checked in, then left with an exit permit
  male: number // campers on site, by gender: male + female = present
  female: number
  baptismRequests: number // campers who said at registration that they want to be baptised
  facilitatorsOnly: number // facilitators who registered for this camp alone
}

export type DashboardStats = {
  MYF: CampCounts
  MYA: CampCounts
  facilitatorsBoth: number // facilitators who chose "Both" when registering: they serve MYF and MYA
}

const arrived = (camper: Camper) => camper.status !== "Registered"
// Registered at the desk and checked in straight away (a waiver issued in advance is not a desk registration).
const atTheDesk = (camper: Camper) => camper.channel === "Walk-in" && arrived(camper) && (!camper.waiver || camper.waiver.source === "Walk-in")

export type StatsSource = { campers: Camper[]; facilitators: Facilitator[] }

function countsFor(source: StatsSource, editionId: string, camp: CampKey, open: boolean): CampCounts {
  const list = source.campers.filter((camper) => camper.editionId === editionId && camper.camp === camp)
  const desk = list.filter(atTheDesk)
  // In an open edition a "Checked out" camper left early. In a closed edition everyone has left, so all who attended count as present.
  const present = list.filter((camper) => (open ? camper.status === "Checked in" : arrived(camper)))
  return {
    registered: list.length,
    walkIn: desk.length,
    onlineCheckedIn: list.filter((camper) => arrived(camper) && !atTheDesk(camper)).length,
    departedEarly: open ? list.filter((camper) => camper.status === "Checked out").length : 0,
    male: present.filter((camper) => camper.gender === "Male").length,
    female: present.filter((camper) => camper.gender === "Female").length,
    baptismRequests: list.filter((camper) => camper.baptised).length,
    facilitatorsOnly: source.facilitators.filter((facilitator) => facilitator.editionId === editionId && facilitator.camp === camp).length,
  }
}

// The counts of one edition. An unknown edition counts as closed and empty.
export function statsForEdition(editionId: string, source: StatsSource = { campers, facilitators }, openEditionIds: string[] = currentEditionIds): DashboardStats {
  const open = openEditionIds.includes(editionId)
  return {
    MYF: countsFor(source, editionId, "MYF", open),
    MYA: countsFor(source, editionId, "MYA", open),
    facilitatorsBoth: source.facilitators.filter((facilitator) => facilitator.editionId === editionId && facilitator.camp === "Both").length,
  }
}

const keysFor = (scope: CampScope): CampKey[] => (scope === "all" ? ["MYF", "MYA"] : [scope])

// The figures for one tab. A facilitator who chose Both counts in the MYF tab and in the MYA tab, and once in All camps.
export function statsFor(scope: CampScope, stats: DashboardStats = statsForEdition(currentEditionIds[0])) {
  const sum = (field: Exclude<keyof CampCounts, "facilitatorsOnly">) => keysFor(scope).reduce((total, key) => total + stats[key][field], 0)
  const registered = sum("registered")
  const checkedIn = sum("onlineCheckedIn") + sum("walkIn")
  return {
    registered,
    walkIn: sum("walkIn"),
    onlineCheckedIn: sum("onlineCheckedIn"),
    departedEarly: sum("departedEarly"),
    male: sum("male"),
    female: sum("female"),
    baptismRequests: sum("baptismRequests"),
    facilitators: keysFor(scope).reduce((total, key) => total + stats[key].facilitatorsOnly, 0) + stats.facilitatorsBoth,
    checkedIn,
    pendingArrivals: registered - checkedIn, // registered, not arrived yet
    present: checkedIn - sum("departedEarly"), // on site right now
  }
}

// Spots a camp has used: its campers plus every facilitator serving it (including those who chose Both).
export const campSpotsUsed = (key: CampKey, stats: DashboardStats = statsForEdition(currentEditionIds[0])) => stats[key].registered + stats[key].facilitatorsOnly + stats.facilitatorsBoth
