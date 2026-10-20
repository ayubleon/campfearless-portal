"use client"

import * as React from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { AlertCircle, X } from "lucide-react"
import { IconChevronDown, IconDotsVertical, IconSearch, IconTicket } from "@tabler/icons-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Badge } from "@/ui/badge"
import { Button, buttonVariants } from "@/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const COLORS = ["#336699", "#55C4AE", "#FFD400"]
const summary = [["5", "Campers departed early"], ["620", "Total registered campers"], ["590", "Campers present on site"], ["40", "Walk in registrations"], ["13", "Total registered facilitators"], ["210", "Pending arrivals"]]
const campers = [
  ["Amara Njeri", "Age: 24 - Female", "Grace Njeri", "0703128456", "Downtown", "Registered", "-", "Autistic"],
  ["Brian Otieno", "Age: 19 - Male", "Peter Otieno", "0718562390", "Downtown", "Registered", "-", "-"],
  ["Cynthia Wambui", "Age: 22 - Female", "Mercy Wambui", "0721456783", "Downtown", "Registered", "Asthmatic", "-"],
  ["Daniel Kiptoo", "Age: 18 - Male", "Samuel Kiptoo", "0790345128", "Mashauri", "Registered", "-", "Down syndrome"],
  ["Esther Achieng", "Age: 23 - Female", "Rose Achieng", "0742789016", "Hill City", "Checked in", "-", "-"],
  ["Felix Mwangi", "Age: 20 - Male", "Lucy Mwangi", "0765123478", "Hill City", "Checked in", "Sinuses", "-"],
  ["Hannah Kamau", "Age: 21 - Female", "David Kamau", "0786231094", "Invited", "Checked out", "-", "-"],
  ["Ibrahim Hassan", "Age: 20 - Male", "Fatuma Hassan", "0734891267", "PCEA", "Checked out", "Protein allergy", "-"],
]

function DonutCard({ title, description, data, centerValue, centerLabel, labels }: any) {
  return <Card className="min-w-0"><CardHeader><CardTitle className="text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div className="relative mx-auto h-56 w-full max-w-xs"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" innerRadius="52%" outerRadius="78%" strokeWidth={0}>{data.map((entry: any, index: number) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl">{centerValue}</strong><span className="text-xs text-muted-foreground">{centerLabel}</span></div></div><div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">{data.map((item: any, index: number) => <span key={item.name} className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />{labels[index]} {item.value}</span>)}</div></CardContent></Card>
}

function QuickSummary() { return <Card className="min-w-0 overflow-hidden"><CardHeader><CardTitle className="text-base">Quick summary</CardTitle><CardDescription>A summary of campers data</CardDescription></CardHeader><CardContent><div className="flex max-h-72 flex-col gap-2 overflow-y-auto px-1 pr-3">{summary.map(([value, label]) => <div key={label} className="rounded-lg border bg-muted/20 px-4 py-3"><div className="text-base font-semibold tabular-nums">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>)}</div></CardContent></Card> }

function statusClass(status: string) { return status === "Checked in" ? "border-transparent bg-status-checked-in text-status-checked-in-foreground" : status === "Registered" ? "border-transparent bg-status-registered text-status-registered-foreground" : "rounded-full border-2 border-border bg-muted text-muted-foreground" }

function CheckInAction({ camperName, status, onCheckIn, onExit }: { camperName: string; status: string; onCheckIn: () => void; onExit: () => void }) {
  const checkedIn = status === "Checked in"
  const checkedOut = status === "Checked out"
  const [open, setOpen] = React.useState(false)
  if (checkedOut) return <span className="whitespace-nowrap text-sm text-muted-foreground">{status}</span>
  if (!checkedIn) return <Button type="button" className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90" onClick={onCheckIn}>Check in</Button>
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" className="whitespace-nowrap" onClick={() => setOpen(true)}>Issue exit permit</Button>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="gap-3 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg"><AlertCircle className="text-destructive" data-icon="inline-start" />Issue early exit permit</DialogTitle>
          <DialogDescription>You are about to issue an official early exit permit for <strong className="text-foreground">{camperName}</strong>. This will transition their status to <strong className="text-foreground">Checked out</strong></DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { onExit(); setOpen(false) }}>Issue permit</Button>
        </DialogFooter>
        <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setOpen(false)} aria-label="Close"><X /></Button>
      </DialogContent>
    </Dialog>
  )
}

function RowActions({ status, onUndo, onUndoCheckIn, onEdit }: { status: string; onUndo?: () => void; onUndoCheckIn?: () => void; onEdit?: () => void }) {
  const checkedOut = status === "Checked out"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
        aria-label="More actions"
      >
        <IconDotsVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
        <DropdownMenuItem onSelect={onEdit}>Edit details</DropdownMenuItem>
        {checkedOut && <DropdownMenuItem onSelect={onUndo}>Undo check out</DropdownMenuItem>}
        {status === "Checked in" && <DropdownMenuItem onSelect={onUndoCheckIn}>Undo check in</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">Cancel registration</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardOverview() {
  const [campus, setCampus] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [exitPermitCamper, setExitPermitCamper] = React.useState<string | null>(null)
  const [editCamper, setEditCamper] = React.useState<{ index: number; firstName: string; lastName: string; age: string; gender: string; phone: string; baptized: string; medical: boolean; specialNeeds: boolean; medicalDetails: string; specialNeedsDetails: string } | null>(null)
  const [rowStatuses, setRowStatuses] = React.useState<Record<number, string>>({})
const [checkedOutCampers, setCheckedOutCampers] = React.useState<Set<number>>(() => new Set(campers.flatMap((camper, index) => camper[5] === "Checked out" ? [index] : [])))
 const [checkedInCampers, setCheckedInCampers] = React.useState<Set<number>>(() => new Set(campers.flatMap((camper, index) => camper[5] === "Checked in" ? [index] : [])))
  const [exitPermitTimes, setExitPermitTimes] = React.useState<Record<number, string>>(() => ({
    [campers.length - 2]: "10/19/26, 7:10 PM",
    [campers.length - 1]: "10/19/26, 7:10 PM",
  }))
  const [exitPermitIndex, setExitPermitIndex] = React.useState<number | null>(null)
  const filtered = campers.filter(([name, , contact, phone]) => `${name} ${contact} ${phone}`.toLowerCase().includes(search.toLowerCase()))
  const handleTableAction = (event: React.MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof HTMLElement)) return
    const row = event.target.closest("tr") as HTMLTableRowElement | null
    if (!row) return
    const button = event.target.closest("button")
    if (!button) return
    if (button.textContent?.trim() === "Check in") {
      const camperName = row.querySelector("td")?.textContent?.trim().split("Age:")[0].trim()
      const camperIndex = campers.findIndex((camper) => camper[0] === camperName)
      if (camperIndex >= 0) { setCheckedInCampers((current) => new Set(current).add(camperIndex)); setRowStatuses((current) => ({ ...current, [camperIndex]: "Checked in" })) }
      return
    }
    if (button.textContent?.trim() !== "Issue exit permit") return
    const camperName = row.querySelector("td")?.textContent?.trim().split("Age:")[0].trim() ?? "this camper"
    const camperIndex = campers.findIndex((camper) => camper[0] === camperName)
    setExitPermitCamper(camperName)
    setExitPermitIndex(camperIndex)
  }
  return <main onClick={handleTableAction} className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6"><Tabs value={campus} onValueChange={setCampus} className="w-fit"><TabsList className="grid w-full max-w-md grid-cols-3"><TabsTrigger className="w-full" value="all">All camps</TabsTrigger><TabsTrigger className="w-full" value="mya">MYA</TabsTrigger><TabsTrigger className="w-full" value="myf">MYF</TabsTrigger></TabsList></Tabs><section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr]"><DonutCard title="Campers attendance" description="A summary of campers check in statuses." data={[{ name: "Online checked in", value: 370 }, { name: "Pending arrivals", value: 210 }, { name: "Walk in", value: 40 }]} centerValue="620" centerLabel="Registered" labels={["Online checked in:", "Pending arrivals:", "Walk in:"]} /><DonutCard title="Checked-in campers by gender" description="A summary of male and female campers on site." data={[{ name: "Male", value: 270 }, { name: "Female", value: 320 }]} centerValue="590" centerLabel="Present" labels={["Male:", "Female:"]} /><div className="md:col-span-2 xl:col-span-1"><QuickSummary /></div></section><section className="grid gap-4 lg:grid-cols-2"><Card className="flex flex-col shadow-none"><CardHeader><CardTitle className="text-base">Check-In online registrant</CardTitle><CardDescription>Lookup camper&apos;s name, M-Pesa code or phone number to instantly check them in.</CardDescription></CardHeader><CardContent className="mt-auto flex items-center gap-3"><div className="relative flex-1"><IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="border bg-muted/50 pl-10" placeholder="Search by name, phone, M-Pesa code" /></div><Button>Check in</Button></CardContent></Card><Card className="flex flex-col shadow-none"><CardHeader><CardTitle className="text-base">Walk-in registration</CardTitle><CardDescription>Capture full camper details. Walk-ins are auto-checked in as present upon payment verification.</CardDescription></CardHeader><CardContent className="mt-auto"><Button className="w-full">Open walk-in registration form</Button></CardContent></Card></section><Card className="shadow-none"><CardHeader className="gap-1"><CardTitle className="text-base">Camp roster &amp; status monitor</CardTitle><CardDescription>Manage attendees, filter by campus or status, or process early exit permits.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div className="relative max-w-md flex-1"><IconSearch className="absolute left-3 top-2.5 text-muted-foreground" /><Input className="border bg-muted/50 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, M-Pesa code" /></div><div className="flex gap-2"><Select defaultValue="all"><SelectTrigger className="w-36"><SelectValue placeholder="All campuses" /></SelectTrigger><SelectContent><SelectItem value="all">All campuses</SelectItem><SelectItem value="downtown">Downtown</SelectItem><SelectItem value="hill">Hill City</SelectItem></SelectContent></Select><Select defaultValue="all"><SelectTrigger className="w-32"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="registered">Registered</SelectItem><SelectItem value="checked-in">Checked in</SelectItem></SelectContent></Select></div></div><div className="overflow-x-auto rounded-lg border"><Table><TableHeader className="bg-muted/50"><TableRow><TableHead className="whitespace-nowrap">Camper</TableHead><TableHead className="whitespace-nowrap">Emergency contact</TableHead><TableHead className="whitespace-nowrap">Campus</TableHead><TableHead className="whitespace-nowrap">Status</TableHead><TableHead className="whitespace-nowrap">Medical condition</TableHead><TableHead className="whitespace-nowrap">Special needs</TableHead><TableHead className="whitespace-nowrap">Actions</TableHead><TableHead className="w-10">More</TableHead></TableRow></TableHeader><TableBody>{filtered.map((camper, index) => <TableRow key={`${camper[0]}-${index}`} className="hover:bg-muted/50"><TableCell className="whitespace-nowrap"><div className="font-medium">{camper[0]}</div><div className="text-muted-foreground">{camper[1]}</div></TableCell><TableCell className="whitespace-nowrap"><div>{camper[2]}</div><div className="text-muted-foreground">{camper[3]}</div></TableCell><TableCell className="whitespace-nowrap">{camper[4]}</TableCell><TableCell className="whitespace-nowrap"><Badge variant="outline" className={`whitespace-nowrap ${statusClass(rowStatuses[index] ?? (checkedOutCampers.has(index) ? "Checked out" : checkedInCampers.has(index) ? "Checked in" : camper[5]))}`}>{rowStatuses[index] ?? (checkedOutCampers.has(index) ? "Checked out" : checkedInCampers.has(index) ? "Checked in" : camper[5])}</Badge></TableCell><TableCell className="whitespace-nowrap">{camper[6]}</TableCell><TableCell className="whitespace-nowrap">{camper[7]}</TableCell><TableCell className="whitespace-nowrap">{(rowStatuses[index] ?? (checkedOutCampers.has(index) ? "Checked out" : checkedInCampers.has(index) ? "Checked in" : camper[5])) === "Registered" ? <Button type="button" className="bg-[#336699] text-white hover:bg-[#2b5985]">Check in</Button> : (rowStatuses[index] ?? (checkedOutCampers.has(index) ? "Checked out" : checkedInCampers.has(index) ? "Checked in" : camper[5])) === "Checked in" ? <Button type="button" variant="outline">Issue exit permit</Button> : <span className="text-sm text-muted-foreground">{exitPermitTimes[index] ?? ""}</span>}</TableCell><TableCell><RowActions
  onEdit={() => setEditCamper({ index, firstName: camper[0].split(" ")[0], lastName: camper[0].split(" ").slice(1).join(" "), age: camper[1].match(/Age: (\\d+)/)?.[1] ?? "", gender: camper[1].includes("Female") ? "Female" : "Male", phone: camper[3], baptized: "Yes", medical: false, specialNeeds: false, medicalDetails: camper[6] !== "-" ? camper[6] : "", specialNeedsDetails: "" })}
  status={rowStatuses[index] ?? (checkedOutCampers.has(index) ? "Checked out" : checkedInCampers.has(index) ? "Checked in" : camper[5])}
  onUndo={() => {
    setCheckedOutCampers((current) => { const next = new Set(current); next.delete(index); return next })
    setCheckedInCampers((current) => new Set(current).add(index))
    setRowStatuses((current) => ({ ...current, [index]: "Checked in" }))
    setExitPermitTimes((current) => { const next = { ...current }; delete next[index]; return next })
  }}
  onUndoCheckIn={() => {
    setCheckedInCampers((current) => { const next = new Set(current); next.delete(index); return next })
    setCheckedOutCampers((current) => { const next = new Set(current); next.delete(index); return next })
    setRowStatuses((current) => ({ ...current, [index]: "Registered" }))
    setExitPermitTimes((current) => { const next = { ...current }; delete next[index]; return next })
  }}
/></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
    <Dialog open={Boolean(editCamper)} onOpenChange={(open) => !open && setEditCamper(null)}>
      <DialogContent showCloseButton={false} className="gap-4 bg-background p-6 sm:max-w-4xl">
        <DialogHeader className="relative space-y-1 text-left"><DialogTitle className="text-base font-semibold leading-none tracking-tight">Edit camper details</DialogTitle><DialogDescription className="text-sm text-muted-foreground">Fill in your details as per your legal documents</DialogDescription><button type="button" aria-label="Close edit camper details" className="absolute right-0 top-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => setEditCamper(null)}><X /></button></DialogHeader>
        {editCamper && <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium">First name<Input className="bg-muted/40" value={editCamper.firstName} onChange={(event) => setEditCamper({ ...editCamper, firstName: event.target.value })} /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Last name<Input className="bg-muted/40" value={editCamper.lastName} onChange={(event) => setEditCamper({ ...editCamper, lastName: event.target.value })} /></label>
            <label className="flex flex-col gap-2 text-sm font-medium">Age<Input className="bg-muted/40" value={editCamper.age} onChange={(event) => setEditCamper({ ...editCamper, age: event.target.value })} /></label>
            <div className="flex flex-col gap-2 text-sm font-medium">Gender<div className="flex gap-2"><Button type="button" variant={editCamper.gender === "Male" ? "default" : "outline"} onClick={() => setEditCamper({ ...editCamper, gender: "Male" })}>Male</Button><Button type="button" variant={editCamper.gender === "Female" ? "default" : "outline"} onClick={() => setEditCamper({ ...editCamper, gender: "Female" })}>Female</Button></div></div>
            <label className="flex flex-col gap-2 text-sm font-medium">Phone number<Input className="bg-muted/40" value={editCamper.phone} onChange={(event) => setEditCamper({ ...editCamper, phone: event.target.value })} /></label>
            <div className="flex flex-col gap-2 text-sm font-medium">Want to be baptised?<div className="flex gap-2"><Button type="button" variant={editCamper.baptized === "Yes" ? "default" : "outline"} onClick={() => setEditCamper({ ...editCamper, baptized: "Yes" })}>Yes</Button><Button type="button" variant={editCamper.baptized === "No" ? "default" : "outline"} onClick={() => setEditCamper({ ...editCamper, baptized: "No" })}>No</Button></div></div>
          </div>
          <section className="pt-6"><h3 className="mb-3 text-base font-semibold">Medical and special needs</h3><div className="flex flex-col gap-4"><label className="flex cursor-pointer flex-col gap-2 rounded-2xl border bg-muted/30 p-4 text-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20"><span className="flex items-start gap-2 font-medium"><input type="radio" name="camper-medical" checked={editCamper.medical} onChange={() => undefined} onClick={() => setEditCamper({ ...editCamper, medical: !editCamper.medical })} className="mt-0.5 size-4 accent-primary" />Medical condition / Severe allergies</span><span className="pl-6 text-muted-foreground">Check if this camper has acute health conditions requiring medical staff awareness.</span><span className={cn("grid overflow-hidden pl-0 pr-0 transition-[grid-template-rows,opacity] duration-300 ease-out", editCamper.medical ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><span className="flex min-h-0 flex-col gap-2 pt-2"><span className="font-medium">Specify medical condition (15 words)</span><textarea className="min-h-20 resize-none rounded-md border bg-background px-3 py-2 text-sm font-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" placeholder="e.g Asthma, Peanuts allergy, Epilepsy, Diabetes" value={editCamper.medicalDetails} onChange={(event) => setEditCamper({ ...editCamper, medicalDetails: event.target.value })} /></span></span></label><label className="flex cursor-pointer flex-col gap-2 rounded-2xl border bg-muted/30 p-4 text-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20"><span className="flex items-start gap-2 font-medium"><input type="radio" name="camper-special-needs" checked={editCamper.specialNeeds} onChange={() => undefined} onClick={() => setEditCamper({ ...editCamper, specialNeeds: !editCamper.specialNeeds })} className="mt-0.5 size-4 accent-primary" />Special needs / Accessibility support</span><span className="pl-6 text-muted-foreground">Check if this camper requires physical, sensory, or mobility accommodations.</span><span className={cn("grid overflow-hidden pl-0 pr-0 transition-[grid-template-rows,opacity] duration-300 ease-out", editCamper.specialNeeds ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><span className="flex min-h-0 flex-col gap-2 pt-2"><span className="font-medium">Specify special needs and accommodations (15 words)</span><textarea className="min-h-20 resize-none rounded-md border bg-background px-3 py-2 text-sm font-normal outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" placeholder="e.g Deaf, Autism spectrum, Anxiety" value={editCamper.specialNeedsDetails} onChange={(event) => setEditCamper({ ...editCamper, specialNeedsDetails: event.target.value })} /></span></span></label></div></section>
        </div>}
        <DialogFooter className="flex-row justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setEditCamper(null)}>Cancel</Button><Button type="button" onClick={() => setEditCamper(null)}>Save changes</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(exitPermitCamper)} onOpenChange={(open) => !open && setExitPermitCamper(null)}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="gap-3 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg"><AlertCircle className="text-destructive" data-icon="inline-start" />Issue early exit permit</DialogTitle>
          <DialogDescription>You are about to issue an official early exit permit for <strong className="text-foreground">{exitPermitCamper}</strong>. This will transition their status to <strong className="text-foreground">Checked out</strong></DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={() => { setExitPermitCamper(null); setExitPermitIndex(null) }}>Cancel</Button>
          <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { const camperIndex = exitPermitIndex; if (camperIndex === null) return; const issuedAt = new Date().toLocaleString([], { year: "2-digit", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" }); setCheckedInCampers((current) => { const next = new Set(current); next.delete(camperIndex); return next }); setCheckedOutCampers((current) => new Set(current).add(camperIndex)); setRowStatuses((current) => ({ ...current, [camperIndex]: "Checked out" })); setExitPermitTimes((current) => ({ ...current, [camperIndex]: issuedAt })); setExitPermitCamper(null); setExitPermitIndex(null) }}>Issue permit</Button>
        </DialogFooter>
        <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => { setExitPermitCamper(null); setExitPermitIndex(null) }} aria-label="Close"><X /></Button>
      </DialogContent>
    </Dialog>
  </main>
}
