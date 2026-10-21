import { describe, expect, it } from "vitest"

import { allCampuses, invitedCampus } from "@/lib/campuses"
import { currentEditionIds, editions } from "@/lib/editions"
import { campers, expectedForPayment, facilitators, payments } from "@/lib/records"
import { statsForEdition } from "@/lib/dashboard-stats"
import { initialRoles, initialUsers } from "@/lib/staff"

// These check the app's SAMPLE data, so the demo can't quietly fall out of step with itself. When the real backend replaces
// the sample data, delete this file: every other test brings its own data and keeps working.
describe("sample data hangs together", () => {
  const paymentIds = new Set(payments.map((payment) => payment.id))
  const editionIds = new Set(editions.map((edition) => edition.id))

  it("has exactly one open edition", () => {
    expect(currentEditionIds).toHaveLength(1)
  })
  it("gives every camper and facilitator a real edition", () => {
    for (const person of [...campers, ...facilitators]) expect(editionIds.has(person.editionId), person.id).toBe(true)
  })
  it("points every payment-paying person at a payment that exists", () => {
    for (const camper of campers) if (!camper.waiver) expect(paymentIds.has(camper.paymentId ?? ""), camper.id).toBe(true)
    for (const facilitator of facilitators) if (!facilitator.feeWaived) expect(paymentIds.has(facilitator.paymentId ?? ""), facilitator.id).toBe(true)
  })
  it("gives waivers and waived facilitators no payment", () => {
    for (const camper of campers) if (camper.waiver) expect(camper.paymentId).toBeNull()
    for (const facilitator of facilitators) if (facilitator.feeWaived) expect(facilitator.paymentId).toBeNull()
  })
  it("has unique M-Pesa codes and unique ids", () => {
    expect(new Set(payments.map((payment) => payment.code)).size).toBe(payments.length)
    expect(new Set(campers.map((camper) => camper.id)).size).toBe(campers.length)
    expect(new Set(facilitators.map((facilitator) => facilitator.id)).size).toBe(facilitators.length)
  })
  it("uses only real campuses, or Invited for people not from Mavuno", () => {
    for (const person of [...campers, ...facilitators]) expect([...allCampuses, invitedCampus], person.id).toContain(person.campus)
    for (const camper of campers) if (!camper.fromMavuno) {
      expect(camper.campus, camper.id).toBe(invitedCampus)
      expect(camper.church, camper.id).not.toBe("")
    }
  })
  it("keeps ages inside each camp's limits and phones valid", () => {
    for (const camper of campers) {
      if (camper.camp === "MYF") expect(camper.age, camper.id).toBeGreaterThanOrEqual(14)
      if (camper.camp === "MYF") expect(camper.age, camper.id).toBeLessThanOrEqual(17)
      if (camper.camp === "MYA") expect(camper.age, camper.id).toBeGreaterThanOrEqual(18)
      expect(camper.phone, camper.id).toMatch(/^0[17]\d{8}$/)
    }
  })
  it("has a code total that is never negative", () => {
    for (const payment of payments) expect(expectedForPayment(payment.id), payment.id).toBeGreaterThanOrEqual(0)
  })
  it("adds up on the dashboard: male plus female equals the people present", () => {
    for (const edition of editions) {
      const stats = statsForEdition(edition.id)
      for (const camp of ["MYF", "MYA"] as const) {
        const counts = stats[camp]
        const checkedIn = counts.walkIn + counts.onlineCheckedIn
        expect(counts.male + counts.female, `${edition.id} ${camp}`).toBe(checkedIn - counts.departedEarly)
      }
    }
  })
  it("has John Doe as both the signed-in Super admin and a facilitator", () => {
    expect(initialUsers.find((user) => user.id === "u1")?.name).toBe("John Doe")
    expect(initialRoles.find((role) => role.id === "super-admin")?.permissions.length).toBeGreaterThan(0)
    expect(facilitators.some((facilitator) => `${facilitator.firstName} ${facilitator.lastName}` === "John Doe" && currentEditionIds.includes(facilitator.editionId))).toBe(true)
  })
})
