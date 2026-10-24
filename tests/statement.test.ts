import { describe, expect, it } from "vitest"
import { parseCsv, parseStatement, parseTable, tally } from "@/lib/statement"

describe("parseCsv", () => {
  it("keeps commas and doubled quotes inside quoted cells", () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3')).toEqual([["a", "b, c", 'say "hi"'], ["1", "2", "3"]])
  })
})

describe("parseStatement", () => {
  it("reads a plain sheet with Date, M-Pesa code, Name and Amount", () => {
    const { rows, error } = parseStatement("Date,Mpesa Code,Name,Amount\n20/10/2026,rtp9x2lm4a,Jane Wanjiru,\"2,000\"\n")
    expect(error).toBeNull()
    expect(rows).toEqual([{ date: "20/10/2026", code: "RTP9X2LM4A", name: "Jane Wanjiru", amount: 2000 }])
  })
  it("reads Safaricom column names and skips rows with nothing paid in", () => {
    const text = "Statement,\nReceipt No.,Completion Time,Details,Paid In,Withdrawn\nAAA1111111,2026-10-20 09:00,Pay Bill from 254711 John,500.00,\nBBB2222222,2026-10-20 09:05,Charge,,30.00\n"
    expect(parseStatement(text).rows.map((row) => [row.code, row.amount])).toEqual([["AAA1111111", 500]])
  })
  it("explains a file without the needed columns", () => {
    expect(parseStatement("x,y\n1,2").error).toMatch(/no M-Pesa code and amount/)
  })
})

describe("parseTable (Excel sheets)", () => {
  it("reads numbers and dates the way Excel hands them over", () => {
    const { rows } = parseTable([["Date", "Receipt No.", "Details", "Paid In"], [new Date(2026, 9, 20, 9, 5), "aaa1111111", "John", 1500]])
    expect(rows).toEqual([{ date: "20/10/2026 09:05", code: "AAA1111111", name: "John", amount: 1500 }])
  })
})

describe("tally", () => {
  const declared = [
    { id: "p1", code: "AAA1111111", expected: 2000, status: "pending" as const },
    { id: "p2", code: "BBB2222222", expected: 1000, status: "pending" as const },
    { id: "p3", code: "CCC3333333", expected: 500, status: "pending" as const },
  ]
  const statement = [
    { date: "", code: "AAA1111111", name: "A", amount: 2000 },
    { date: "", code: "BBB2222222", name: "B", amount: 800 },
    { date: "", code: "ZZZ9999999", name: "Z", amount: 300 },
    { date: "", code: "AAA1111111", name: "A", amount: 2000 },
  ]
  it("splits the codes into matched, short, missing, unknown and repeated", () => {
    const result = tally(statement, declared)
    expect(result.found.map((item) => [item.code, item.check.kind])).toEqual([["AAA1111111", "matched"], ["BBB2222222", "short"]])
    expect(result.missing.map((item) => item.code)).toEqual(["CCC3333333"])
    expect(result.unknown.map((row) => row.code)).toEqual(["ZZZ9999999"])
    expect(result.repeated).toEqual(["AAA1111111"])
  })
  it("compares one code that covers several campers with the total for all of them", () => {
    const group = [{ id: "g", code: "GGG1111111", expected: 3000, status: "pending" as const }]
    expect(tally([{ date: "", code: "GGG1111111", name: "Parent", amount: 3000 }], group).found[0].check.kind).toBe("matched")
    expect(tally([{ date: "", code: "GGG1111111", name: "Parent", amount: 2000 }], group).found[0].check).toEqual({ kind: "short", difference: 1000 })
  })
})
