// The input rules every form shares, so a number or an email is accepted or rejected the same way everywhere.
// A Kenyan mobile number: 10 digits starting 07 or 01 (spaces allowed). Used for campers, contacts, staff and facilitators.
export const phoneValid = (value: string) => /^0[17]\d{8}$/.test(value.replace(/\s/g, ""))
export const phoneError = "Enter a 10-digit number starting with 07 or 01."

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

// M-Pesa transaction codes are 10 upper case letters and digits.
export const mpesaCodeValid = (value: string) => /^[A-Z0-9]{10}$/.test(value)

// Length limits for typed text, so a long value can't break a table, a printout or a CSV. People's names (first, last, and the
// emergency contact's), a church or organisation, and the names of campuses, networks, roles and editions.
export const nameMaxChars = 30
export const churchMaxChars = 60
export const placeNameMaxChars = 40

// Who the emergency contact can be to the camper: the same five choices for every camp, every form and the portal.
export const relationshipOptions = ["Parent", "Legal Guardian", "Sibling", "Relative", "Other"]
