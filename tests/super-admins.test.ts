import { describe, expect, it } from "vitest"

import { activeSuperAdmins, initialUsers, isNeededSuperAdmin, minSuperAdmins, type User } from "@/lib/staff"

const admin = (id: string, status: User["status"] = "active"): User => ({ id, name: id, email: `${id}@x.org`, roleId: "super-admin", access: "Both", status })
const registrar: User = { id: "r", name: "r", email: "r@x.org", roleId: "registrar", access: "Both", status: "active" }

describe("minimum Super admins", () => {
  it("needs at least two", () => expect(minSuperAdmins).toBe(2))

  it("protects both Super admins when there are only two", () => {
    const users = [admin("a"), admin("b"), registrar]
    expect(isNeededSuperAdmin(users, users[0])).toBe(true)
    expect(isNeededSuperAdmin(users, users[1])).toBe(true)
  })

  it("lets one go when there are three", () => {
    const users = [admin("a"), admin("b"), admin("c")]
    expect(isNeededSuperAdmin(users, users[0])).toBe(false)
  })

  it("does not count inactive Super admins, and never protects other roles", () => {
    const users = [admin("a"), admin("b"), admin("c", "inactive")]
    expect(activeSuperAdmins(users)).toBe(2)
    expect(isNeededSuperAdmin(users, users[2])).toBe(false)
    expect(isNeededSuperAdmin(users, registrar)).toBe(false)
  })

  it("is met by the sample data", () => expect(activeSuperAdmins(initialUsers)).toBeGreaterThanOrEqual(minSuperAdmins))
})
