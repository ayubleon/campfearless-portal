"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, X } from "lucide-react"
import { IconDotsVertical, IconSearch, IconTicket } from "@tabler/icons-react"
import { toast } from "sonner"

import { CamperFields, ContactFields, DoneOverlay, camperValid, camps, contactValid, emptyCamper, emptyContact, type Camp, type CamperForm, type ContactForm } from "@/components/registration"
import { formatDateTime } from "@/lib/format"
import { statusClass } from "@/lib/status"
import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { Button, buttonVariants } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Switch } from "@/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

// Until sign-in exists, the signed-in user is hardcoded like the sidebar's.
const currentUser = "John Doe"

type Waiver = { id: string; name: string; age: string; gender: string; phone: string; camp: Camp; campus: string; baptised: string; status: "Waived" | "Reversed"; arrived: boolean; issuedAt: Date; issuedBy: string }

const at = (month: number, day: number, hour: number, minute: number) => new Date(2026, month - 1, day, hour, minute)

// At the desk during camp the camper is usually present; before camp a waiver is issued in advance.
const duringCamp = (camp: Camp) => { const now = new Date(); return now >= camps[camp].campStart && now <= new Date(camps[camp].campEnd.getTime() + 86_400_000) }

const initialWaivers: Waiver[] = [
  { id: "w1", name: "Joy Atieno", age: "15", gender: "Female", phone: "0711203344", camp: "MYF", campus: "Mashariki", baptised: "No", status: "Waived", arrived: false, issuedAt: at(10, 20, 15, 40), issuedBy: "Sharon Wanjiru" },
  { id: "w2", name: "Peter Njoroge", age: "22", gender: "Male", phone: "0722450918", camp: "MYA", campus: "Hill City", baptised: "Yes", status: "Waived", arrived: false, issuedAt: at(10, 19, 11, 5), issuedBy: "John Doe" },
  { id: "w3", name: "Mary Wanjiku", age: "16", gender: "Female", phone: "", camp: "MYF", campus: "Kitengela", baptised: "Yes", status: "Waived", arrived: false, issuedAt: at(10, 18, 9, 30), issuedBy: "Sharon Wanjiru" },
  { id: "w4", name: "Samuel Kiprono", age: "19", gender: "Male", phone: "0790112233", camp: "MYA", campus: "Juja", baptised: "No", status: "Reversed", arrived: false, issuedAt: at(10, 15, 14, 12), issuedBy: "John Doe" },
  { id: "w5", name: "Grace Achieng", age: "14", gender: "Female", phone: "", camp: "MYF", campus: "Kisumu", baptised: "No", status: "Waived", arrived: false, issuedAt: at(10, 12, 10, 0), issuedBy: "Sharon Wanjiru" },
  { id: "w6", name: "Dennis Kamau", age: "24", gender: "Male", phone: "0700987654", camp: "MYA", campus: "Downtown", baptised: "No", status: "Waived", arrived: false, issuedAt: at(10, 10, 16, 45), issuedBy: "John Doe" },
]

function IssueDialog({ open, onClose, onIssue }: { open: boolean; onClose: () => void; onIssue: (camp: Camp, camper: CamperForm, contact: ContactForm, checkIn: boolean) => void }) {
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
            <Button type="button" disabled={!valid} onClick={() => onIssue(camp, camper, contact, checkIn)}>{checkIn ? "Issue waiver & check in" : "Issue waiver"}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReverseDialog({ waiver, onCancel, onConfirm }: { waiver: Waiver | null; onCancel: () => void; onConfirm: () => void }) {
  const fee = waiver ? camps[waiver.camp].walkInFee.toLocaleString("en-US") : ""
  return (
    <Dialog open={waiver !== null} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold leading-none tracking-tight"><AlertCircle className="text-destructive" />Reverse waiver?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground"><strong className="text-foreground">{waiver?.name}</strong> stays registered but {waiver?.arrived ? "now owes" : "pays at check-in"} the full fee of <strong className="text-foreground">KES {fee}</strong>, the normal way.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close reverse waiver" className="absolute right-0 top-0" onClick={onCancel}><X className="size-4" /></Button>
        </DialogHeader>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" onClick={onConfirm}>Reverse waiver</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WaiversScreen() {
  const [waivers, setWaivers] = React.useState(initialWaivers)
  const [query, setQuery] = React.useState("")
  const [campFilter, setCampFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [issuing, setIssuing] = React.useState(false)
  const [reversing, setReversing] = React.useState<Waiver | null>(null)
  // The undo overlay covers both a new waiver checked in at the desk and a later check-in on arrival.
  const [checkedIn, setCheckedIn] = React.useState<{ waiver: Waiver; isNew: boolean } | null>(null)

  const filtered = waivers.filter((waiver) =>
    `${waiver.name} ${waiver.phone} ${waiver.campus}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (campFilter === "all" || waiver.camp === campFilter) &&
    (statusFilter === "all" || (statusFilter === "not-arrived" ? waiver.status === "Waived" && !waiver.arrived : waiver.status === statusFilter)))

  const issue = (camp: Camp, camper: CamperForm, _contact: ContactForm, checkIn: boolean) => {
    const waiver: Waiver = { id: `w-${Date.now()}`, name: `${camper.firstName.trim()} ${camper.lastName.trim()}`, age: camper.age, gender: camper.gender, phone: camper.phone, camp, campus: camper.fromMavuno === "Yes" ? camper.campus : camper.church.trim() || "Not Mavuno", baptised: camper.baptised, status: "Waived", arrived: checkIn, issuedAt: new Date(), issuedBy: currentUser }
    setWaivers((current) => [waiver, ...current])
    setIssuing(false)
    if (checkIn) setCheckedIn({ waiver, isNew: true })
    else toast.success("Waiver successfully issued")
  }
  const setArrived = (id: string, arrived: boolean) => setWaivers((current) => current.map((waiver) => (waiver.id === id ? { ...waiver, arrived } : waiver)))

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Full waivers</CardTitle>
          <CardDescription>Waivers are full only. Issuing one registers the camper with a fee of KES 0, at the desk or in advance. Campers with a waiver check in with no payment. A reversed waiver means the camper pays the normal fee. Every change is logged.</CardDescription>
          <CardAction><Button type="button" onClick={() => setIssuing(true)}><IconTicket />Issue waiver</Button></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md flex-1">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="border bg-muted/50 pl-8" placeholder="Search by name, phone, campus" value={query} onChange={(event) => setQuery(event.target.value)} />
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" aria-label="Status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Waived">Waived</SelectItem>
                  <SelectItem value="Reversed">Reversed</SelectItem>
                  <SelectItem value="not-arrived">Not arrived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Camper</TableHead>
                  <TableHead className="whitespace-nowrap">Camp</TableHead>
                  <TableHead className="whitespace-nowrap">Campus</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Arrival</TableHead>
                  <TableHead className="whitespace-nowrap">Issued on</TableHead>
                  <TableHead className="whitespace-nowrap">Issued by</TableHead>
                  <TableHead className="whitespace-nowrap">Baptism</TableHead>
                  <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((waiver) => (
                  <TableRow key={waiver.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap"><div className="font-medium">{waiver.name}</div><div className="text-muted-foreground">Age: {waiver.age} - {waiver.gender}</div></TableCell>
                    <TableCell className="whitespace-nowrap">{waiver.camp}</TableCell>
                    <TableCell className="whitespace-nowrap">{waiver.campus}</TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(waiver.status))}>{waiver.status}</Badge></TableCell>
                    <TableCell className={cn("whitespace-nowrap", !waiver.arrived && "text-muted-foreground")}>{waiver.arrived ? "Checked in" : "Not arrived"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(waiver.issuedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{waiver.issuedBy}</TableCell>
                    <TableCell className="whitespace-nowrap">{waiver.baptised}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="More actions"><IconDotsVertical /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
                          {waiver.status === "Waived" && !waiver.arrived && <DropdownMenuItem onSelect={() => { setArrived(waiver.id, true); setCheckedIn({ waiver, isNew: false }) }}>Check in</DropdownMenuItem>}
                          <DropdownMenuItem asChild><Link href={`/audit-log?q=${encodeURIComponent(waiver.name)}`}>View activity</Link></DropdownMenuItem>
                          {waiver.status === "Waived" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setReversing(waiver)}>Reverse waiver</DropdownMenuItem>
                            </>
                          )}
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

      <IssueDialog open={issuing} onClose={() => setIssuing(false)} onIssue={issue} />
      <ReverseDialog
        waiver={reversing}
        onCancel={() => setReversing(null)}
        onConfirm={() => { const id = reversing?.id; setWaivers((current) => current.map((waiver) => (waiver.id === id ? { ...waiver, status: "Reversed" } : waiver))); setReversing(null); toast.success("Waiver successfully reversed") }}
      />
      {checkedIn && (
        <DoneOverlay
          title={checkedIn.isNew ? "Waiver issued and checked in" : "Successfully checked in"}
          description={checkedIn.isNew ? `${checkedIn.waiver.name} is registered for ${checkedIn.waiver.camp} with a fee of KES 0 and checked in as present.` : `${checkedIn.waiver.name} checked in as present. Their fee is waived, so no payment is needed.`}
          onUndo={() => { const { waiver, isNew } = checkedIn; if (isNew) setWaivers((current) => current.filter((item) => item.id !== waiver.id)); else setArrived(waiver.id, false); setCheckedIn(null) }}
          onDone={() => { toast.success(checkedIn.isNew ? "Waiver successfully issued" : "Camper successfully checked in"); setCheckedIn(null) }}
        />
      )}
    </main>
  )
}
