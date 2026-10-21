export type Network = { id: string; name: string }

export const initialNetworks: Network[] = [
  { id: "multipliers", name: "Multipliers" },
  { id: "limitless", name: "Limitless" },
  { id: "catalyst", name: "Catalyst" },
  { id: "igniters", name: "Igniters" },
  { id: "lifegivers", name: "Lifegivers" },
]

export const campusesByNetwork: Record<string, string[]> = {
  multipliers: ["Hill City", "Bondo", "Diani", "Kisumu", "Kitengela", "Mombasa", "Kitale", "Mwangaza", "Multipliers"],
  limitless: ["Chuka", "Donholm", "Far East", "Kizazi", "Limitless", "Mashariki"],
  catalyst: ["Catalyst", "Kikuyu", "Lavington", "Madaraka", "Kiambio", "Mathare", "Downtown"],
  igniters: ["Connect", "Karen", "Igniters"],
  lifegivers: ["Lifegivers", "Bustani", "Nawiri", "Juja", "Kiambu Road", "Limuru", "Lifeway"],
}

// One A to Z list of every campus: campers often don't know which network their campus belongs to.
export const allCampuses = Object.values(campusesByNetwork).flat().sort((a, b) => a.localeCompare(b))

// A deleted campus is archived, not erased: it leaves the lists people choose from, but every record that already has it keeps it,
// and reports show it as "Hill City (deleted)" (like a removed user). A backend placeholder: the real table has a `deleted_at` column.
// Sample: Mathare was deleted after campers had registered there, so it shows as "Mathare (deleted)" in reports.
const deletedCampuses = new Set<string>(["Mathare"])
export const markCampusDeleted = (name: string) => { deletedCampuses.add(name) }
export const isCampusDeleted = (name: string) => deletedCampuses.has(name)
export const campusLabel = (name: string) => (deletedCampuses.has(name) ? `${name} (deleted)` : name)
// The campuses someone can choose for a new registration.
export const activeCampuses = () => allCampuses.filter((name) => !deletedCampuses.has(name))

// Campers who are not from Mavuno type a church or organisation. Whatever they type, their campus is "Invited" (the church is kept
// separately), so one filter brings up every outside camper. It is not a real campus: nobody chooses it, and it can't be edited or deleted.
export const invitedCampus = "Invited"
// The campuses a report or table can filter by: every real campus, then Invited.
export const filterCampuses = () => [...allCampuses, invitedCampus]
