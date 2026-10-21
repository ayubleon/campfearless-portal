"use client"

import { campusLabel } from "@/lib/campuses"
import { currentEditionIds } from "@/lib/editions"
import { campersOfPayment, expectedForPayment, facilitatorsOfPayment, fullName, payments as paymentRecords } from "@/lib/records"
import { userName } from "@/lib/staff"
import { LoadingButton } from "@/components/loading-button"
import { checkAmount, type Check } from "@/lib/payment-check"
import { useAction } from "@/lib/use-action"
import { EditionScope } from "@/components/edition-scope"
import * as React from "react"
import { X } from "lucide-react"
import { IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import { formatNumber } from "@/lib/format"
import { SortableHead } from "@/components/sortable-head"
import { byNumber, byRank, byText, useSortedRows } from "@/lib/sort"
import { statusClass } from "@/lib/status"
import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

type PaymentStatus = "pending" | "verified" | "flagged"
type Payment = {
  id: string
  code: string
  people: { name: string; age: number }[]
  kind: "Camper" | "Facilitator"
  camp: "MYF" | "MYA" | "Both"
  campus: string
  expected: number
  amount: string
  status: PaymentStatus
  registeredBy: string
}

// The rows are the shared payment records (lib/records.ts): one M-Pesa code, the campers it covers, and what they owe.
// The camp and campus are those of the campers on the code (one campus per code); a payment made by the camper has no staff name.
const buildPayments = (): Payment[] => paymentRecords
  .filter((payment) => currentEditionIds.includes(payment.editionId))
  .flatMap((payment): Payment[] => {
    const covered = campersOfPayment(payment.id)
    const serving = facilitatorsOfPayment(payment.id)
    const first = covered[0] ?? serving[0]
    if (!first) return [] // a code with nobody on it has nothing to verify
    return [{
      id: payment.id,
      code: payment.code,
      kind: covered.length > 0 ? "Camper" : "Facilitator",
      people: [...covered, ...serving].map((person) => ({ name: fullName(person), age: person.age })),
      camp: first.camp,
      campus: first.campus,
      expected: expectedForPayment(payment.id),
      amount: payment.amountOnSms === null ? "" : String(payment.amountOnSms),
      status: payment.status,
      registeredBy: covered[0]?.registeredById ? userName(covered[0].registeredById!) : "Online",
    }]
  })

const checkOf = (payment: Payment): Check => checkAmount(payment.amount, payment.expected)
const checkLabel = (check: Check) => (check.kind === "enter" ? "Enter amount" : check.kind === "matched" ? "Matched" : `${check.kind === "short" ? "Short" : "Over"} ${formatNumber(check.difference)}`)

const statusLabel: Record<PaymentStatus, string> = { pending: "Awaiting verification", verified: "Verified", flagged: "Flagged" }

export function PaymentsScreen() {
  const [payments, setPayments] = React.useState(buildPayments)
  const [query, setQuery] = React.useState("")
  const [camp, setCamp] = React.useState("all")
  const [campus, setCampus] = React.useState("all")
  const [kind, setKind] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [verifying, setVerifying] = React.useState<Payment | null>(null)

  const update = (id: string, patch: Partial<Payment>) => setPayments((current) => current.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)))
  // Each change goes through the server call: the button shows its loading state and the row can't be changed twice.
  const { pending, run } = useAction()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const decide = async (payment: Payment, next: PaymentStatus, message: string, failedTo: string) => {
    setActiveId(payment.id)
    const ok = await run(() => update(payment.id, { status: next }), failedTo)
    setActiveId(null)
    if (ok) toast.success(message)
  }

  const campusOptions = Array.from(new Set(payments.map((payment) => payment.campus))).sort((a, b) => a.localeCompare(b))
  const filtered = payments.filter((payment) =>
    `${payment.people.map((person) => person.name).join(" ")} ${payment.code} ${payment.registeredBy}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    // A facilitator who serves Both camps is on the list of each.
    (camp === "all" || payment.camp === camp || payment.camp === "Both") &&
    (campus === "all" || payment.campus === campus) &&
    (kind === "all" || payment.kind === kind) &&
    (status === "all" || payment.status === status))

  // Heading clicks sort the list. Default: the work that needs doing first (awaiting verification, then flagged,
  // then verified), newest first within each group. Check groups the ones that need attention first.
  const statusRank = byRank(["pending", "flagged", "verified"])
  const checkRank = byRank(["enter", "short", "over", "matched"])
  const newest = (a: Payment, b: Payment) => Number(b.id.replace(/\D/g, "")) - Number(a.id.replace(/\D/g, ""))
  const { rows: sortedPayments, sort, toggle } = useSortedRows<Payment>(
    filtered,
    {
      registered: (a, b) => byText(a.people[0]?.name ?? "", b.people[0]?.name ?? ""),
      kind: (a, b) => byRank(["Camper", "Facilitator"])(a.kind, b.kind),
      camp: (a, b) => byText(a.camp, b.camp),
      campus: (a, b) => byText(a.campus, b.campus),
      expected: (a, b) => byNumber(a.expected, b.expected),
      amount: (a, b) => byNumber(Number(a.amount || 0), Number(b.amount || 0)),
      check: (a, b) => checkRank(checkOf(a).kind, checkOf(b).kind),
      status: (a, b) => statusRank(a.status, b.status),
    },
    (a, b) => statusRank(a.status, b.status) || newest(a, b)
  )

  const awaiting = payments.filter((payment) => payment.status === "pending").length
  const verified = payments.filter((payment) => payment.status === "verified")
  const flagged = payments.filter((payment) => payment.status === "flagged").length
  const verifiedTotal = verified.reduce((sum, payment) => sum + payment.expected, 0)
  const expectedTotal = payments.reduce((sum, payment) => sum + payment.expected, 0)

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <EditionScope>
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Verify M-Pesa payments</CardTitle>
          <CardDescription>M-Pesa messages are checked by hand. Read the amount from the message, type it in, then verify. When the amount equals the total expected for everyone on that code it shows Matched and you can verify it. Anything else gets flagged, and flagged payments can be printed from Reports for follow-up.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative w-full max-w-md lg:min-w-48 lg:flex-1">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border bg-muted/50 pl-8" aria-label="Search by name, M-Pesa code, who registered" placeholder="Search by name, M-Pesa code, who registered" value={query} onChange={(event) => setQuery(event.target.value)} />
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
              <Select value={campus} onValueChange={setCampus}>
                <SelectTrigger className="w-36" aria-label="Campus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campuses</SelectItem>
                  {campusOptions.map((option) => <SelectItem key={option} value={option}>{campusLabel(option)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="w-36" aria-label="Type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="Camper">Campers</SelectItem>
                  <SelectItem value="Facilitator">Facilitators</SelectItem>
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
                  <SortableHead label="Registered" sortKey="registered" sort={sort} onSort={toggle} />
                  <SortableHead label="Type" sortKey="kind" sort={sort} onSort={toggle} />
                  <SortableHead label="Camp" sortKey="camp" sort={sort} onSort={toggle} />
                  <SortableHead label="Campus" sortKey="campus" sort={sort} onSort={toggle} />
                  <SortableHead label="Expected" sortKey="expected" sort={sort} onSort={toggle} />
                  <SortableHead label="Amount on SMS" sortKey="amount" sort={sort} onSort={toggle} />
                  <SortableHead label="Check" sortKey="check" sort={sort} onSort={toggle} />
                  <SortableHead label="Status" sortKey="status" sort={sort} onSort={toggle} />
                  <TableHead className="whitespace-nowrap"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map((payment) => {
                  const check = checkOf(payment)
                  const open = payment.status === "pending"
                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap tabular-nums", statusClass("Neutral"))}>{payment.code}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{payment.people.map((person) => <div key={person.name}>{person.name} <span className="text-muted-foreground tabular-nums">({person.age})</span></div>)}</TableCell>
                      <TableCell className="whitespace-nowrap">{payment.kind}</TableCell>
                      <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass("Neutral"))}>{payment.camp}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{campusLabel(payment.campus)}</TableCell>
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
                              <Button type="button" className="bg-brand text-brand-foreground hover:bg-brand-hover" onClick={() => setVerifying(payment)}>Verify</Button>
                            ) : (
                              <LoadingButton type="button" variant="outline" pending={pending && activeId === payment.id} loadingLabel="Flagging..." disabled={pending} onClick={() => decide(payment, "flagged", "Payment successfully flagged", "flag the payment")}>Flag</LoadingButton>
                            )
                          ) : (
                            <LoadingButton type="button" variant="outline" pending={pending && activeId === payment.id} loadingLabel="Reopening..." disabled={pending} onClick={() => decide(payment, "pending", "Payment successfully reopened", "reopen the payment")}>Reopen</LoadingButton>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">No payments match these filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={verifying !== null} onOpenChange={(open) => !open && setVerifying(null)}>
        <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="text-base font-semibold leading-none tracking-tight">Verify payment?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              <strong className="text-foreground">{verifying?.code}</strong> for {verifying?.people.map((person) => person.name).join(", ")} will be marked <strong className="text-foreground">Verified</strong> at KES {verifying ? formatNumber(verifying.expected) : 0}. You can reopen it later.
            </DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close verify payment" className="absolute right-0 top-0" onClick={() => setVerifying(null)}><X className="size-4" /></Button>
          </DialogHeader>
          <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setVerifying(null)}>Cancel</Button>
            <LoadingButton type="button" pending={pending} loadingLabel="Verifying..." onClick={async () => { if (verifying) await decide(verifying, "verified", "Payment successfully verified", "verify the payment"); setVerifying(null) }}>Verify payment</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </EditionScope>
    </main>
  )
}
