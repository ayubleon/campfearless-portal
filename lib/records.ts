// The camper, payment, waiver and facilitator records. The backend will serve these. Dashboard, Reports, Waivers and
// Payments all read their rows from here, so a person has one name, age, campus and status wherever they appear.
// A waiver is not a separate person: it is a camper whose `waiver` is set. A payment is one M-Pesa code that can cover
// several campers (`paymentId`). Fees and totals are worked out from the camp records, never stored on a row.
import { campRecord, type CampId } from "@/lib/camp-data"
import { allCampuses, invitedCampus } from "@/lib/campuses"
import { currentEditionIds, facilitatorFeeOf } from "@/lib/editions"
import { initialRoles } from "@/lib/staff"

export type Gender = "Male" | "Female"
export type CamperStatus = "Registered" | "Checked in" | "Checked out"
export type PaymentStatus = "pending" | "verified" | "flagged"
export type Channel = "Online" | "Walk-in" // Online: self-service through the welcome page link. Walk-in: captured by staff in the portal.

export type Payment = {
  id: string
  editionId: string
  code: string // the M-Pesa transaction code, unique
  amountOnSms: number | null // typed in by hand from the M-Pesa message
  status: PaymentStatus
}

export type Camper = {
  id: string
  editionId: string
  camp: CampId
  firstName: string
  lastName: string
  age: number
  gender: Gender
  phone: string
  baptised: boolean
  fromMavuno: boolean
  campus: string
  church: string // only when the camper is not from Mavuno
  medical: string // "" when none
  specialNeeds: string // "" when none
  contact: { firstName: string; lastName: string; phone: string; relationship: string }
  channel: Channel
  registeredById: string | null // the staff user who captured it; null for online self-service
  paymentId: string | null // null for waivers, which pay nothing
  waiver: { issuedAt: Date; issuedById: string; source: "Walk-in" | "In advance" } | null
  status: CamperStatus
}

export type Facilitator = {
  id: string
  editionId: string
  firstName: string
  lastName: string
  age: number
  gender: Gender
  phone: string
  team: string // a role that can't sign in (Users and roles)
  camp: CampId | "Both" // chosen when registering: "Both" serves MYF and MYA
  campus: string
  contact: { firstName: string; lastName: string; phone: string; relationship: string }
  status: CamperStatus
  medical: string
  specialNeeds: string
  feeWaived: boolean
  paymentId: string | null // the M-Pesa payment of the facilitator fee; null when the fee is waived
}

export const fullName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`.trim()

const at = (month: number, day: number, hour: number, minute: number) => new Date(2026, month - 1, day, hour, minute)
const [openEdition] = currentEditionIds

const phoneAt = (seed: number) => `07${String(10000000 + seed * 7919).slice(0, 8)}`
const contactFor = (camp: CampId, lastName: string, seed: number) => ({
  firstName: ["Grace", "Peter", "Mercy", "Samuel", "Rose", "Lucy", "David", "Fatuma"][seed % 8],
  lastName,
  phone: phoneAt(seed + 500),
  relationship: camp === "MYF" ? "Parent" : ["Sibling", "Parent", "Friend"][seed % 3],
})

// Payments of the open edition. One code can cover a whole family.
const openPayments: Payment[] = ([
  { id: "p1", code: "UIN255RQWF", amountOnSms: null, status: "pending" },
  { id: "p2", code: "QJK4H7XW2P", amountOnSms: 900, status: "pending" },
  { id: "p3", code: "RTP9X2LM4A", amountOnSms: 1800, status: "flagged" },
  { id: "p4", code: "BNM6C1VX8D", amountOnSms: 3000, status: "verified" },
  { id: "p5", code: "KLM3N8QZ7B", amountOnSms: 1000, status: "pending" },
  { id: "p6", code: "WXY2P4TR9E", amountOnSms: 3000, status: "pending" },
  { id: "p7", code: "HGF5D7SA1Q", amountOnSms: 2500, status: "pending" },
  { id: "p8", code: "ZAQ1W3SX5C", amountOnSms: 1000, status: "verified" },
  { id: "p9", code: "EDC4R6FV8T", amountOnSms: 2000, status: "verified" },
  { id: "p10", code: "GBH7N9JM2K", amountOnSms: 1000, status: "verified" },
  { id: "p11", code: "LOP0I8UY6T", amountOnSms: 700, status: "flagged" },
  { id: "p12", code: "MKJ9U7YH5G", amountOnSms: 2000, status: "pending" },
  { id: "p13", code: "QAZ2WSX3ED", amountOnSms: 1000, status: "verified" },
  { id: "p14", code: "PLM5OKN6IJ", amountOnSms: 1000, status: "verified" },
  { id: "p15", code: "TYU8I3OP1L", amountOnSms: 1000, status: "verified" },
  { id: "p16", code: "NBV4C6XZ9M", amountOnSms: 1000, status: "verified" },
  { id: "p17", code: "ASD2F5GH7J", amountOnSms: 1000, status: "verified" },
  { id: "p18", code: "JKL9Q1WE3R", amountOnSms: 1000, status: "verified" },
  { id: "p19", code: "ZXC6V8BN2M", amountOnSms: 1000, status: "verified" },
  // Facilitator fees: verified, awaiting (nothing typed), matched, and short and flagged.
  { id: "p20", code: "FAC1JD2026", amountOnSms: 500, status: "verified" },
  { id: "p21", code: "FAC2AW2026", amountOnSms: null, status: "pending" },
  { id: "p22", code: "FAC4PM2026", amountOnSms: 500, status: "pending" },
  { id: "p23", code: "FAC5JO2026", amountOnSms: 300, status: "flagged" },
] satisfies Omit<Payment, "editionId">[]).map((payment) => ({ ...payment, editionId: openEdition }))

type Row = [id: string, first: string, last: string, age: number, gender: Gender, camp: CampId, campus: string, channel: Channel, paymentId: string | null, status: CamperStatus, registeredById: string | null, medical?: string, needs?: string, baptised?: boolean]

const openRows: Row[] = [
  // Awaiting payment checks: nothing typed yet, short, matched, over.
  ["c1", "Kevin", "Zawadi", 21, "Male", "MYA", "Hill City", "Online", "p1", "Registered", "u2"],
  ["c2", "Faith", "Mutiso", 17, "Female", "MYF", "Kisumu", "Online", "p2", "Registered", "u2"],
  ["c7", "Dan", "Otieno", 20, "Male", "MYA", "Mathare", "Online", "p5", "Registered", "u3"],
  ["c8", "Rachel", "Atieno", 15, "Female", "MYF", "Karen", "Online", "p6", "Registered", "u4"],
  ["c9", "Grace", "Atieno", 14, "Female", "MYF", "Karen", "Online", "p6", "Registered", "u4", undefined, "Deaf"],
  // Desk registrations: checked in right away, payment still to verify (pending, matched, over) or flagged.
  ["c3", "Ann", "Njeri", 16, "Female", "MYF", "Kitengela", "Walk-in", "p3", "Checked in", "u5"],
  ["c11", "Samuel", "Kiprono", 19, "Male", "MYA", "Madaraka", "Walk-in", "p7", "Checked in", "u2"],
  ["c17", "Naomi", "Njeri", 18, "Female", "MYA", "Mashariki", "Walk-in", "p12", "Checked in", "u2"],
  // Flagged payment, special needs.
  ["c16", "Daniel", "Kiptoo", 15, "Male", "MYF", "Mashariki", "Online", "p11", "Registered", "u4", undefined, "Down syndrome"],
  // Verified and checked in: a family on one code, a couple, singles with medical notes.
  ["c4", "Melvin", "Zawadi", 25, "Male", "MYA", "Downtown", "Online", "p4", "Checked in", "u3"],
  ["c5", "Kelvin", "Zawadi", 21, "Male", "MYA", "Downtown", "Online", "p4", "Checked in", "u3"],
  ["c6", "Tevin", "Zawadi", 18, "Male", "MYA", "Downtown", "Online", "p4", "Checked in", "u3"],
  ["c12", "Mary", "Wanjiku", 16, "Female", "MYF", "Kitengela", "Online", "p8", "Checked in", "u4", undefined, undefined, true],
  ["c13", "Peter", "Njoroge", 22, "Male", "MYA", "Hill City", "Online", "p9", "Checked in", "u3", "Type 1 diabetes"],
  ["c14", "Lucy", "Njoroge", 20, "Female", "MYA", "Hill City", "Online", "p9", "Checked in", "u3", "Epilepsy", "Anxiety"],
  ["c15", "Esther", "Achieng", 23, "Female", "MYA", "Hill City", "Online", "p10", "Checked in", "u5", undefined, undefined, true],
  ["c18", "Brian", "Mwangi", 16, "Male", "MYF", "Lavington", "Online", "p13", "Checked in", "u5"],
  ["c24", "Felix", "Mwangi", 17, "Male", "MYF", "Hill City", "Online", "p18", "Checked in", null, "Sinuses"],
  // Verified but not arrived yet.
  ["c21", "Amara", "Njeri", 24, "Female", "MYA", "Downtown", "Online", "p15", "Registered", null, undefined, "Autistic"],
  ["c22", "Brian", "Otieno", 16, "Male", "MYF", "Downtown", "Online", "p16", "Registered", null],
  ["c23", "Cynthia", "Wambui", 22, "Female", "MYA", "Downtown", "Online", "p17", "Registered", null, "Asthmatic"],
  // Left early with an exit permit; two of them not from Mavuno (campus Invited).
  ["c20", "Hannah", "Kamau", 16, "Female", "MYF", "Invited", "Online", "p14", "Checked out", "u4"],
  ["c25", "Ibrahim", "Hassan", 20, "Male", "MYA", "Invited", "Online", "p19", "Checked out", null, "Protein allergy"],
]

// Waivers: campers who pay nothing. "Walk-in" waivers are issued at the desk and checked in right away; "In advance" ones before camp.
type WaiverRow = [id: string, first: string, last: string, age: number, gender: Gender, phone: string, camp: CampId, campus: string, baptised: boolean, source: "Walk-in" | "In advance", issuedAt: Date, issuedById: string]
const waiverRows: WaiverRow[] = [
  ["c26", "Joy", "Atieno", 15, "Female", "0711203344", "MYF", "Mashariki", false, "In advance", at(10, 20, 15, 40), "u2"],
  ["c27", "Paul", "Njoroge", 22, "Male", "0722450918", "MYA", "Hill City", true, "Walk-in", at(10, 19, 11, 5), "u1"],
]

const named: Camper[] = [
  ...openRows.map(([id, first, last, age, gender, camp, campus, channel, paymentId, status, registeredById, medical, needs, baptised], index): Camper => ({
    id, editionId: openEdition, camp, firstName: first, lastName: last, age, gender, phone: phoneAt(index + 1), baptised: baptised ?? index % 4 === 1, fromMavuno: campus !== invitedCampus, campus, church: campus === invitedCampus ? (id === "c25" ? "PCEA" : "Kenya Youth Fellowship") : "",
    medical: medical ?? "", specialNeeds: needs ?? "", contact: contactFor(camp, last, index), channel, registeredById, paymentId, waiver: null, status,
  })),
  ...waiverRows.map(([id, first, last, age, gender, phone, camp, campus, baptised, source, issuedAt, issuedById], index): Camper => ({
    id, editionId: openEdition, camp, firstName: first, lastName: last, age, gender, phone, baptised, fromMavuno: true, campus, church: "", medical: "", specialNeeds: "",
    contact: contactFor(camp, last, index + 30), channel: "Walk-in", registeredById: issuedById, paymentId: null, waiver: { issuedAt, issuedById, source }, status: source === "Walk-in" ? "Checked in" : "Registered",
  })),
]

// Earlier editions: every camper paid and has left.
const firstNames = ["Amara", "Brian", "Cynthia", "Daniel", "Esther", "Felix", "Hannah", "Ibrahim", "Joy", "Kevin", "Lilian", "Moses", "Naomi", "Oscar", "Purity", "Quincy", "Ruth", "Samuel", "Tabitha", "Victor"]
const lastNames = ["Njeri", "Otieno", "Wambui", "Kiptoo", "Achieng", "Mwangi", "Kamau", "Hassan", "Atieno", "Mutua", "Chebet", "Kariuki"]
const medicalSamples = ["", "", "", "Asthmatic", "", "Protein allergy", "", "Epilepsy", "", "Sinuses", "", "", "Anxiety"]
const needsSamples = ["", "", "", "", "Deaf", "", "", "Autism spectrum", "", "", "", "Down syndrome", ""]

const pastEditionIds = ["aug-2026", "easter-2026"]
const pastPayments: Payment[] = []
const pastCampers: Camper[] = pastEditionIds.flatMap((editionId, editionIndex) =>
  Array.from({ length: 8 }, (_, index): Camper => {
    const seed = editionIndex * 8 + index
    const camp: CampId = seed % 3 === 0 ? "MYA" : "MYF"
    const last = lastNames[(seed * 5) % lastNames.length]
    const paymentId = `${editionId}-p${index + 1}`
    pastPayments.push({ id: paymentId, editionId, code: `QJ${String(seed * 104729 + 7).padStart(8, "0").slice(0, 8)}`, amountOnSms: 1000, status: "verified" })
    return {
      id: `${editionId}-c${index + 1}`, editionId, camp, firstName: firstNames[(seed * 3) % firstNames.length], lastName: last,
      age: camp === "MYF" ? 14 + (seed % 4) : 18 + (seed % 9), gender: seed % 2 === 0 ? "Female" : "Male", phone: phoneAt(seed + 60), baptised: seed % 4 === 1, fromMavuno: true,
      campus: allCampuses[(seed * 7) % allCampuses.length], church: "", medical: medicalSamples[seed % medicalSamples.length], specialNeeds: needsSamples[seed % needsSamples.length],
      contact: contactFor(camp, last, seed + 20), channel: "Online", registeredById: null, paymentId, waiver: null, status: "Checked out",
    }
  })
)

// Earlier editions' facilitator fees, all verified.
const pastFacilitatorPayments: Payment[] = [
  { id: "aug-2026-fp1", editionId: "aug-2026", code: "FAB1KM2026", amountOnSms: 500, status: "verified" },
  { id: "aug-2026-fp2", editionId: "aug-2026", code: "FAB2SM2026", amountOnSms: 500, status: "verified" },
  { id: "aug-2026-fp3", editionId: "aug-2026", code: "FAB3NH2026", amountOnSms: 500, status: "verified" },
  { id: "easter-2026-fp1", editionId: "easter-2026", code: "FAE1DK2026", amountOnSms: 500, status: "verified" },
  { id: "easter-2026-fp3", editionId: "easter-2026", code: "FAE3VC2026", amountOnSms: 500, status: "verified" },
]
export const payments: Payment[] = [...openPayments, ...pastPayments, ...pastFacilitatorPayments]
export const campers: Camper[] = [...named, ...pastCampers]

// What one camper owes: nothing for a waiver, otherwise the online or walk-in fee of their camp.
export type Fees = { onlineFee: number; walkInFee: number }
export const feeFor = (camper: Camper, feesOf: (camp: CampId) => Fees = (camp) => campRecord(camp).details) => {
  if (camper.waiver) return 0
  const fees = feesOf(camper.camp)
  return camper.channel === "Online" ? fees.onlineFee : fees.walkInFee
}
export const campersOfPayment = (paymentId: string) => campers.filter((camper) => camper.paymentId === paymentId)
export const facilitatorsOfPayment = (paymentId: string) => facilitators.filter((facilitator) => facilitator.paymentId === paymentId)
// What one code should add up to: each camper's fee plus each facilitator's fee (nothing for a waived one).
export const expectedTotal = (covered: Camper[], serving: Facilitator[], feesOf?: (camp: CampId) => Fees, facilitatorFee: (editionId: string) => number = facilitatorFeeOf) =>
  covered.reduce((total, camper) => total + feeFor(camper, feesOf), 0) + serving.reduce((total, facilitator) => total + (facilitator.feeWaived ? 0 : facilitatorFee(facilitator.editionId)), 0)
export const expectedForPayment = (paymentId: string) => expectedTotal(campersOfPayment(paymentId), facilitatorsOfPayment(paymentId))
export const paymentOf = (person: { paymentId: string | null }) => payments.find((payment) => payment.id === person.paymentId) ?? null

// Facilitator teams are the roles that can't sign in.
export const facilitatorTeams = initialRoles.filter((role) => !role.canSignIn).map((role) => role.name)

type FacilitatorRow = [id: string, first: string, last: string, age: number, gender: Gender, phone: string, team: string, camp: CampId | "Both", campus: string, status: CamperStatus, medical: string, specialNeeds: string, feeWaived: boolean, paymentId: string | null]
const withContact = (rows: FacilitatorRow[], editionId: string): Facilitator[] =>
  rows.map(([id, first, last, age, gender, phone, team, camp, campus, status, medical, specialNeeds, feeWaived, paymentId], index) => ({
    id, editionId, firstName: first, lastName: last, age, gender, phone, team, camp, campus,
    contact: { firstName: ["Joseph", "Agnes", "Daniel", "Beatrice", "Stephen", "Lydia"][index % 6], lastName: last, phone: phoneAt(index + 300), relationship: "Parent" },
    status, medical, specialNeeds, feeWaived, paymentId,
  }))

// Open edition: five facilitators, covering every team size and state. John Doe, the signed-in user, serves both camps.
const openFacilitators = withContact([
  ["f1", "John", "Doe", 38, "Male", "0712345678", "Media team", "Both", "Hill City", "Checked in", "", "", false, "p20"],
  ["f2", "Agnes", "Wairimu", 29, "Female", phoneAt(202), "Kitchen crew", "MYF", "Karen", "Checked in", "", "", false, "p21"],
  ["f3", "Lydia", "Chebet", 24, "Female", phoneAt(203), "Worship team", "MYF", "Kikuyu", "Checked in", "", "", true, null],
  ["f4", "Peter", "Mwai", 41, "Male", phoneAt(204), "Security", "MYA", "Lavington", "Registered", "", "", false, "p22"],
  ["f5", "Joseph", "Odhiambo", 33, "Male", phoneAt(205), "Kitchen crew", "Both", "Kisumu", "Checked out", "Asthmatic", "", false, "p23"],
], openEdition)
// Earlier editions: three each, all left.
const pastFacilitators = [
  ...withContact([
    ["f6", "Beatrice", "Kamau", 27, "Female", phoneAt(206), "Kitchen crew", "MYF", "Bondo", "Checked out", "", "", false, "aug-2026-fp1"],
    ["f7", "Stephen", "Mutua", 35, "Male", phoneAt(207), "Security", "MYA", "Chuka", "Checked out", "", "", false, "aug-2026-fp2"],
    ["f8", "Naomi", "Hassan", 26, "Female", phoneAt(208), "Worship team", "Both", "Juja", "Checked out", "", "Deaf", false, "aug-2026-fp3"],
  ], "aug-2026"),
  ...withContact([
    ["f9", "Daniel", "Kiptoo", 30, "Male", phoneAt(209), "Media team", "MYF", "Donholm", "Checked out", "", "", false, "easter-2026-fp1"],
    ["f10", "Ruth", "Atieno", 28, "Female", phoneAt(210), "Kitchen crew", "MYA", "Limuru", "Checked out", "Sinuses", "", true, null],
    ["f11", "Victor", "Chebet", 44, "Male", phoneAt(211), "Security", "Both", "Diani", "Checked out", "", "", false, "easter-2026-fp3"],
  ], "easter-2026"),
]
export const facilitators: Facilitator[] = [...openFacilitators, ...pastFacilitators]

// Duplicate check: the same person must not be registered twice in one edition, as a camper or as a facilitator.
// "same" blocks the registration; "similar" only warns staff, because family members can share a phone and two people can share a name.
export type DuplicateCandidate = { firstName: string; lastName: string; age: number; phone: string; campus: string }
export type DuplicateMatch = { kind: "same" | "similar"; who: string; role: string; reason: string }

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ")
const digitsOnly = (value: string) => value.replace(/\s/g, "")

export type DuplicateSource = { campers: Camper[]; facilitators: Facilitator[] }
export function findDuplicates(candidate: DuplicateCandidate, editionId = openEdition, source: DuplicateSource = { campers, facilitators }): DuplicateMatch[] {
  const people = [
    ...source.campers.filter((camper) => camper.editionId === editionId).map((camper) => ({ name: fullName(camper), age: camper.age, phone: camper.phone, campus: camper.campus, role: `${camper.camp} camper` })),
    ...source.facilitators.filter((facilitator) => facilitator.editionId === editionId).map((facilitator) => ({ name: fullName(facilitator), age: facilitator.age, phone: facilitator.phone, campus: facilitator.campus, role: "facilitator" })),
  ]
  const name = norm(fullName(candidate))
  return people.flatMap((person): DuplicateMatch[] => {
    const sameName = norm(person.name) === name
    const samePhone = candidate.phone !== "" && digitsOnly(person.phone) === digitsOnly(candidate.phone)
    const sameCampus = candidate.campus !== "" && norm(person.campus) === norm(candidate.campus)
    if (sameName && (samePhone || (person.age === candidate.age && sameCampus))) return [{ kind: "same", who: person.name, role: person.role, reason: `${person.name} is already registered as ${/^[aeiou]/i.test(person.role) ? "an" : "a"} ${person.role}.` }]
    if (samePhone) return [{ kind: "similar", who: person.name, role: person.role, reason: `The phone number is the same as ${person.name}'s (${person.role}).` }]
    if (sameName && sameCampus) return [{ kind: "similar", who: person.name, role: person.role, reason: `The name and campus match ${person.name} (${person.role}), but the age or phone differs.` }]
    return []
  })
}

// M-Pesa codes never repeat, so a code already on a payment (in any edition) can't be used again.
export const mpesaCodeUsed = (code: string) => payments.some((payment) => payment.code === code)

// A walk-in registration at the desk: the campers join the open edition already checked in, on one new M-Pesa code that
// Payments then verifies. In the prototype this adds to the sample arrays above, so Dashboard, Payments and Reports show them.
export type WalkInInput = {
  camp: CampId
  code: string
  registeredById: string
  campers: { firstName: string; lastName: string; age: number; gender: Gender; phone: string; baptised: boolean; fromMavuno: boolean; campus: string; church: string; medical: string; specialNeeds: string }[]
  contact: Camper["contact"]
}

export function registerWalkIns(input: WalkInInput) {
  const stamp = Date.now()
  const paymentId = `w-p-${stamp}`
  payments.push({ id: paymentId, editionId: openEdition, code: input.code, amountOnSms: null, status: "pending" })
  input.campers.forEach((camper, index) => {
    campers.push({
      id: `w-c-${stamp}-${index}`,
      editionId: openEdition,
      camp: input.camp,
      firstName: camper.firstName.trim(),
      lastName: camper.lastName.trim(),
      age: camper.age,
      gender: camper.gender,
      phone: camper.phone.trim(),
      baptised: camper.baptised,
      fromMavuno: camper.fromMavuno,
      // Not from Mavuno: whatever church they typed, their campus is Invited.
      campus: camper.fromMavuno ? camper.campus : invitedCampus,
      church: camper.fromMavuno ? "" : camper.church.trim(),
      medical: camper.medical.trim(),
      specialNeeds: camper.specialNeeds.trim(),
      contact: input.contact,
      channel: "Walk-in",
      registeredById: input.registeredById,
      paymentId,
      waiver: null,
      status: "Checked in",
    })
  })
}
