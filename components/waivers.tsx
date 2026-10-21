"use client"

import { useSession } from "@/components/session-provider"
import { LoadingButton } from "@/components/loading-button"
import { useAction } from "@/lib/use-action"
import { DuplicateDialog, type DuplicateState } from "@/components/duplicate-dialog"
import { EditionScope } from "@/components/edition-scope"
import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { IconDotsVertical, IconSearch, IconTicket } from "@tabler/icons-react"
import { toast } from "sonner"

import { campusLabel, invitedCampus } from "@/lib/campuses"
import { currentEditionIds } from "@/lib/editions"
import { campers, findDuplicates, fullName } from "@/lib/records"
import { currentUser } from "@/lib/session"
import { userName } from "@/lib/staff"
import { CamperFields, ContactFields, DoneOverlay, camperValid, camps, contactValid, emptyCamper, emptyContact, type Camp, type CamperForm, type ContactForm } from "@/components/registration"
import { SortableHead } from "@/components/sortable-head"
import { byDate, byRank, byText, useSortedRows } from "@/lib/sort"
import { formatDateTime } from "@/lib/format"
import { statusClass } from "@/lib/status"
import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { Button, buttonVariants } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Switch } from "@/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

// Until sign-in exists, the signed-in user is hardcoded like the sidebar's.

type Waiver = { id: string; name: string; age: string; gender: string; phone: string; camp: Camp; campus: string; baptised: string; source: "Walk-in" | "In advance"; arrived: boolean; issuedAt: Date; issuedBy: string }

// At the desk during camp the camper is usually present; before camp a waiver is issued in advance.
const duringCamp = (camp: Camp) => { const now = new Date(); return now >= camps[camp].campStart && now <= new Date(camps[camp].campEnd.getTime() + 86_400_000) }

// The rows are the campers who hold a waiver (lib/records.ts), so a waived camper is the same person everywhere else.
const initialWaivers: Waiver[] = campers
  .filter((camper) => camper.waiver && currentEditionIds.includes(camper.editionId))
  .map((camper) => ({
    id: camper.id,
    name: fullName(camper),
    age: String(camper.age),
    gender: camper.gender,
    phone: camper.phone,
    camp: camper.camp,
    campus: camper.campus,
    baptised: camper.baptised ? "Yes" : "No",
    source: camper.waiver!.source,
    arrived: camper.status !== "Registered",
    issuedAt: camper.waiver!.issuedAt,
    issuedBy: userName(camper.waiver!.issuedById),
  }))

function IssueDialog({ open, pending, onClose, onIssue }: { open: boolean; pending: boolean; onClose: () => void; onIssue: (camp: Camp, camper: CamperForm, contact: ContactForm, checkIn: boolean) => void }) {
  const [camp, setCamp] = React.useState<Camp>("MYF")
  const [camper, setCamper] = React.useState<CamperForm>(emptyCamper())
  const [contact, setContact] = React.useState<ContactForm>(emptyContact())
  const [checkIn, setCheckIn] = React.useState(false)
  React.useEffect(() => { if (open) { setCamp("MYF"); setCamper(emptyCamper()); setContact(emptyContact()); setCheckIn(duringCamp("MYF")) } }, [open])
  const valid = camperValid(camp, camper) && contactValid(contact)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 bg-background p-4 sm:max-w-4xl sm:p-6">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-semibold leading-none tracking-tight">Issue full waiver</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">The camper is registered with a fee of KES 0. Check them in now if they are at the desk.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close issue waiver" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex min-h-0 flex-col">
          <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            <Tabs value={camp} onValueChange={(value) => { const next = value as Camp; setCamp(next); setCheckIn(duringCamp(next)); setCamper((current) => ({ ...current, age: "" })); setContact((current) => ({ ...current, relationship: camps[next].relationships.includes(current.relationship) ? current.relationship : "" })) }} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger className="w-full" value="MYF">{camps.MYF.label}</TabsTrigger>
                <TabsTrigger className="w-full" value="MYA">{camps.MYA.label}</TabsTrigger>
              </TabsList>
            </Tabs>
            <section className="pt-2">
              <h3 className="mb-3 text-base font-semibold">Camper details</h3>
              <CamperFields camp={camp} camper={camper} id="waiver-camper" onChange={(patch) => setCamper((current) => ({ ...current, ...patch }))} />
            </section>
            <section className="pt-6">
              <h3 className="mb-3 text-base font-semibold">Emergency contact</h3>
              <ContactFields camp={camp} contact={contact} campers={1} onChange={(patch) => setContact((current) => ({ ...current, ...patch }))} />
            </section>
            <label className="mt-2 flex cursor-pointer flex-col gap-2 rounded-2xl border bg-muted/30 p-4 text-sm">
              <span className="flex items-center gap-2 font-medium"><Switch aria-label="Check in now" checked={checkIn} onCheckedChange={setCheckIn} />Check in now</span>
              <span className="pl-10 text-muted-foreground">{checkIn ? "The camper is at the desk and is marked present straight away." : "Issued in advance. They check in on arrival with no payment needed."}</span>
            </label>
          </div>
          <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <LoadingButton type="button" pending={pending} loadingLabel="Issuing..." disabled={!valid} onClick={() => onIssue(camp, camper, contact, checkIn)}>{checkIn ? "Issue waiver & check in" : "Issue waiver"}</LoadingButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function WaiversScreen() {
  const { can } = useSession()
  const [waivers, setWaivers] = React.useState(initialWaivers)
  const [query, setQuery] = React.useState("")
  const [campFilter, setCampFilter] = React.useState("all")
  const [campusFilter, setCampusFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [issuing, setIssuing] = React.useState(false)
  // The undo overlay covers both a new waiver checked in at the desk and a later check-in on arrival.
  const [checkedIn, setCheckedIn] = React.useState<{ waiver: Waiver; isNew: boolean } | null>(null)

  const campusOptions = Array.from(new Set([...waivers.map((waiver) => waiver.campus), ...(campusFilter === "all" ? [] : [campusFilter])])).sort((a, b) => a.localeCompare(b))
  const filtered = waivers.filter((waiver) =>
    `${waiver.name} ${waiver.phone} ${waiver.campus}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (campFilter === "all" || waiver.camp === campFilter) &&
    (campusFilter === "all" || waiver.campus === campusFilter) &&
    (statusFilter === "all" || (statusFilter === "not-arrived" ? !waiver.arrived : waiver.arrived)))

  // Heading clicks sort the list. Default: newest issued first.
  const sourceRank = byRank(["Walk-in", "In advance"])
  const baptismRank = byRank(["Yes", "No"])
  const { rows: sortedWaivers, sort, toggle } = useSortedRows<Waiver>(
    filtered,
    {
      camper: (a, b) => byText(a.name, b.name),
      camp: (a, b) => byText(a.camp, b.camp),
      campus: (a, b) => byText(a.campus, b.campus),
      waiver: (a, b) => sourceRank(a.source, b.source),
      arrival: (a, b) => Number(a.arrived) - Number(b.arrived), // not arrived first
      issuedOn: (a, b) => byDate(a.issuedAt, b.issuedAt),
      issuedBy: (a, b) => byText(a.issuedBy, b.issuedBy),
      baptism: (a, b) => baptismRank(a.baptised, b.baptised),
    },
    (a, b) => byDate(b.issuedAt, a.issuedAt)
  )
  const [duplicate, setDuplicate] = React.useState<DuplicateState | null>(null)
  const { pending, run } = useAction()
  const issue = (camp: Camp, camper: CamperForm, contact: ContactForm, checkIn: boolean) => {
    // The same person can't hold two registrations in an edition (a waiver is a registration that pays nothing).
    const found = findDuplicates({ firstName: camper.firstName, lastName: camper.lastName, age: Number(camper.age), phone: camper.phone, campus: camper.fromMavuno === "Yes" ? camper.campus : invitedCampus })
    const same = found.filter((match) => match.kind === "same")
    const similar = found.filter((match) => match.kind === "similar")
    if (same.length > 0 || similar.length > 0) { setDuplicate({ same, similar, proceed: () => save(camp, camper, checkIn) }); return }
    save(camp, camper, checkIn)
  }
  const save = async (camp: Camp, camper: CamperForm, checkIn: boolean) => {
    if (!(await run(() => undefined, "issue the waiver"))) return
    const waiver: Waiver = { id: `w-${Date.now()}`, name: `${camper.firstName.trim()} ${camper.lastName.trim()}`, age: camper.age, gender: camper.gender, phone: camper.phone, camp, campus: camper.fromMavuno === "Yes" ? camper.campus : invitedCampus, baptised: camper.baptised, source: checkIn ? "Walk-in" : "In advance", arrived: checkIn, issuedAt: new Date(), issuedBy: currentUser.name }
    setWaivers((current) => [waiver, ...current])
    setIssuing(false)
    if (checkIn) setCheckedIn({ waiver, isNew: true })
    else toast.success("Waiver successfully issued")
  }
  const setArrived = (id: string, arrived: boolean) => setWaivers((current) => current.map((waiver) => (waiver.id === id ? { ...waiver, arrived } : waiver)))

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <EditionScope>
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Full waivers</CardTitle>
          <CardDescription>Waivers are full only. Issuing one registers the camper with a fee of KES 0, at the desk or in advance. Campers with a waiver check in with no payment. Every change is logged.</CardDescription>
          <CardAction><Button type="button" onClick={() => setIssuing(true)}><IconTicket />Issue waiver</Button></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border bg-muted/50 pl-8" aria-label="Search by name, phone, campus" placeholder="Search by name, phone, campus" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={campFilter} onValueChange={setCampFilter}>
                <SelectTrigger className="w-32" aria-label="Camp"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All camps</SelectItem>
                  <SelectItem value="MYF">MYF</SelectItem>
                  <SelectItem value="MYA">MYA</SelectItem>
                </SelectContent>
              </Select>
              <Select value={campusFilter} onValueChange={setCampusFilter}>
                <SelectTrigger className="w-36" aria-label="Campus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campuses</SelectItem>
                  {campusOptions.map((campus) => <SelectItem key={campus} value={campus}>{campusLabel(campus)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" aria-label="Arrival"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All arrivals</SelectItem>
                  <SelectItem value="not-arrived">Not arrived</SelectItem>
                  <SelectItem value="checked-in">Checked in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <SortableHead label="Camper" sortKey="camper" sort={sort} onSort={toggle} />
                  <SortableHead label="Camp" sortKey="camp" sort={sort} onSort={toggle} />
                  <SortableHead label="Campus" sortKey="campus" sort={sort} onSort={toggle} />
                  <SortableHead label="Waiver" sortKey="waiver" sort={sort} onSort={toggle} />
                  <SortableHead label="Arrival" sortKey="arrival" sort={sort} onSort={toggle} />
                  <SortableHead label="Issued on" sortKey="issuedOn" sort={sort} onSort={toggle} />
                  <SortableHead label="Issued by" sortKey="issuedBy" sort={sort} onSort={toggle} />
                  <SortableHead label="Baptism" sortKey="baptism" sort={sort} onSort={toggle} />
                  <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWaivers.map((waiver) => (
                  <TableRow key={waiver.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap"><div className="font-medium">{waiver.name}</div><div className="text-muted-foreground">Age: {waiver.age} - {waiver.gender}</div></TableCell>
                    <TableCell className="whitespace-nowrap">{waiver.camp}</TableCell>
                    <TableCell className="whitespace-nowrap">{campusLabel(waiver.campus)}</TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(waiver.source))}>{waiver.source}</Badge></TableCell>
                    <TableCell className={cn("whitespace-nowrap", !waiver.arrived && "text-muted-foreground")}>{waiver.arrived ? "Checked in" : "Not arrived"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(waiver.issuedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{waiver.issuedBy}</TableCell>
                    <TableCell className="whitespace-nowrap">{waiver.baptised}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="More actions"><IconDotsVertical /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
                          {!waiver.arrived && can("check-in") && <DropdownMenuItem onSelect={() => { setArrived(waiver.id, true); setCheckedIn({ waiver, isNew: false }) }}>Check in</DropdownMenuItem>}
                          <DropdownMenuItem asChild><Link href={`/audit-log?q=${encodeURIComponent(waiver.name)}`}>View activity</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No waivers match these filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DuplicateDialog state={duplicate} onClose={() => setDuplicate(null)} />
      <IssueDialog open={issuing} pending={pending} onClose={() => setIssuing(false)} onIssue={issue} />
      {checkedIn && (
        <DoneOverlay
          title={checkedIn.isNew ? "Waiver issued and checked in" : "Successfully checked in"}
          description={checkedIn.isNew ? `${checkedIn.waiver.name} is registered for ${checkedIn.waiver.camp} with a fee of KES 0 and checked in as present.` : `${checkedIn.waiver.name} checked in as present. Their fee is waived, so no payment is needed.`}
          onUndo={() => { const { waiver, isNew } = checkedIn; if (isNew) setWaivers((current) => current.filter((item) => item.id !== waiver.id)); else setArrived(waiver.id, false); setCheckedIn(null) }}
          onDone={() => { toast.success(checkedIn.isNew ? "Waiver successfully issued" : "Camper successfully checked in"); setCheckedIn(null) }}
        />
      )}
      </EditionScope>
    </main>
  )
}
