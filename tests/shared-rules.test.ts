import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { campRecord } from "@/lib/camp-data"
import { activeCampuses } from "@/lib/campuses"
import { initialRoles } from "@/lib/staff"
import { churchMaxChars, isEmail, mpesaCodeValid, nameMaxChars, phoneError, phoneValid, placeNameMaxChars, relationshipOptions } from "@/lib/validation"

// THE SHARED-RULES CONTRACT. The public site (campfearless-welcome, tests/shared-rules.test.ts) asserts exactly the same values.
// The two projects keep their own copy of these rules, so if one changes, its test fails and the other must be changed to match.
describe("shared rules (the same on the public site)", () => {
  it("accepts and rejects phone numbers the same way", () => {
    for (const ok of ["0712345678", "0112345678", "0712 345 678"]) expect(phoneValid(ok)).toBe(true)
    for (const bad of ["", "0612345678", "071234567", "07123456789", "+254712345678", "abcdefghij"]) expect(phoneValid(bad)).toBe(false)
    expect(phoneError).toBe("Enter a 10-digit number starting with 07 or 01.")
  })

  it("accepts and rejects M-Pesa codes and emails the same way", () => {
    expect(mpesaCodeValid("UINKH7FJWL")).toBe(true)
    for (const bad of ["", "uinkh7fjwl", "UINKH7FJW", "UINKH7FJWLX", "UINKH7FJW!"]) expect(mpesaCodeValid(bad)).toBe(false)
    expect(isEmail("name@mavuno.org")).toBe(true)
    expect(isEmail("name@mavuno")).toBe(false)
  })

  it("uses the same text limits", () => {
    expect([nameMaxChars, churchMaxChars, placeNameMaxChars]).toEqual([30, 60, 40])
  })

  it("offers the same five emergency contact relationships everywhere", () => {
    expect(relationshipOptions).toEqual(["Parent", "Legal Guardian", "Sibling", "Relative", "Other"])
  })

  it("has the same camp age limits", () => {
    expect([campRecord("MYF").ageMin, campRecord("MYF").ageMax]).toEqual([14, 17])
    expect([campRecord("MYA").ageMin, campRecord("MYA").ageMax]).toEqual([18, null])
  })

  it("has facilitator teams, which are the roles that can't sign in", () => {
    expect(initialRoles.filter((role) => !role.canSignIn).map((role) => role.name)).toEqual(["Kitchen crew", "Security", "Media team", "Worship team"])
  })
})

// When the public site's folder sits next to this one, check the two copies against each other directly. (Skipped on a machine
// or in a build that only has this project.)
const welcome = path.resolve(import.meta.dirname, "../../campfearless-welcome")
describe.skipIf(!existsSync(welcome))("the portal and the public site agree", () => {
  it("share one validation file, word for word", () => {
    expect(readFileSync(path.join(welcome, "lib/validation.ts"), "utf8")).toBe(readFileSync(path.resolve(import.meta.dirname, "../lib/validation.ts"), "utf8"))
  })

  it("offer the same campuses", async () => {
    const theirs = (await import(/* @vite-ignore */ path.join(welcome, "lib/campuses.ts"))) as { allCampuses: string[] }
    expect([...theirs.allCampuses].sort()).toEqual([...activeCampuses()].sort())
  })

  it("offer the same camp ages and relationships", async () => {
    const theirs = (await import(/* @vite-ignore */ path.join(welcome, "lib/camps.ts"))) as { camps: { id: string; ageMin: number; ageMax: number | null; relationships: string[] }[]; facilitatorTeams: string[] }
    for (const camp of theirs.camps) {
      const ours = campRecord(camp.id as "MYF" | "MYA")
      expect([camp.ageMin, camp.ageMax]).toEqual([ours.ageMin, ours.ageMax])
      expect(camp.relationships).toEqual(relationshipOptions)
    }
    expect(theirs.facilitatorTeams).toEqual(initialRoles.filter((role) => !role.canSignIn).map((role) => role.name))
  })
})
