"use client"

import * as React from "react"
import { IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import { statusClass } from "@/lib/status"
import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

type PaymentStatus = "pending" | "verified" | "flagged"
type Payment = {
  id: string
  code: string
  people: { name: string; age: number }[]
  camp: "MYF" | "MYA"
  expected: number
  amount: string
  status: PaymentStatus
  registeredBy: string
}

// Online registration is KES 1,000 a camper and walk-in KES 2,000 (Camp setup). One M-Pesa code can cover a whole batch.
const initialPayments: Payment[] = [
  { id: "p1", code: "UIN255RQWF", people: [{ name: "Kevin Zawadi", age: 21 }], camp: "MYA", expected: 1000, amount: "", status: "pending", registeredBy: "Sharon Wanjiru" },
  { id: "p2", code: "QJK4H7XW2P", people: [{ name: "Faith Mutiso", age: 17 }], camp: "MYF", expected: 1000, amount: "900", status: "pending", registeredBy: "Sharon Wanjiru" },
  { id: "p3", code: "RTP9X2LM4A", people: [{ name: "Ann Njeri", age: 16 }], camp: "MYF", expected: 2000, amount: "1800", status: "flagged", registeredBy: "Mercy Chebet" },
  { id: "p4", code: "BNM6C1VX8D", people: [{ name: "Melvin Zawadi", age: 25 }, { name: "Kevin Zawadi", age: 21 }, { name: "Tevin Zawadi", age: 18 }], camp: "MYA", expected: 3000, amount: "3000", status: "verified", registeredBy: "Dennis Otieno" },
  { id: "p5", code: "KLM3N8QZ7B", people: [{ name: "Dennis Otieno", age: 20 }], camp: "MYA", expected: 1000, amount: "1000", status: "pending", registeredBy: "Dennis Otieno" },
  { id: "p6", code: "WXY2P4TR9E", people: [{ name: "Joy Atieno", age: 15 }, { name: "Grace Atieno", age: 14 }, { name: "Peter Atieno", age: 17 }], camp: "MYF", expected: 3000, amount: "3000", status: "pending", registeredBy: "Faith Akinyi" },
  { id: "p7", code: "HGF5D7SA1Q", people: [{ name: "Samuel Kiprono", age: 19 }], camp: "MYA", expected: 2000, amount: "2500", status: "pending", registeredBy: "Sharon Wanjiru" },
  { id: "p8", code: "ZAQ1W3SX5C", people: [{ name: "Mary Wanjiku", age: 16 }], camp: "MYF", expected: 1000, amount: "1000", status: "verified", registeredBy: "Faith Akinyi" },
  { id: "p9", code: "EDC4R6FV8T", people: [{ name: "Peter Njoroge", age: 22 }, { name: "Lucy Njoroge", age: 20 }], camp: "MYA", expected: 2000, amount: "2000", status: "verified", registeredBy: "Dennis Otieno" },
  { id: "p10", code: "GBH7N9JM2K", people: [{ name: "Esther Achieng", age: 23 }], camp: "MYA", expected: 1000, amount: "", status: "pending", registeredBy: "Mercy Chebet" },
  { id: "p11", code: "LOP0I8UY6T", people: [{ name: "Daniel Kiptoo", age: 15 }], camp: "MYF", expected: 1000, amount: "700", status: "flagged", registeredBy: "Faith Akinyi" },
  { id: "p12", code: "MKJ9U7YH5G", people: [{ name: "Naomi Njeri", age: 18 }], camp: "MYA", expected: 2000, amount: "2000", status: "pending", registeredBy: "Sharon Wanjiru" },
  { id: "p13", code: "QAZ2WSX3ED", people: [{ name: "Brian Mwangi", age: 16 }, { name: "Mark Mwangi", age: 14 }], camp: "MYF", expected: 2000, amount: "2000", status: "verified", registeredBy: "Mercy Chebet" },
  { id: "p14", code: "PLM5OKN6IJ", people: [{ name: "Hannah Kamau", age: 16 }], camp: "MYF", expected: 1000, amount: "", status: "pending", registeredBy: "Faith Akinyi" },
]

const formatNumber = (value: number) => value.toLocaleString("en-US")

type Check = { kind: "enter" } | { kind: "matched" } | { kind: "short" | "over"; difference: number }
function checkOf(payment: Payment): Check {
  if (payment.amount === "") return { kind: "enter" }
  const amount = Number(payment.amount)
  if (amount === payment.expected) return { kind: "matched" }
  return amount < payment.expected ? { kind: "short", difference: payment.expected - amount } : { kind: "over", difference: amount - payment.expected }
}
const checkLabel = (check: Check) => (check.kind === "enter" ? "Enter amount" : check.kind === "matched" ? "Matched" : `${check.kind === "short" ? "Short" : "Over"} ${formatNumber(check.difference)}`)

const statusLabel: Record<PaymentStatus, string> = { pending: "Awaiting verification", verified: "Verified", flagged: "Flagged" }

export function PaymentsScreen() {
  const [payments, setPayments] = React.useState(initialPayments)
  const [query, setQuery] = React.useState("")
  const [camp, setCamp] = React.useState("all")
  const [status, setStatus] = React.useState("all")

  const update = (id: string, patch: Partial<Payment>) => setPayments((current) => current.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)))
  const decide = (payment: Payment, next: PaymentStatus, message: string) => { update(payment.id, { status: next }); toast.success(message) }

  const filtered = payments.filter((payment) =>
    `${payment.people.map((person) => person.name).join(" ")} ${payment.code} ${payment.registeredBy}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (camp === "all" || payment.camp === camp) &&
    (status === "all" || payment.status === status))

  const awaiting = payments.filter((payment) => payment.status === "pending").length
  const verified = payments.filter((payment) => payment.status === "verified")
  const flagged = payments.filter((payment) => payment.status === "flagged").length
  const verifiedTotal = verified.reduce((sum, payment) => sum + payment.expected, 0)
  const expectedTotal = payments.reduce((sum, payment) => sum + payment.expected, 0)

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Verify M-Pesa payments</CardTitle>
          <CardDescription>M-Pesa messages are checked by hand. Read the amount from the message, type it in, then verify. When the amount equals the total expected for everyone on that code it shows Matched and you can verify it. Anything else gets flagged, and flagged payments can be printed from Reports for follow-up.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative max-w-md flex-1">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border bg-muted/50 pl-8" placeholder="Search by system user / camper name, M-Pesa code" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={camp} onValueChange={setCamp}>
                <SelectTrigger className="w-32" aria-label="Camp"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All camps</SelectItem>
                  <SelectItem value="MYF">MYF</SelectItem>
                  <SelectItem value="MYA">MYA</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-48" aria-label="Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Awaiting verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="text-base font-semibold tabular-nums">{awaiting}</div>
              <div className="text-sm text-muted-foreground">Awaiting verification</div>
            </div>
            <div className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="text-base font-semibold tabular-nums">{verified.length}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="text-base font-semibold tabular-nums">{flagged}</div>
              <div className="text-sm text-muted-foreground">Flagged</div>
            </div>
            <div className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="text-base font-semibold tabular-nums">KES {formatNumber(verifiedTotal)} / KES {formatNumber(expectedTotal)}</div>
              <div className="text-sm text-muted-foreground">Verified of expected</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">M-Pesa code</TableHead>
                  <TableHead className="whitespace-nowrap">Registered</TableHead>
                  <TableHead className="whitespace-nowrap">Camp</TableHead>
                  <TableHead className="whitespace-nowrap">Expected</TableHead>
                  <TableHead className="whitespace-nowrap">Amount on SMS</TableHead>
                  <TableHead className="whitespace-nowrap">Check</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payment) => {
                  const check = checkOf(payment)
                  const open = payment.status === "pending"
                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap tabular-nums", statusClass("Neutral"))}>{payment.code}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{payment.people.map((person) => <div key={person.name}>{person.name} <span className="text-muted-foreground tabular-nums">({person.age})</span></div>)}</TableCell>
                      <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass("Neutral"))}>{payment.camp}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">{formatNumber(payment.expected)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Input
                          inputMode="numeric"
                          aria-label={`Amount on SMS for ${payment.code}`}
                          className="w-28 bg-muted/40 tabular-nums"
                          disabled={!open}
                          value={payment.amount === "" ? "" : formatNumber(Number(payment.amount))}
                          onChange={(event) => update(payment.id, { amount: event.target.value.replace(/\D/g, "").slice(0, 7) })}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {check.kind === "enter" ? <span className="text-muted-foreground">Enter amount</span> : <Badge variant="outline" className={cn("whitespace-nowrap", statusClass(check.kind === "matched" ? "Matched" : check.kind === "short" ? "Short" : "Over"))}>{checkLabel(check)}</Badge>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {payment.status === "pending" ? <span className="text-muted-foreground">-</span> : <Badge variant="outline" className={cn("whitespace-nowrap", statusClass(statusLabel[payment.status]))}>{statusLabel[payment.status]}</Badge>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex justify-end gap-3">
                          {open ? (
                            check.kind === "matched" ? (
                              <Button type="button" className="bg-brand text-brand-foreground hover:bg-brand-hover" onClick={() => decide(payment, "verified", "Payment successfully verified")}>Verify</Button>
                            ) : (
                              <Button type="button" variant="outline" onClick={() => decide(payment, "flagged", "Payment successfully flagged")}>Flag</Button>
                            )
                          ) : (
                            <Button type="button" variant="outline" onClick={() => decide(payment, "pending", "Payment successfully reopened")}>Reopen</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No payments match these filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
