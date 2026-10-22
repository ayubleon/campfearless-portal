// A camp edition is one run of the camps, named by the administrator ("Easter 2026", "December 2026"), so it can follow
// any rhythm: quarterly, three a year, one a year. A backend placeholder. Registrations, payments, waivers and
// facilitators belong to an edition; campuses, networks, users and roles do not. Newest first.
// An edition has no dates of its own: each camp in it (MYF, MYA) has its own, set in Camp setup (see `editionDates` in camp-data).
export type Edition = { id: string; name: string; open: boolean; facilitatorFee: number } // facilitators pay one fee per edition (KES)

export const editions: Edition[] = [
  { id: "dec-2026", name: "December 2026", open: true, facilitatorFee: 500 },
  { id: "aug-2026", name: "August 2026", open: false, facilitatorFee: 500 },
  { id: "easter-2026", name: "Easter 2026", open: false, facilitatorFee: 500 },
]

// The edition that is open for registration. Reports open on it.
export const currentEditionIds = editions.filter((edition) => edition.open).map((edition) => edition.id)

// Creating an edition opens it and closes the others (one is open at a time). A placeholder for the server: the lists are updated in place.
export function startEdition(edition: Edition) {
  for (const item of editions) item.open = false
  editions.unshift({ ...edition, open: true })
  currentEditionIds.splice(0, currentEditionIds.length, edition.id)
}

// Closing an edition, or reopening one (which closes the one that is open). Also updates the list of open editions the other screens read.
export function setEditionOpen(id: string, open: boolean) {
  for (const item of editions) item.open = open ? item.id === id : item.open && item.id !== id
  currentEditionIds.splice(0, currentEditionIds.length, ...editions.filter((item) => item.open).map((item) => item.id))
}

export function editionLabel(id: string) {
  return editions.find((edition) => edition.id === id)?.name ?? id
}

// "December 2026", "Easter 2026 and August 2026", "Easter 2026, August 2026 and December 2026", or "All editions".
export function editionTitle(ids: string[], list: Edition[] = editions) {
  const chosen = list.filter((edition) => ids.includes(edition.id)).sort((a, b) => list.findIndex((edition) => edition.id === b.id) - list.findIndex((edition) => edition.id === a.id))
  if (chosen.length === 0) return "No editions"
  if (chosen.length === list.length && list.length > 1) return "All editions"
  const names = chosen.map((edition) => edition.name)
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

export const editionRank = (id: string) => editions.findIndex((edition) => edition.id === id)

export const facilitatorFeeOf = (editionId: string) => editions.find((edition) => edition.id === editionId)?.facilitatorFee ?? 0
