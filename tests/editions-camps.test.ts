import { describe, expect, it } from "vitest"

import { campOverlap, type CampDetails } from "@/lib/camp-data"
import { editionTitle, type Edition } from "@/lib/editions"

const list: Edition[] = [
  { id: "c", name: "December 2026", open: true, facilitatorFee: 500 },
  { id: "b", name: "August 2026", open: false, facilitatorFee: 500 },
  { id: "a", name: "Easter 2026", open: false, facilitatorFee: 500 },
]

describe("edition titles", () => {
  it("names one edition", () => {
    expect(editionTitle(["c"], list)).toBe("December 2026")
  })
  it("joins several, oldest first", () => {
    expect(editionTitle(["b", "a"], list)).toBe("Easter 2026 and August 2026")
    expect(editionTitle(["c", "b", "a"].slice(0, 2), list)).toBe("August 2026 and December 2026")
  })
  it("says All editions when every one is chosen, and No editions when none is", () => {
    expect(editionTitle(["a", "b", "c"], list)).toBe("All editions")
    expect(editionTitle([], list)).toBe("No editions")
  })
})

const camp = (start: [number, number, number], end: [number, number, number]) => ({ campStart: new Date(...start), campEnd: new Date(...end) }) as CampDetails

describe("camps must not overlap", () => {
  it("finds no overlap when one camp ends before the other starts", () => {
    expect(campOverlap(camp([2026, 11, 1], [2026, 11, 6]), camp([2026, 11, 8], [2026, 11, 13]))).toBeNull()
  })
  it("finds the shared days when they overlap", () => {
    const overlap = campOverlap(camp([2026, 11, 1], [2026, 11, 6]), camp([2026, 11, 3], [2026, 11, 13]))
    expect(overlap?.start).toEqual(new Date(2026, 11, 3))
    expect(overlap?.end).toEqual(new Date(2026, 11, 6))
  })
  it("counts a shared single day as an overlap", () => {
    expect(campOverlap(camp([2026, 11, 1], [2026, 11, 6]), camp([2026, 11, 6], [2026, 11, 9]))).not.toBeNull()
  })
})
