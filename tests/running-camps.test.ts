import { describe, expect, it } from "vitest"

import { campRecords, canSwitchOffCamp, runningCamps, setCampRuns } from "@/lib/camp-data"

describe("which camps an edition runs", () => {
  it("runs both camps to start with", () => {
    expect(runningCamps()).toEqual(["MYF", "MYA"])
  })

  it("drops a camp that is switched off, and brings it back when switched on", () => {
    setCampRuns("MYF", false)
    expect(runningCamps()).toEqual(["MYA"])
    setCampRuns("MYF", true)
    expect(runningCamps()).toEqual(["MYF", "MYA"])
    expect(campRecords.every((record) => record.runs)).toBe(true)
  })

  it("lets a camp be switched off only when nobody is registered and another camp keeps running", () => {
    expect(canSwitchOffCamp(0, 1)).toBe(true)
    expect(canSwitchOffCamp(1, 1)).toBe(false)
    expect(canSwitchOffCamp(320, 1)).toBe(false)
    expect(canSwitchOffCamp(0, 0)).toBe(false)
  })
})

describe("starting a new edition", () => {
  it("clears the four dates and keeps the fees and limits, then lets the dates be set again", async () => {
    const { campDatesSet, startNewEditionCamps, campRecord, campOverlap } = await import("@/lib/camp-data")
    const fee = campRecord("MYF").details.onlineFee
    expect(campDatesSet(campRecord("MYF").details)).toBe(true)
    startNewEditionCamps("easter-2027")
    for (const id of ["MYF", "MYA"] as const) {
      const details = campRecord(id).details
      expect([details.campStart, details.campEnd, details.opens, details.closes]).toEqual([null, null, null, null])
      expect(campDatesSet(details)).toBe(false)
      expect(campRecord(id).spotsUsed).toBe(0)
    }
    expect(campRecord("MYF").details.onlineFee).toBe(fee)
    expect(campOverlap(campRecord("MYF").details, campRecord("MYA").details)).toBeNull()
  })
})
