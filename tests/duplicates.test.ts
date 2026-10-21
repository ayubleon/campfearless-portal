import { describe, expect, it } from "vitest"

import { findDuplicates } from "@/lib/records"
import { makeCamper, makeFacilitator } from "./fixtures"

const source = {
  campers: [
    makeCamper({ id: "a", firstName: "Esther", lastName: "Achieng", age: 23, phone: "0710000001", campus: "Alpha", camp: "MYA" }),
    makeCamper({ id: "b", firstName: "Esther", lastName: "Achieng", age: 23, phone: "0710000002", campus: "Beta", camp: "MYA", editionId: "old" }),
  ],
  facilitators: [makeFacilitator({ id: "f", firstName: "John", lastName: "Doe", phone: "0712345678", campus: "Gamma" })],
}
const who = (kind: string, found: ReturnType<typeof findDuplicates>) => found.filter((match) => match.kind === kind).map((match) => match.who)

describe("duplicate check", () => {
  it("blocks the same name with the same phone, ignoring case and spacing", () => {
    const found = findDuplicates({ firstName: " esther ", lastName: "ACHIENG", age: 30, phone: "0710 000 001", campus: "Zeta" }, "e1", source)
    expect(who("same", found)).toEqual(["Esther Achieng"])
  })
  it("blocks the same name, age and campus when the phone differs", () => {
    const found = findDuplicates({ firstName: "Esther", lastName: "Achieng", age: 23, phone: "0799999999", campus: "Alpha" }, "e1", source)
    expect(who("same", found)).toEqual(["Esther Achieng"])
  })
  it("only warns when the name and campus match but the age and phone differ", () => {
    const found = findDuplicates({ firstName: "Esther", lastName: "Achieng", age: 40, phone: "0799999999", campus: "Alpha" }, "e1", source)
    expect(who("same", found)).toEqual([])
    expect(who("similar", found)).toEqual(["Esther Achieng"])
  })
  it("only warns when the phone is shared by a different name (families share phones)", () => {
    const found = findDuplicates({ firstName: "Someone", lastName: "Else", age: 15, phone: "0710000001", campus: "Zeta" }, "e1", source)
    expect(who("same", found)).toEqual([])
    expect(who("similar", found)).toEqual(["Esther Achieng"])
  })
  it("finds a facilitator too: nobody is registered twice, as a camper or a helper", () => {
    const found = findDuplicates({ firstName: "John", lastName: "Doe", age: 30, phone: "0712345678", campus: "Zeta" }, "e1", source)
    expect(who("same", found)).toEqual(["John Doe"])
  })
  it("ignores other editions", () => {
    const found = findDuplicates({ firstName: "Esther", lastName: "Achieng", age: 23, phone: "0710000002", campus: "Beta" }, "e1", source)
    expect(found).toEqual([])
  })
  it("finds nothing for a new person", () => {
    expect(findDuplicates({ firstName: "New", lastName: "Person", age: 20, phone: "0788888888", campus: "Zeta" }, "e1", source)).toEqual([])
  })
})
