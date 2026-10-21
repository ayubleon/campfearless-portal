"use client"

import * as React from "react"
import { endOfDay, format, startOfDay, subDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { X } from "lucide-react"
import { IconCalendar, IconSearch } from "@tabler/icons-react"

import { SortableHead } from "@/components/sortable-head"
import { byDate, byText, useSortedRows } from "@/lib/sort"
import { currentEditionIds, editions } from "@/lib/editions"
import { formatDateTime } from "@/lib/format"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Calendar } from "@/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

type Area = "users" | "roles" | "camp-setup" | "campuses" | "campers" | "waivers-payments" | "sensitive" | "sign-in"
type Change = { label: string; from: string; to: string }
type Entry = { id: string; at: Date; user: string; removed?: boolean; action: string; area: Area; camp: "MYF" | "MYA" | null; edition?: string; subject: string; summary?: string; changes?: Change[] }

const areas: { value: Area; label: string }[] = [
  { value: "users", label: "Users" },
  { value: "roles", label: "Roles" },
  { value: "camp-setup", label: "Camp setup" },
  { value: "campuses", label: "Campuses and networks" },
  { value: "campers", label: "Campers" },
  { value: "waivers-payments", label: "Waivers and payments" },
  { value: "sensitive", label: "Sensitive access" },
  { value: "sign-in", label: "Sign-in" },
]

// Entries about campers, waivers, payments, sensitive records and camp setup belong to an edition (the open one unless the entry says otherwise);
// users, roles, campuses and sign-in are not tied to one.
const editionTied: Area[] = ["campers", "waivers-payments", "camp-setup", "sensitive"]
const editionOf = (entry: Entry) => entry.edition ?? (editionTied.includes(entry.area) ? currentEditionIds[0] : null)

const at = (month: number, day: number, hour: number, minute: number) => new Date(2026, month - 1, day, hour, minute)

const entries: Entry[] = [
  { id: "a1", at: at(10, 21, 9, 42), user: "Dennis Otieno", action: "Checked in", area: "campers", camp: "MYA", subject: "Esther Achieng" },
  { id: "a2", at: at(10, 21, 9, 15), user: "Sharon Wanjiru", action: "Exit permit issued", area: "campers", camp: "MYA", subject: "Hannah Kamau" },
  { id: "a3", at: at(10, 21, 8, 30), user: "Sharon Wanjiru", action: "Medical details viewed", area: "sensitive", camp: "MYF", subject: "Ibrahim Hassan" },
  { id: "a4", at: at(10, 20, 17, 5), user: "John Doe", action: "Permission granted", area: "roles", camp: null, subject: "Registrar", summary: "Print records" },
  { id: "a5", at: at(10, 20, 16, 50), user: "John Doe", action: "Permission removed", area: "roles", camp: null, subject: "Lead registrar", summary: "Approve waivers" },
  { id: "a6", at: at(10, 20, 14, 12), user: "John Doe", action: "User role changed", area: "users", camp: null, subject: "Kevin Mutua", changes: [{ label: "Role", from: "Lead registrar", to: "Registrar" }] },
  { id: "a7", at: at(10, 20, 11, 3), user: "John Doe", action: "User deactivated", area: "users", camp: null, subject: "Kevin Mutua" },
  { id: "a8", at: at(10, 19, 15, 20), user: "John Doe", action: "Waiver issued", area: "waivers-payments", camp: "MYF", subject: "Mary Wanjiku", summary: "Checked in" },
  { id: "a33", at: at(10, 20, 12, 40), user: "John Doe", action: "Network added", area: "campuses", camp: null, subject: "Vision" },
  { id: "a34", at: at(10, 20, 12, 25), user: "John Doe", action: "Network renamed", area: "campuses", camp: null, subject: "Vision", changes: [{ label: "Name", from: "Vison", to: "Vision" }] },
  { id: "a35", at: at(10, 17, 9, 50), user: "John Doe", action: "Network deleted", area: "campuses", camp: null, subject: "Pilot network" },
  { id: "a36", at: at(10, 17, 9, 30), user: "John Doe", action: "Campus renamed", area: "campuses", camp: null, subject: "Mashauri", changes: [{ label: "Name", from: "Mashuri", to: "Mashauri" }] },
  { id: "a37", at: at(10, 17, 9, 10), user: "John Doe", action: "Campus deleted", area: "campuses", camp: null, subject: "Test campus", summary: "Limitless" },
  { id: "a38", at: at(10, 16, 15, 5), user: "John Doe", action: "Role added", area: "roles", camp: null, subject: "Greeter" },
  { id: "a39", at: at(10, 16, 15, 20), user: "John Doe", action: "Role deleted", area: "roles", camp: null, subject: "Temporary helper" },
  { id: "a40", at: at(10, 16, 11, 0), user: "John Doe", action: "User activated", area: "users", camp: null, subject: "Kevin Mutua" },
  { id: "a41", at: at(10, 16, 10, 12), user: "John Doe", action: "Invite resent", area: "users", camp: null, subject: "grace@mavuno.org" },
  { id: "a42", at: at(10, 16, 10, 5), user: "John Doe", action: "Invite cancelled", area: "users", camp: null, subject: "tom@mavuno.org" },
  { id: "a43", at: at(10, 21, 9, 44), user: "Dennis Otieno", action: "Check-in undone", area: "campers", camp: "MYA", subject: "Esther Achieng" },
  { id: "ed1", at: at(10, 15, 10, 0), user: "John Doe", action: "Edition created", area: "camp-setup", camp: null, subject: "December 2026", summary: "01/12/2026 - 06/12/2026" },
  { id: "ed2", at: at(10, 15, 10, 30), user: "John Doe", action: "Edition closed", area: "camp-setup", camp: null, edition: "aug-2026", subject: "August 2026" },
  { id: "ed3", at: at(10, 15, 10, 40), user: "John Doe", action: "Edition renamed", area: "camp-setup", camp: null, edition: "easter-2026", subject: "Easter 2026", changes: [{ label: "Name", from: "Easter", to: "Easter 2026" }] },
  { id: "ed4", at: at(10, 15, 10, 45), user: "John Doe", action: "Edition reopened", area: "camp-setup", camp: null, edition: "aug-2026", subject: "August 2026" },
  { id: "ed6", at: at(10, 21, 9, 55), user: "Sharon Wanjiru", action: "Check-out undone", area: "campers", camp: "MYF", subject: "Hannah Kamau" },
  { id: "ed5", at: at(10, 21, 9, 50), user: "Sharon Wanjiru", action: "Registration cancelled", area: "campers", camp: "MYF", subject: "Brian Otieno" },
  { id: "a44", at: at(10, 21, 8, 5), user: "John Doe", action: "Link resumed", area: "camp-setup", camp: "MYF", subject: "MYF registration link" },
  { id: "a45", at: at(10, 20, 18, 30), user: "John Doe", action: "Signed out", area: "sign-in", camp: null, subject: "john@mavuno.org" },
  { id: "a46", at: at(10, 19, 8, 12), user: "Dennis Otieno", action: "Password reset requested", area: "sign-in", camp: null, subject: "dennis@mavuno.org" },
  { id: "a47", at: at(10, 14, 16, 30), user: "John Doe", action: "Welcome page saved", area: "camp-setup", camp: null, subject: "Welcome page", summary: "MYA what to bring" },
  { id: "a48", at: at(10, 21, 9, 5), user: "John Doe", action: "Summary image downloaded", area: "campers", camp: null, subject: "Quick summary" },
  { id: "a29", at: at(10, 20, 13, 5), user: "Mercy Chebet", action: "Payment flagged", area: "waivers-payments", camp: "MYF", subject: "Ann Njeri", summary: "M-Pesa RTP9X2LM4A · Short KES 200" },
  { id: "a31", at: at(10, 20, 18, 2), user: "John Doe", action: "Profile updated", area: "users", camp: null, subject: "John Doe", changes: [{ label: "Phone", from: "0711000000", to: "0712345678" }] },
  { id: "a32", at: at(10, 20, 18, 4), user: "John Doe", action: "Password changed", area: "users", camp: null, subject: "John Doe" },
  { id: "a30", at: at(10, 20, 15, 30), user: "Sharon Wanjiru", action: "Payment reopened", area: "waivers-payments", camp: "MYF", subject: "Daniel Kiptoo", summary: "M-Pesa LOP0I8UY6T" },
  { id: "a9", at: at(10, 19, 10, 44), user: "Mercy Chebet", action: "Camper registered", area: "campers", camp: "MYF", subject: "Cynthia Wambui", summary: "Walk-in" },
  { id: "a24", at: at(10, 18, 16, 40), user: "John Doe", action: "Campus moved", area: "campuses", camp: null, subject: "Downtown", changes: [{ label: "Network", from: "Limitless", to: "Catalyst" }] },
  { id: "a10", at: at(10, 18, 14, 2), user: "John Doe", action: "Camp setup saved", area: "camp-setup", camp: "MYF", subject: "MYF setup", changes: [{ label: "Camp start", from: "30/11/2026", to: "01/12/2026" }, { label: "Registration closes", from: "25/11/2026", to: "30/11/2026" }, { label: "Camper limit", from: "900", to: "1,000" }] },
  { id: "a11", at: at(10, 18, 9, 30), user: "Sharon Wanjiru", action: "Payment verified", area: "waivers-payments", camp: "MYA", subject: "Felix Mwangi", summary: "M-Pesa QJK4H7XW2P" },
  { id: "a12", at: at(10, 17, 16, 10), user: "Sharon Wanjiru", action: "Records exported", area: "sensitive", camp: "MYA", subject: "Camp roster", summary: "590 campers" },
  { id: "a13", at: at(10, 16, 9, 45), user: "John Doe", action: "Camp setup saved", area: "camp-setup", camp: "MYA", subject: "MYA setup", changes: [{ label: "Walk-in (desk) registration", from: "KES 1,800", to: "KES 2,000" }] },
  { id: "a14", at: at(10, 16, 9, 40), user: "John Doe", action: "Link paused", area: "camp-setup", camp: "MYA", subject: "MYA registration link" },
  { id: "a15", at: at(10, 14, 13, 25), user: "Peter Kamau", removed: true, action: "Camper details updated", area: "campers", camp: "MYA", subject: "Amara Njeri", changes: [{ label: "Phone number", from: "0703128450", to: "0703128456" }] },
  { id: "a25", at: at(10, 15, 10, 5), user: "John Doe", action: "Campus added", area: "campuses", camp: null, subject: "Kizazi", summary: "Limitless" },
  { id: "a16", at: at(10, 14, 8, 0), user: "John Doe", action: "User removed", area: "users", camp: null, subject: "Peter Kamau" },
  { id: "a17", at: at(10, 12, 11, 20), user: "John Doe", action: "Shared settings saved", area: "camp-setup", camp: null, subject: "Shared settings", changes: [{ label: "Facilitator registration", from: "KES 400", to: "KES 500" }] },
  { id: "a18", at: at(10, 10, 15, 0), user: "John Doe", action: "User invited", area: "users", camp: null, subject: "brian@mavuno.org", summary: "Registrar, MYF only" },
  { id: "a19", at: at(10, 8, 10, 16), user: "Dennis Otieno", action: "Signed in", area: "sign-in", camp: null, subject: "dennis@mavuno.org" },
  { id: "a20", at: at(10, 8, 10, 15), user: "Dennis Otieno", action: "Sign-in failed", area: "sign-in", camp: null, subject: "dennis@mavuno.org", summary: "Wrong password" },
  { id: "a21", at: at(10, 5, 12, 0), user: "John Doe", action: "Role edited", area: "roles", camp: null, subject: "Lead registrar", changes: [{ label: "Description", from: "Runs the desk.", to: "Leads the registration desk." }] },
  { id: "a22", at: at(9, 25, 11, 30), user: "John Doe", action: "Records printed", area: "sensitive", camp: "MYF", subject: "Camp roster", summary: "214 campers" },
  { id: "a23", at: at(9, 20, 10, 5), user: "John Doe", action: "Camp access changed", area: "users", camp: null, subject: "Dennis Otieno", changes: [{ label: "Camp access", from: "Both", to: "MYA only" }] },
]

const pageSize = 10

function inWhen(entry: Entry, when: string, range: DateRange | undefined) {
  const now = new Date()
  if (when === "today") return entry.at >= startOfDay(now)
  if (when === "7d") return entry.at >= startOfDay(subDays(now, 6))
  if (when === "30d") return entry.at >= startOfDay(subDays(now, 29))
  if (when === "custom" && range?.from) return entry.at >= startOfDay(range.from) && entry.at <= endOfDay(range.to ?? range.from)
  return true
}

function Detail({ entry, onOpen }: { entry: Entry; onOpen: () => void }) {
  const changes = entry.changes ?? []
  return (
    <span>
      <span className="font-medium">{entry.subject}</span>
      {entry.summary && <span className="text-muted-foreground"> · {entry.summary}</span>}
      {changes.length === 1 && <span className="text-muted-foreground"> · {changes[0].label} {changes[0].from} → <span className="text-foreground">{changes[0].to}</span></span>}
      {changes.length > 1 && <span className="text-muted-foreground"> · <Button type="button" variant="link" className="h-auto p-0 text-foreground underline" onClick={onOpen}>{changes.length} changes</Button></span>}
    </span>
  )
}

export function AuditLogScreen({ initialQuery = "", initialCamp = "all", initialArea = "all" }: { initialQuery?: string; initialCamp?: string; initialArea?: string }) {
  const [query, setQuery] = React.useState(initialQuery)
  const [camp, setCamp] = React.useState(initialCamp)
  const [when, setWhen] = React.useState("all")
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [area, setArea] = React.useState(initialArea)
  const [edition, setEdition] = React.useState("all")
  const [shown, setShown] = React.useState(pageSize)
  const [open, setOpen] = React.useState<Entry | null>(null)

  const filtered = entries.filter((entry) => {
    const text = `${entry.user} ${entry.action} ${entry.subject} ${entry.summary ?? ""} ${(entry.changes ?? []).map((change) => `${change.label} ${change.from} ${change.to}`).join(" ")}`.toLowerCase()
    return (
      text.includes(query.trim().toLowerCase()) &&
      (camp === "all" || (camp === "system" ? entry.camp === null : entry.camp === camp)) &&
      (area === "all" || entry.area === area) &&
      (edition === "all" || editionOf(entry) === edition) &&
      inWhen(entry, when, range)
    )
  })

  // Heading clicks sort the log. Default: newest first, as the card says.
  const { rows: sortedEntries, sort, toggle } = useSortedRows<Entry>(
    filtered,
    {
      when: (a, b) => byDate(a.at, b.at),
      user: (a, b) => byText(a.user, b.user),
      action: (a, b) => byText(a.action, b.action),
      detail: (a, b) => byText(a.subject, b.subject),
      camp: (a, b) => byText(a.camp ?? "~", b.camp ?? "~"), // system entries (no camp) last when ascending
    },
    (a, b) => byDate(b.at, a.at)
  )
  React.useEffect(() => setShown(pageSize), [query, camp, when, range, area, edition])

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="min-w-0 shadow-none">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">System activity</CardTitle>
          <CardDescription>Every change made in the portal, newest first; entries can't be edited or deleted.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-md xl:flex-1">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border bg-muted/50 pl-8" aria-label="Search by user, camper name, action" placeholder="Search by user, camper name, action" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={edition} onValueChange={setEdition}>
                <SelectTrigger className="w-44" aria-label="Edition"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All editions</SelectItem>
                  {editions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={camp} onValueChange={setCamp}>
                <SelectTrigger className="w-36" aria-label="Camp"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All camps</SelectItem>
                  <SelectItem value="MYF">MYF</SelectItem>
                  <SelectItem value="MYA">MYA</SelectItem>
                  <SelectItem value="system">System-wide</SelectItem>
                </SelectContent>
              </Select>
              <Select value={when} onValueChange={setWhen}>
                <SelectTrigger className="w-36" aria-label="When"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              {when === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-56 justify-between font-normal tabular-nums">
                      <span className="truncate">{range?.from ? `${format(range.from, "dd/MM/yyyy")} – ${format(range.to ?? range.from, "dd/MM/yyyy")}` : "Pick dates"}</span>
                      <IconCalendar className="text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent aria-label="Choose date range" className="w-auto overflow-hidden p-0" align="end">
                    <Calendar mode="range" selected={range} onSelect={setRange} defaultMonth={range?.from ?? new Date()} disabled={{ after: new Date() }} />
                  </PopoverContent>
                </Popover>
              )}
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="w-44" aria-label="Action"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {areas.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <SortableHead label="When" sortKey="when" sort={sort} onSort={toggle} />
                  <SortableHead label="User" sortKey="user" sort={sort} onSort={toggle} />
                  <SortableHead label="Action" sortKey="action" sort={sort} onSort={toggle} />
                  <SortableHead label="Detail" sortKey="detail" sort={sort} onSort={toggle} />
                  <SortableHead label="Camp" sortKey="camp" sort={sort} onSort={toggle} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.slice(0, shown).map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(entry.at)}</TableCell>
                    <TableCell className="whitespace-nowrap">{entry.user}{entry.removed && <span className="text-muted-foreground"> (removed)</span>}</TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className="whitespace-nowrap">{entry.action}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap"><Detail entry={entry} onOpen={() => setOpen(entry)} /></TableCell>
                    <TableCell className="whitespace-nowrap">{entry.camp ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No entries match these filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-6">
              <p className="text-xs text-muted-foreground tabular-nums">Showing {Math.min(shown, filtered.length)} of {filtered.length} entries</p>
              {shown < filtered.length && <Button type="button" variant="outline" onClick={() => setShown((current) => current + pageSize)}>Load more</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="text-base font-bold leading-none tracking-tight">{open?.action}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              <strong className="text-foreground">{open?.subject}</strong> by {open?.user}{open?.removed ? " (removed)" : ""}, <span className="tabular-nums">{open ? formatDateTime(open.at) : ""}</span>
            </DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close entry details" className="absolute right-0 top-0" onClick={() => setOpen(null)}><X className="size-4" /></Button>
          </DialogHeader>
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pt-4">
            {(open?.changes ?? []).map((change) => (
              <div key={change.label} className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                <div className="text-muted-foreground">{change.label}</div>
                <div className="tabular-nums">{change.from} → <strong className="text-foreground">{change.to}</strong></div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4 flex-row justify-end gap-3 sm:mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
