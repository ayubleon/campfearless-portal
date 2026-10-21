import { describe, expect, it } from "vitest"

import { csvCell, toCsv } from "@/lib/csv"

describe("CSV export", () => {
  it("wraps every cell in quotes and doubles quotes inside", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
  })
  it("turns line breaks into spaces so a row stays on one line", () => {
    expect(csvCell("Amara Njeri\nAge: 24")).toBe('"Amara Njeri Age: 24"')
  })
  it("neutralizes values a spreadsheet would run as a formula", () => {
    for (const value of ["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx"]) {
      expect(csvCell(value).startsWith(`"'`)).toBe(true)
    }
  })
  it("leaves normal values and phone numbers alone", () => {
    expect(csvCell("0712345678")).toBe('"0712345678"')
    expect(csvCell("Kiambu Road")).toBe('"Kiambu Road"')
  })
  it("builds rows with a header and Windows line endings", () => {
    expect(toCsv(["Name", "Phone"], [["A", "1"], ["B", "2"]])).toBe('"Name","Phone"\r\n"A","1"\r\n"B","2"')
  })
})
