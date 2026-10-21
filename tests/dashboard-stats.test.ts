import { describe, expect, it } from "vitest"

import { statsFor, statsForEdition } from "@/lib/dashboard-stats"
import { makeCamper, makeFacilitator } from "./fixtures"

// MYF: 4 campers (one walk-in checked in, two online checked in, one left early). MYA: 2 campers (one waiver in advance, not arrived).
const campers = [
  makeCamper({ id: "1", camp: "MYF", status: "Checked in", channel: "Walk-in", gender: "Male" }),
  makeCamper({ id: "2", camp: "MYF", status: "Checked in", gender: "Female", baptised: true }),
  makeCamper({ id: "3", camp: "MYF", status: "Checked in", gender: "Female" }),
  makeCamper({ id: "4", camp: "MYF", status: "Checked out", gender: "Male" }),
  makeCamper({ id: "5", camp: "MYA", status: "Registered", channel: "Walk-in", gender: "Female", waiver: { issuedAt: new Date(), issuedById: "u1", source: "In advance" }, baptised: true }),
  makeCamper({ id: "6", camp: "MYA", status: "Registered", gender: "Male" }),
]
const facilitators = [
  makeFacilitator({ id: "f1", camp: "MYF" }),
  makeFacilitator({ id: "f2", camp: "MYA" }),
  makeFacilitator({ id: "f3", camp: "Both" }),
]
const source = { campers, facilitators }

describe("dashboard counts (open edition)", () => {
  const all = statsFor("all", statsForEdition("e1", source, ["e1"]))

  it("counts registered, desk registrations and baptism requests", () => {
    expect(all.registered).toBe(6)
    expect(all.walkIn).toBe(1) // the in-advance waiver is not a desk registration
    expect(all.baptismRequests).toBe(2)
  })
  it("works out pending arrivals and present on site from the raw counts", () => {
    expect(all.checkedIn).toBe(4)
    expect(all.pendingArrivals).toBe(2) // registered 6 - checked in 4
    expect(all.departedEarly).toBe(1)
    expect(all.present).toBe(3) // checked in 4 - departed early 1
  })
  it("always splits the people on site into male plus female", () => {
    expect(all.male + all.female).toBe(all.present)
  })
  it("counts a facilitator who serves Both in each camp tab and once in total", () => {
    const stats = statsForEdition("e1", source, ["e1"])
    expect(statsFor("MYF", stats).facilitators).toBe(2) // MYF only + Both
    expect(statsFor("MYA", stats).facilitators).toBe(2) // MYA only + Both
    expect(statsFor("all", stats).facilitators).toBe(3)
  })
  it("scopes everything to one camp when a camp tab is chosen", () => {
    const myf = statsFor("MYF", statsForEdition("e1", source, ["e1"]))
    expect(myf.registered).toBe(4)
    expect(myf.present).toBe(3)
  })
})

describe("dashboard counts (closed edition)", () => {
  it("counts everyone who attended as present and nobody as departed early", () => {
    const closed = statsFor("all", statsForEdition("e1", source, [])) // no open editions
    expect(closed.departedEarly).toBe(0)
    expect(closed.present).toBe(closed.checkedIn)
    expect(closed.male + closed.female).toBe(closed.present)
  })
})

describe("another edition", () => {
  it("is empty, not mixed in", () => {
    expect(statsFor("all", statsForEdition("other", source, ["e1"])).registered).toBe(0)
  })
})
