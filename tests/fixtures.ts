import type { Camper, Facilitator } from "@/lib/records"

// A small made-up world for the tests (not the app's sample data).
export const makeCamper = (overrides: Partial<Camper> = {}): Camper => ({
  id: "t-c1", editionId: "e1", camp: "MYF", firstName: "Test", lastName: "Camper", age: 16, gender: "Male", phone: "0711000001",
  baptised: false, fromMavuno: true, campus: "Alpha", church: "", medical: "", specialNeeds: "",
  contact: { firstName: "Parent", lastName: "Camper", phone: "0722000001", relationship: "Parent" },
  channel: "Online", registeredById: null, paymentId: "t-p1", waiver: null, status: "Registered", ...overrides,
})

export const makeFacilitator = (overrides: Partial<Facilitator> = {}): Facilitator => ({
  id: "t-f1", editionId: "e1", firstName: "Test", lastName: "Helper", age: 30, gender: "Female", phone: "0733000001", team: "Kitchen crew",
  camp: "MYF", campus: "Alpha", contact: { firstName: "Kin", lastName: "Helper", phone: "0744000001", relationship: "Parent" },
  status: "Registered", medical: "", specialNeeds: "", feeWaived: false, paymentId: "t-p2", ...overrides,
})
