import { checkAmount, type Check } from "@/lib/payment-check"

// A Safaricom paybill statement, read from a CSV file: one row per payment received.
export type StatementRow = { date: string; code: string; name: string; amount: number }
export type StatementResult = { rows: StatementRow[]; error: string | null }

// Header names Safaricom's reports use, and the plain ones from a hand-made sheet, per field.
const headerNames = {
  date: ["date", "completiontime", "transactiondate", "time"],
  code: ["mpesacode", "receiptno", "receipt", "transactionid", "transactioncode", "code"],
  name: ["name", "details", "customername", "fullname", "otherpartyinfo"],
  amount: ["amount", "paidin", "amountpaid", "credit"],
} as const

const normalise = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "")

// Splits CSV text into rows of cells: quoted cells may hold commas, doubled quotes and line breaks.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const source = text.replace(/^﻿/, "")
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i++ }
      else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === ",") { row.push(cell); cell = "" }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++
      row.push(cell); cell = ""
      rows.push(row); row = []
    } else cell += char
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row) }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""))
}

const parseAmount = (value: string) => {
  const number = Number(value.replace(/[^0-9.]/g, ""))
  return Number.isFinite(number) ? Math.round(number) : 0
}

// Reads the statement rows. The first row that names a code and an amount is the header; rows with no code or nothing paid in
// (withdrawals, charges, totals) are skipped.
export const parseStatement = (text: string): StatementResult => parseTable(parseCsv(text))

// The same reading for a table of cells, so a CSV and an Excel sheet go through one set of rules. Excel hands over numbers
// and dates as such, so every cell is turned into text first.
export const cellText = (cell: unknown): string => {
  if (cell instanceof Date) {
    const pad = (value: number) => String(value).padStart(2, "0")
    return `${pad(cell.getDate())}/${pad(cell.getMonth() + 1)}/${cell.getFullYear()} ${pad(cell.getHours())}:${pad(cell.getMinutes())}`
  }
  return cell === null || cell === undefined ? "" : String(cell)
}

export function parseTable(cells: unknown[][]): StatementResult {
  const table = cells.map((row) => row.map(cellText)).filter((row) => row.some((value) => value.trim() !== ""))
  const headerAt = table.findIndex((cells) => {
    const names = cells.map(normalise)
    return headerNames.code.some((name) => names.includes(name)) && headerNames.amount.some((name) => names.includes(name))
  })
  if (headerAt === -1) return { rows: [], error: "This file has no M-Pesa code and amount columns. Use the paybill statement as a CSV file." }
  const names = table[headerAt].map(normalise)
  const column = (field: keyof typeof headerNames) => names.findIndex((name) => (headerNames[field] as readonly string[]).includes(name))
  const [date, code, name, amount] = [column("date"), column("code"), column("name"), column("amount")]
  const rows: StatementRow[] = []
  for (const cells of table.slice(headerAt + 1)) {
    const row: StatementRow = {
      date: date >= 0 ? (cells[date] ?? "").trim() : "",
      code: (cells[code] ?? "").trim().toUpperCase(),
      name: name >= 0 ? (cells[name] ?? "").trim() : "",
      amount: parseAmount(cells[amount] ?? ""),
    }
    if (row.code && row.amount > 0) rows.push(row)
  }
  return { rows, error: rows.length === 0 ? "No payments were found in this file." : null }
}

export type Declared = { id: string; code: string; expected: number; status: "pending" | "verified" | "flagged"; who?: string }
export type Tally = {
  found: { id: string; code: string; paid: number; check: Check; name: string; date: string }[]
  missing: Declared[] // declared at registration, but not in the statement
  unknown: StatementRow[] // paid to the paybill, but no registration has that code
  repeated: string[] // codes that appear more than once in the statement (only the first is used)
}

// Tallies what was declared at registration against what Safaricom received, by M-Pesa code.
export function tally(statement: StatementRow[], declared: Declared[]): Tally {
  const first = new Map<string, StatementRow>()
  const repeated = new Set<string>()
  for (const row of statement) {
    if (first.has(row.code)) repeated.add(row.code)
    else first.set(row.code, row)
  }
  const found: Tally["found"] = []
  const missing: Declared[] = []
  for (const payment of declared) {
    const row = first.get(payment.code.toUpperCase())
    if (row) found.push({ id: payment.id, code: payment.code, paid: row.amount, check: checkAmount(String(row.amount), payment.expected), name: row.name, date: row.date })
    else missing.push(payment)
  }
  const known = new Set(declared.map((payment) => payment.code.toUpperCase()))
  return { found, missing, unknown: [...first.values()].filter((row) => !known.has(row.code)), repeated: [...repeated] }
}
