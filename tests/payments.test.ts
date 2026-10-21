import { describe, expect, it } from "vitest"

import { checkAmount } from "@/lib/payment-check"
import { expectedTotal } from "@/lib/records"
import { makeCamper, makeFacilitator } from "./fixtures"

const fees = () => ({ onlineFee: 1000, walkInFee: 2000 })
const facilitatorFee = () => 500

describe("what a code should add up to", () => {
  it("is the online fee for online campers and the walk-in fee for desk campers", () => {
    expect(expectedTotal([makeCamper({ channel: "Online" })], [], fees, facilitatorFee)).toBe(1000)
    expect(expectedTotal([makeCamper({ channel: "Walk-in" })], [], fees, facilitatorFee)).toBe(2000)
  })
  it("adds a whole family on one code", () => {
    const family = [makeCamper({ id: "1" }), makeCamper({ id: "2" }), makeCamper({ id: "3" })]
    expect(expectedTotal(family, [], fees, facilitatorFee)).toBe(3000)
  })
  it("is nothing for a waiver", () => {
    const waived = makeCamper({ waiver: { issuedAt: new Date(), issuedById: "u1", source: "Walk-in" } })
    expect(expectedTotal([waived], [], fees, facilitatorFee)).toBe(0)
  })
  it("includes a facilitator's fee, and nothing for a waived facilitator", () => {
    expect(expectedTotal([], [makeFacilitator()], fees, facilitatorFee)).toBe(500)
    expect(expectedTotal([], [makeFacilitator({ feeWaived: true })], fees, facilitatorFee)).toBe(0)
  })
})

describe("the amount check", () => {
  it("asks for an amount until one is typed", () => {
    expect(checkAmount("", 1000)).toEqual({ kind: "enter" })
  })
  it("matches only an exact amount", () => {
    expect(checkAmount("1000", 1000)).toEqual({ kind: "matched" })
  })
  it("says how far short or over it is", () => {
    expect(checkAmount("900", 1000)).toEqual({ kind: "short", difference: 100 })
    expect(checkAmount("2500", 2000)).toEqual({ kind: "over", difference: 500 })
    expect(checkAmount("0", 1000)).toEqual({ kind: "short", difference: 1000 })
  })
})
