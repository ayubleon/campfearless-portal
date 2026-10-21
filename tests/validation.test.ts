import { describe, expect, it } from "vitest"

import { churchMaxChars, isEmail, mpesaCodeValid, nameMaxChars, phoneValid, placeNameMaxChars } from "@/lib/validation"

describe("phone numbers", () => {
  it("accepts 10 digits starting 07 or 01, with or without spaces", () => {
    expect(phoneValid("0712345678")).toBe(true)
    expect(phoneValid("0112345678")).toBe(true)
    expect(phoneValid("0712 345 678")).toBe(true)
  })
  it("rejects anything else", () => {
    expect(phoneValid("")).toBe(false)
    expect(phoneValid("071234567")).toBe(false) // 9 digits
    expect(phoneValid("07123456789")).toBe(false) // 11 digits
    expect(phoneValid("0212345678")).toBe(false) // wrong start
    expect(phoneValid("+254712345678")).toBe(false)
    expect(phoneValid("07abcdefgh")).toBe(false)
  })
})

describe("email addresses", () => {
  it("accepts a normal address and ignores surrounding spaces", () => {
    expect(isEmail("name@mavuno.org")).toBe(true)
    expect(isEmail("  name@mavuno.org ")).toBe(true)
  })
  it("rejects missing parts", () => {
    expect(isEmail("")).toBe(false)
    expect(isEmail("name")).toBe(false)
    expect(isEmail("name@")).toBe(false)
    expect(isEmail("name@mavuno")).toBe(false)
    expect(isEmail("na me@mavuno.org")).toBe(false)
  })
})

describe("M-Pesa codes", () => {
  it("are exactly 10 upper case letters and digits", () => {
    expect(mpesaCodeValid("UINKH7FJWL")).toBe(true)
    expect(mpesaCodeValid("UINKH7FJW")).toBe(false)
    expect(mpesaCodeValid("UINKH7FJWLX")).toBe(false)
    expect(mpesaCodeValid("uinkh7fjwl")).toBe(false)
    expect(mpesaCodeValid("UINKH7FJW!")).toBe(false)
  })
})

describe("length limits", () => {
  it("are 30 for names, 60 for a church and 40 for places", () => {
    expect(nameMaxChars).toBe(30)
    expect(churchMaxChars).toBe(60)
    expect(placeNameMaxChars).toBe(40)
  })
})
