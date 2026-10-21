import { describe, expect, it } from "vitest"

import { hasPermissionIn } from "@/lib/session"

const roles = [
  { id: "admin", permissions: ["register", "check-in", "verify-payments", "view-medical"] },
  { id: "desk", permissions: ["register", "check-in"] },
  { id: "helper", permissions: [] },
]

describe("role permissions", () => {
  it("allows what the role has", () => {
    expect(hasPermissionIn(roles, "admin", "verify-payments")).toBe(true)
    expect(hasPermissionIn(roles, "desk", "check-in")).toBe(true)
  })
  it("refuses what the role does not have", () => {
    expect(hasPermissionIn(roles, "desk", "verify-payments")).toBe(false)
    expect(hasPermissionIn(roles, "desk", "view-medical")).toBe(false)
    expect(hasPermissionIn(roles, "helper", "register")).toBe(false)
  })
  it("refuses everything for an unknown role", () => {
    expect(hasPermissionIn(roles, "nobody", "register")).toBe(false)
  })
})
