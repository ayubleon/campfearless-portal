import { describe, expect, it } from "vitest"

import { pageCount } from "@/lib/paging"
import { byNumber, byRank, byText } from "@/lib/sort"

describe("sorting", () => {
  it("sorts names by first name, then the rest", () => {
    expect(["Brian Otieno", "Amara Njeri", "Amara Achieng"].sort(byText)).toEqual(["Amara Achieng", "Amara Njeri", "Brian Otieno"])
  })
  it("sorts numbers as numbers, not text", () => {
    expect(["Camp 10", "Camp 9"].sort(byText)).toEqual(["Camp 9", "Camp 10"])
    expect([10, 9, 100].sort(byNumber)).toEqual([9, 10, 100])
  })
  it("sorts statuses by their journey and puts unknown ones last", () => {
    const rank = byRank(["Registered", "Checked in", "Checked out"])
    expect(["Checked out", "Mystery", "Registered", "Checked in"].sort(rank)).toEqual(["Registered", "Checked in", "Checked out", "Mystery"])
  })
})

describe("paging", () => {
  it("needs one page for an empty or short list", () => {
    expect(pageCount(0, 10)).toBe(1)
    expect(pageCount(7, 10)).toBe(1)
  })
  it("rounds up", () => {
    expect(pageCount(10, 10)).toBe(1)
    expect(pageCount(11, 10)).toBe(2)
    expect(pageCount(30, 10)).toBe(3)
    expect(pageCount(31, 10)).toBe(4)
  })
})
