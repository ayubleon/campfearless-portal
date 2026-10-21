"use client"

import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { IconChevronDown, IconDotsVertical, IconDownload, IconPrinter, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import { currentUser } from "@/lib/session"
import { campusesByNetwork } from "@/lib/campuses"
import { formatDateTime } from "@/lib/format"
import { statusClass } from "@/lib/status"
import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { Button, buttonVariants } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"

type Camper = {
  id: string
  name: string
  age: number
  gender: "Male" | "Female"
  phone: string
  camp: "MYF" | "MYA"
  campus: string
  contactName: string
  contactPhone: string
  status: "Registered" | "Checked in" | "Checked out"
  medical: string
  specialNeeds: string
  baptism: "Yes" | "No"
  payment: "Verified" | "Awaiting verification" | "Flagged" | "Waived"
  mpesaCode: string
  registration: "Online" | "Walk-in"
}

// Deterministic sample roster until registrations are real.
const firstNames = ["Amara", "Brian", "Cynthia", "Daniel", "Esther", "Felix", "Hannah", "Ibrahim", "Joy", "Kevin", "Lilian", "Moses", "Naomi", "Oscar", "Purity", "Quincy", "Ruth", "Samuel", "Tabitha", "Victor"]
const lastNames = ["Njeri", "Otieno", "Wambui", "Kiptoo", "Achieng", "Mwangi", "Kamau", "Hassan", "Atieno", "Mutua", "Chebet", "Kariuki"]
const allCampuses = Object.values(campusesByNetwork).flat().sort((a, b) => a.localeCompare(b))
const medicalSamples = ["-", "-", "-", "Asthmatic", "-", "Protein allergy", "-", "Epilepsy", "-", "Sinuses", "-", "-", "Anxiety"]
const needsSamples = ["-", "-", "-", "-", "Deaf", "-", "-", "Autism spectrum", "-", "-", "-", "Down syndrome", "-"]
const statuses: Camper["status"][] = ["Checked in", "Checked in", "Registered", "Checked in", "Registered", "Checked out", "Checked in"]

const roster: Camper[] = Array.from({ length: 38 }, (_, index) => {
  const camp: Camper["camp"] = index % 3 === 0 ? "MYA" : "MYF"
  const last = lastNames[(index * 5) % lastNames.length]
  const paymentStates: Camper["payment"][] = ["Verified", "Verified", "Awaiting verification", "Verified", "Flagged", "Verified", "Awaiting verification"]
  const payment: Camper["payment"] = index % 9 === 4 ? "Waived" : paymentStates[index % paymentStates.length]
  return {
    id: `c${index + 1}`,
    name: `${firstNames[index % firstNames.length]} ${last}`,
    age: camp === "MYF" ? 14 + (index % 4) : 18 + (index % 9),
    gender: index % 2 === 0 ? "Female" : "Male",
    phone: `07${String(10000000 + index * 7919).slice(0, 8)}`,
    camp,
    campus: allCampuses[(index * 7) % allCampuses.length],
    contactName: `${["Grace", "Peter", "Mercy", "Samuel", "Rose", "Lucy", "David", "Fatuma"][index % 8]} ${last}`,
    contactPhone: `07${String(20000000 + index * 6151).slice(0, 8)}`,
    status: statuses[index % statuses.length],
    medical: medicalSamples[index % medicalSamples.length],
    specialNeeds: needsSamples[index % needsSamples.length],
    baptism: index % 4 === 1 ? "Yes" : "No",
    payment,
    mpesaCode: payment !== "Waived" ? `QJ${String(index * 104729).padStart(8, "0").slice(0, 8)}` : "",
    registration: index % 5 === 2 ? "Walk-in" : "Online",
  }
})

const columns = [
  { id: "contact", label: "Emergency contact" },
  { id: "camp", label: "Camp" },
  { id: "campus", label: "Campus" },
  { id: "status", label: "Status" },
  { id: "payment", label: "Payment" },
  { id: "mpesaCode", label: "M-Pesa code" },
  { id: "medical", label: "Medical condition" },
  { id: "specialNeeds", label: "Special needs" },
  { id: "baptism", label: "Baptism" },
] as const
type ColumnId = (typeof columns)[number]["id"]
const defaultColumns: ColumnId[] = ["contact", "camp", "campus", "status", "medical", "specialNeeds", "baptism"]

type Filters = { camp: string; gender: string; campus: string; payment: string; status: string; registration: string; template: string }
const emptyFilters: Filters = { camp: "all", gender: "all", campus: "all", payment: "all", status: "all", registration: "all", template: "none" }

// Templates set filters and columns for the lists people print most often.
const templates: { id: string; label: string; filters: Partial<Filters>; columns: ColumnId[]; match?: (camper: Camper) => boolean }[] = [
  { id: "medical", label: "Medical and special needs", filters: {}, columns: ["contact", "camp", "campus", "medical", "specialNeeds"], match: (camper) => camper.medical !== "-" || camper.specialNeeds !== "-" },
  { id: "baptism", label: "Baptism candidates", filters: {}, columns: ["camp", "campus", "baptism"], match: (camper) => camper.baptism === "Yes" },
  { id: "not-arrived", label: "Not yet checked in", filters: { status: "Registered" }, columns: ["contact", "camp", "campus", "status", "payment"] },
  { id: "waived", label: "Waived campers", filters: { payment: "Waived" }, columns: ["camp", "campus", "status", "payment"] },
  { id: "flagged-payments", label: "Flagged payments", filters: { payment: "Flagged" }, columns: ["contact", "camp", "campus", "payment", "mpesaCode"] },
]

function FilterSelect({ value, onChange, label, all, options, width = "w-36" }: { value: string; onChange: (value: string) => void; label: string; all: string; options: string[]; width?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={width} aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function autoTitle(filters: Filters) {
  const template = templates.find((item) => item.id === filters.template)
  const parts = [
    filters.camp === "all" ? "All camps" : filters.camp,
    filters.gender !== "all" && filters.gender.toLowerCase(),
    filters.campus !== "all" && `at ${filters.campus}`,
    filters.registration !== "all" && filters.registration.toLowerCase(),
    filters.payment !== "all" && filters.payment.toLowerCase(),
    filters.status !== "all" && filters.status.toLowerCase(),
    template && `· ${template.label.toLowerCase()}`,
  ].filter(Boolean)
  return `${parts.join(" ")} 2026`
}

// Until sign-in exists, the signed-in user is hardcoded like the sidebar's.

function TitleCard({ title, onTitle, count, total, onPreview }: { title: string; onTitle: (value: string) => void; count: number; total: number; onPreview: () => void }) {
  return (
    <Card className="min-w-0 shadow-none print:hidden">
      <CardHeader>
        <CardTitle className="text-base">Report title</CardTitle>
        <CardDescription>Built from your filters. Edit it before printing.</CardDescription>
        <CardAction><Button type="button" disabled={count === 0} onClick={onPreview}><IconPrinter />Print report</Button></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Input className="max-w-md bg-muted/40" aria-label="Report title" value={title} onChange={(event) => onTitle(event.target.value)} />
        <p className="text-sm text-muted-foreground tabular-nums">{count} of {total} records</p>
      </CardContent>
    </Card>
  )
}

type PrintData = { title: string; camp: string; filters: string; columns: string[]; rows: string[][]; footer: string }

// The one document shown in the preview and sent to the printer.
function PrintDocument({ data }: { data: PrintData }) {
  const statusColumn = data.columns.indexOf("Status")
  return (
    <div className="flex flex-col gap-4 text-sm">
      <h2 className="text-base font-semibold">{data.title}</h2>
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-1.5"><dt className="font-medium">Camp:</dt><dd className="text-muted-foreground">{data.camp}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Filters:</dt><dd className="text-muted-foreground">{data.filters}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Records:</dt><dd className="text-muted-foreground tabular-nums">{data.rows.length}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Generated by:</dt><dd className="text-muted-foreground">{currentUser.name}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Date:</dt><dd className="text-muted-foreground tabular-nums">{formatDateTime(new Date())}</dd></div>
      </dl>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>{data.columns.map((column) => <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, index) => (
              <TableRow key={index}>
                {row.map((cell, column) => {
                  const [first, second] = cell.split("\n")
                  return (
                    <TableCell key={column} className="whitespace-nowrap">
                      {column === statusColumn ? <Badge variant="outline" className={cn("whitespace-nowrap", statusClass(cell))}>{cell}</Badge> : (
                        <>
                          <div className={cn(column === 0 && "font-medium", first === "-" && "text-muted-foreground")}>{first}</div>
                          {second && <div className="text-muted-foreground tabular-nums">{second}</div>}
                        </>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground">{data.footer}</p>
    </div>
  )
}

function exportCsv(data: PrintData) {
  const quote = (value: string) => `"${value.replace(/\n/g, " ").replace(/"/g, '""')}"`
  const csv = [data.columns, ...data.rows].map((row) => row.map(quote).join(",")).join("\r\n")
  const link = document.createElement("a")
  link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }))
  link.download = `${data.title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  toast.success("Report successfully exported")
}

function PrintPreview({ open, data, onClose }: { open: boolean; data: PrintData; onClose: () => void }) {
  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 bg-background p-4 sm:max-w-6xl sm:p-6 print:hidden">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="text-base font-semibold leading-none tracking-tight">Print preview</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Check the report before you print it. This is exactly what the printer receives.</DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close print preview" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
          </DialogHeader>
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="-mx-4 min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6"><PrintDocument data={data} /></div>
            <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">
              <Button type="button" variant="outline" onClick={onClose}>Close</Button>
              <Button type="button" variant="outline" onClick={() => exportCsv(data)}><IconDownload />Export</Button>
              <Button type="button" onClick={() => window.print()}><IconPrinter />Print</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <div className="hidden print:block"><PrintDocument data={data} /></div>
    </>
  )
}

function describeFilters(pairs: [string, string][], query: string, template?: string) {
  const parts = [...pairs.filter(([, value]) => value !== "all").map(([label, value]) => `${label}: ${value}`), query.trim() !== "" && `Search: "${query.trim()}"`, template && `Template: ${template}`].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "None, all records"
}

function CampersReport() {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filters>(emptyFilters)
  const [visible, setVisible] = React.useState<ColumnId[]>(defaultColumns)
  const [title, setTitle] = React.useState(autoTitle(emptyFilters))
  const [titleEdited, setTitleEdited] = React.useState(false)

  const template = templates.find((item) => item.id === filters.template)
  const rows = roster.filter((camper) =>
    `${camper.name} ${camper.phone} ${camper.contactPhone} ${camper.mpesaCode}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (filters.camp === "all" || camper.camp === filters.camp) &&
    (filters.gender === "all" || camper.gender === filters.gender) &&
    (filters.campus === "all" || camper.campus === filters.campus) &&
    (filters.payment === "all" || camper.payment === filters.payment) &&
    (filters.status === "all" || camper.status === filters.status) &&
    (filters.registration === "all" || camper.registration === filters.registration) &&
    (!template?.match || template.match(camper)))

  const updateFilters = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    if (!titleEdited) setTitle(autoTitle(next))
  }
  const applyTemplate = (id: string) => {
    const chosen = templates.find((item) => item.id === id)
    if (!chosen) { updateFilters({ template: "none" }); setVisible(defaultColumns); return }
    updateFilters({ ...emptyFilters, camp: filters.camp, ...chosen.filters, template: id })
    setVisible(chosen.columns)
  }
  const reset = () => { setQuery(""); setFilters(emptyFilters); setVisible(defaultColumns); setTitle(autoTitle(emptyFilters)); setTitleEdited(false) }
  const show = (id: ColumnId) => visible.includes(id)
  const [previewing, setPreviewing] = React.useState(false)
  const cell = (camper: Camper, id: ColumnId) => ({ contact: `${camper.contactName}\n${camper.contactPhone}`, camp: camper.camp, campus: camper.campus, status: camper.status, payment: camper.payment, mpesaCode: camper.mpesaCode || "-", medical: camper.medical, specialNeeds: camper.specialNeeds, baptism: camper.baptism })[id]
  const shownColumns = columns.filter((column) => show(column.id))
  const printData: PrintData = {
    title: title,
    camp: filters.camp === "all" ? "All camps" : filters.camp,
    filters: describeFilters([["Camp", filters.camp], ["Gender", filters.gender], ["Campus", filters.campus], ["Payment", filters.payment], ["Status", filters.status], ["Registration", filters.registration]], query, template?.label),
    columns: ["Camper", ...shownColumns.map((column) => column.label)],
    rows: rows.map((camper) => [`${camper.name}\nAge: ${camper.age} - ${camper.gender}`, ...shownColumns.map((column) => cell(camper, column.id))]),
    footer: "Confidential. Contains personal data including minors. Handle under the Data Protection Act.",
  }

  return (
    <>
      <Card className="min-w-0 shadow-none print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Camp roster & status monitor</CardTitle>
          <CardDescription>Filter, review and print camper records.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="border bg-muted/50 pl-8" aria-label="Search by name, phone, M-Pesa code" placeholder="Search by name, phone, M-Pesa code" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect label="Camp" value={filters.camp} onChange={(camp) => updateFilters({ camp })} all="All camps" options={["MYF", "MYA"]} width="w-32" />
            <FilterSelect label="Gender" value={filters.gender} onChange={(gender) => updateFilters({ gender })} all="All genders" options={["Female", "Male"]} width="w-32" />
            <FilterSelect label="Campus" value={filters.campus} onChange={(campus) => updateFilters({ campus })} all="All campuses" options={allCampuses} width="w-40" />
            <FilterSelect label="Payment" value={filters.payment} onChange={(payment) => updateFilters({ payment })} all="All payments" options={["Verified", "Awaiting verification", "Flagged", "Waived"]} width="w-44" />
            <FilterSelect label="Status" value={filters.status} onChange={(status) => updateFilters({ status })} all="All statuses" options={["Registered", "Checked in", "Checked out"]} />
            <FilterSelect label="Registration" value={filters.registration} onChange={(registration) => updateFilters({ registration })} all="All registrations" options={["Online", "Walk-in"]} width="w-40" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filters.template} onValueChange={applyTemplate}>
              <SelectTrigger className="w-56" aria-label="Report template"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No report template</SelectItem>
                {templates.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-32 justify-between font-normal">Columns<IconChevronDown className="text-muted-foreground" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="min-w-48">
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem key={column.id} checked={show(column.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setVisible((current) => (checked ? columns.map((item) => item.id).filter((id) => id === column.id || current.includes(id)) : current.filter((id) => id !== column.id)))}>
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="outline" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <TitleCard title={title} onTitle={(value) => { setTitle(value); setTitleEdited(true) }} count={rows.length} total={roster.length} onPreview={() => setPreviewing(true)} />
      <PrintPreview open={previewing} data={printData} onClose={() => setPreviewing(false)} />

      <div className="overflow-x-auto rounded-lg border print:hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="whitespace-nowrap">Camper</TableHead>
              {show("contact") && <TableHead className="whitespace-nowrap">Emergency contact</TableHead>}
              {show("camp") && <TableHead className="whitespace-nowrap">Camp</TableHead>}
              {show("campus") && <TableHead className="whitespace-nowrap">Campus</TableHead>}
              {show("status") && <TableHead className="whitespace-nowrap">Status</TableHead>}
              {show("payment") && <TableHead className="whitespace-nowrap">Payment</TableHead>}
              {show("mpesaCode") && <TableHead className="whitespace-nowrap">M-Pesa code</TableHead>}
              {show("medical") && <TableHead className="whitespace-nowrap">Medical condition</TableHead>}
              {show("specialNeeds") && <TableHead className="whitespace-nowrap">Special needs</TableHead>}
              {show("baptism") && <TableHead className="whitespace-nowrap">Baptism</TableHead>}
              <TableHead className="w-10 print:hidden"><span className="sr-only">More actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((camper) => (
              <TableRow key={camper.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap"><div className="font-medium">{camper.name}</div><div className="text-muted-foreground">Age: {camper.age} - {camper.gender}</div></TableCell>
                {show("contact") && <TableCell className="whitespace-nowrap"><div>{camper.contactName}</div><div className="text-muted-foreground tabular-nums">{camper.contactPhone}</div></TableCell>}
                {show("camp") && <TableCell className="whitespace-nowrap">{camper.camp}</TableCell>}
                {show("campus") && <TableCell className="whitespace-nowrap">{camper.campus}</TableCell>}
                {show("status") && <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(camper.status))}>{camper.status}</Badge></TableCell>}
                {show("payment") && <TableCell className="whitespace-nowrap">{camper.payment}</TableCell>}
                {show("mpesaCode") && <TableCell className={cn("whitespace-nowrap tabular-nums", !camper.mpesaCode && "text-muted-foreground")}>{camper.mpesaCode || "-"}</TableCell>}
                {show("medical") && <TableCell className={cn("whitespace-nowrap", camper.medical === "-" && "text-muted-foreground")}>{camper.medical}</TableCell>}
                {show("specialNeeds") && <TableCell className={cn("whitespace-nowrap", camper.specialNeeds === "-" && "text-muted-foreground")}>{camper.specialNeeds}</TableCell>}
                {show("baptism") && <TableCell className="whitespace-nowrap">{camper.baptism}</TableCell>}
                <TableCell className="whitespace-nowrap print:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="More actions"><IconDotsVertical /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
                      <DropdownMenuItem asChild><Link href={`/audit-log?q=${encodeURIComponent(camper.name)}`}>View activity</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={visible.length + 2} className="h-24 text-center text-muted-foreground">No campers match these filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

type Facilitator = {
  id: string
  name: string
  age: number
  gender: "Male" | "Female"
  phone: string
  team: string
  camp: "MYF" | "MYA"
  campus: string
  contactName: string
  contactPhone: string
  status: "Registered" | "Checked in" | "Checked out"
  medical: string
  specialNeeds: string
  payment: "Paid" | "Waived"
}

// Facilitator teams are the roles that can't sign in (Users and roles). Facilitators pay the shared fee.
const teamNames = ["Kitchen crew", "Security", "Media team", "Worship team"]
const facilitatorRoster: Facilitator[] = Array.from({ length: 24 }, (_, index) => {
  const last = lastNames[(index * 7 + 3) % lastNames.length]
  return {
    id: `f${index + 1}`,
    name: `${firstNames[(index * 3 + 5) % firstNames.length]} ${last}`,
    age: 20 + (index % 15),
    gender: index % 3 === 1 ? "Male" : index % 2 === 0 ? "Female" : "Male",
    phone: `07${String(30000000 + index * 5303).slice(0, 8)}`,
    team: teamNames[index % teamNames.length],
    camp: index % 2 === 0 ? "MYF" : "MYA",
    campus: allCampuses[(index * 5 + 2) % allCampuses.length],
    contactName: `${["Joseph", "Agnes", "Daniel", "Beatrice", "Stephen", "Lydia"][index % 6]} ${last}`,
    contactPhone: `07${String(40000000 + index * 4421).slice(0, 8)}`,
    status: statuses[(index + 2) % statuses.length],
    medical: medicalSamples[(index + 3) % medicalSamples.length],
    specialNeeds: needsSamples[(index + 5) % needsSamples.length],
    payment: index % 11 === 6 ? "Waived" : "Paid",
  }
})

type FacilitatorFilters = { camp: string; gender: string; campus: string; team: string; status: string; payment: string; template: string }
const emptyFacilitatorFilters: FacilitatorFilters = { camp: "all", gender: "all", campus: "all", team: "all", status: "all", payment: "all", template: "none" }
const facilitatorColumns = [
  { id: "contact", label: "Emergency contact" },
  { id: "team", label: "Team" },
  { id: "camp", label: "Camp" },
  { id: "campus", label: "Campus" },
  { id: "status", label: "Status" },
  { id: "payment", label: "Payment" },
  { id: "medical", label: "Medical condition" },
  { id: "specialNeeds", label: "Special needs" },
] as const
type FacilitatorColumnId = (typeof facilitatorColumns)[number]["id"]
const defaultFacilitatorColumns: FacilitatorColumnId[] = ["contact", "team", "camp", "campus", "status", "medical", "specialNeeds"]
const facilitatorTemplates: { id: string; label: string; filters: Partial<FacilitatorFilters>; columns: FacilitatorColumnId[]; match?: (facilitator: Facilitator) => boolean }[] = [
  { id: "medical", label: "Medical and special needs", filters: {}, columns: ["contact", "team", "camp", "medical", "specialNeeds"], match: (facilitator) => facilitator.medical !== "-" || facilitator.specialNeeds !== "-" },
  { id: "not-arrived", label: "Not yet checked in", filters: { status: "Registered" }, columns: ["contact", "team", "camp", "status"] },
]

function facilitatorTitle(filters: FacilitatorFilters) {
  const template = facilitatorTemplates.find((item) => item.id === filters.template)
  const parts = [
    filters.camp === "all" ? "All camps" : filters.camp,
    "facilitators",
    filters.team !== "all" && `· ${filters.team.toLowerCase()}`,
    filters.gender !== "all" && filters.gender.toLowerCase(),
    filters.campus !== "all" && `at ${filters.campus}`,
    filters.payment !== "all" && filters.payment.toLowerCase(),
    filters.status !== "all" && filters.status.toLowerCase(),
    template && `· ${template.label.toLowerCase()}`,
  ].filter(Boolean)
  return `${parts.join(" ")} 2026`
}

function FacilitatorsReport() {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<FacilitatorFilters>(emptyFacilitatorFilters)
  const [visible, setVisible] = React.useState<FacilitatorColumnId[]>(defaultFacilitatorColumns)
  const [title, setTitle] = React.useState(facilitatorTitle(emptyFacilitatorFilters))
  const [titleEdited, setTitleEdited] = React.useState(false)

  const template = facilitatorTemplates.find((item) => item.id === filters.template)
  const rows = facilitatorRoster.filter((facilitator) =>
    `${facilitator.name} ${facilitator.phone} ${facilitator.contactPhone}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (filters.camp === "all" || facilitator.camp === filters.camp) &&
    (filters.gender === "all" || facilitator.gender === filters.gender) &&
    (filters.campus === "all" || facilitator.campus === filters.campus) &&
    (filters.team === "all" || facilitator.team === filters.team) &&
    (filters.status === "all" || facilitator.status === filters.status) &&
    (filters.payment === "all" || facilitator.payment === filters.payment) &&
    (!template?.match || template.match(facilitator)))

  const updateFilters = (patch: Partial<FacilitatorFilters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    if (!titleEdited) setTitle(facilitatorTitle(next))
  }
  const applyTemplate = (id: string) => {
    const chosen = facilitatorTemplates.find((item) => item.id === id)
    if (!chosen) { updateFilters({ template: "none" }); setVisible(defaultFacilitatorColumns); return }
    updateFilters({ ...emptyFacilitatorFilters, camp: filters.camp, ...chosen.filters, template: id })
    setVisible(chosen.columns)
  }
  const reset = () => { setQuery(""); setFilters(emptyFacilitatorFilters); setVisible(defaultFacilitatorColumns); setTitle(facilitatorTitle(emptyFacilitatorFilters)); setTitleEdited(false) }
  const show = (id: FacilitatorColumnId) => visible.includes(id)
  const [previewing, setPreviewing] = React.useState(false)
  const cell = (facilitator: Facilitator, id: FacilitatorColumnId) => ({ contact: `${facilitator.contactName}\n${facilitator.contactPhone}`, team: facilitator.team, camp: facilitator.camp, campus: facilitator.campus, status: facilitator.status, payment: facilitator.payment, medical: facilitator.medical, specialNeeds: facilitator.specialNeeds })[id]
  const shownColumns = facilitatorColumns.filter((column) => show(column.id))
  const printData: PrintData = {
    title: title,
    camp: filters.camp === "all" ? "All camps" : filters.camp,
    filters: describeFilters([["Camp", filters.camp], ["Team", filters.team], ["Gender", filters.gender], ["Campus", filters.campus], ["Payment", filters.payment], ["Status", filters.status]], query, template?.label),
    columns: ["Facilitator", ...shownColumns.map((column) => column.label)],
    rows: rows.map((facilitator) => [`${facilitator.name}\nAge: ${facilitator.age} - ${facilitator.gender}`, ...shownColumns.map((column) => cell(facilitator, column.id))]),
    footer: "Confidential. Contains personal data. Handle under the Data Protection Act.",
  }

  return (
    <>
      <Card className="min-w-0 shadow-none print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Facilitator roster & status monitor</CardTitle>
          <CardDescription>Filter, review and print facilitator records by team.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="border bg-muted/50 pl-8" aria-label="Search by name, phone" placeholder="Search by name, phone" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterSelect label="Camp" value={filters.camp} onChange={(camp) => updateFilters({ camp })} all="All camps" options={["MYF", "MYA"]} width="w-32" />
            <FilterSelect label="Team" value={filters.team} onChange={(team) => updateFilters({ team })} all="All facilitators" options={teamNames} width="w-40" />
            <FilterSelect label="Gender" value={filters.gender} onChange={(gender) => updateFilters({ gender })} all="All genders" options={["Female", "Male"]} width="w-32" />
            <FilterSelect label="Campus" value={filters.campus} onChange={(campus) => updateFilters({ campus })} all="All campuses" options={allCampuses} width="w-40" />
            <FilterSelect label="Payment" value={filters.payment} onChange={(payment) => updateFilters({ payment })} all="All payments" options={["Paid", "Waived"]} />
            <FilterSelect label="Status" value={filters.status} onChange={(status) => updateFilters({ status })} all="All statuses" options={["Registered", "Checked in", "Checked out"]} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filters.template} onValueChange={applyTemplate}>
              <SelectTrigger className="w-56" aria-label="Report template"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No report template</SelectItem>
                {facilitatorTemplates.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-32 justify-between font-normal">Columns<IconChevronDown className="text-muted-foreground" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="min-w-48">
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {facilitatorColumns.map((column) => (
                  <DropdownMenuCheckboxItem key={column.id} checked={show(column.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setVisible((current) => (checked ? facilitatorColumns.map((item) => item.id).filter((id) => id === column.id || current.includes(id)) : current.filter((id) => id !== column.id)))}>
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="outline" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <TitleCard title={title} onTitle={(value) => { setTitle(value); setTitleEdited(true) }} count={rows.length} total={facilitatorRoster.length} onPreview={() => setPreviewing(true)} />
      <PrintPreview open={previewing} data={printData} onClose={() => setPreviewing(false)} />

      <div className="overflow-x-auto rounded-lg border print:hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="whitespace-nowrap">Facilitator</TableHead>
              {show("contact") && <TableHead className="whitespace-nowrap">Emergency contact</TableHead>}
              {show("team") && <TableHead className="whitespace-nowrap">Team</TableHead>}
              {show("camp") && <TableHead className="whitespace-nowrap">Camp</TableHead>}
              {show("campus") && <TableHead className="whitespace-nowrap">Campus</TableHead>}
              {show("status") && <TableHead className="whitespace-nowrap">Status</TableHead>}
              {show("payment") && <TableHead className="whitespace-nowrap">Payment</TableHead>}
              {show("medical") && <TableHead className="whitespace-nowrap">Medical condition</TableHead>}
              {show("specialNeeds") && <TableHead className="whitespace-nowrap">Special needs</TableHead>}
              <TableHead className="w-10 print:hidden"><span className="sr-only">More actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((facilitator) => (
              <TableRow key={facilitator.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap"><div className="font-medium">{facilitator.name}</div><div className="text-muted-foreground">Age: {facilitator.age} - {facilitator.gender}</div></TableCell>
                {show("contact") && <TableCell className="whitespace-nowrap"><div>{facilitator.contactName}</div><div className="text-muted-foreground tabular-nums">{facilitator.contactPhone}</div></TableCell>}
                {show("team") && <TableCell className="whitespace-nowrap">{facilitator.team}</TableCell>}
                {show("camp") && <TableCell className="whitespace-nowrap">{facilitator.camp}</TableCell>}
                {show("campus") && <TableCell className="whitespace-nowrap">{facilitator.campus}</TableCell>}
                {show("status") && <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(facilitator.status))}>{facilitator.status}</Badge></TableCell>}
                {show("payment") && <TableCell className="whitespace-nowrap">{facilitator.payment}</TableCell>}
                {show("medical") && <TableCell className={cn("whitespace-nowrap", facilitator.medical === "-" && "text-muted-foreground")}>{facilitator.medical}</TableCell>}
                {show("specialNeeds") && <TableCell className={cn("whitespace-nowrap", facilitator.specialNeeds === "-" && "text-muted-foreground")}>{facilitator.specialNeeds}</TableCell>}
                <TableCell className="whitespace-nowrap print:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="More actions"><IconDotsVertical /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
                      <DropdownMenuItem asChild><Link href={`/audit-log?q=${encodeURIComponent(facilitator.name)}`}>View activity</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={visible.length + 2} className="h-24 text-center text-muted-foreground">No facilitators match these filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

export function ReportsScreen() {
  const [kind, setKind] = React.useState("campers")

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6 print:p-0">
      <Tabs value={kind} onValueChange={setKind} className="w-fit print:hidden">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger className="w-full" value="campers">Campers</TabsTrigger>
          <TabsTrigger className="w-full" value="facilitators">Facilitators</TabsTrigger>
        </TabsList>
      </Tabs>
      {kind === "campers" ? <CampersReport /> : <FacilitatorsReport />}
    </main>
  )
}
