"use client"

import { useSession } from "@/components/session-provider"
import { toCsv } from "@/lib/csv"
import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { IconChevronDown, IconDotsVertical, IconDownload, IconPrinter, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import { SortableHead } from "@/components/sortable-head"
import { byNumber, byRank, byText, useSortedRows } from "@/lib/sort"
import { currentUser } from "@/lib/session"
import { campusLabel, filterCampuses, invitedCampus } from "@/lib/campuses"
import { campers, facilitators as facilitatorRecords, facilitatorTeams, fullName, paymentOf } from "@/lib/records"
import { campRecord } from "@/lib/camp-data"
import { currentEditionIds, editionLabel, editionRank, editions, editionTitle } from "@/lib/editions"
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
  church: string
  contactName: string
  contactPhone: string
  status: "Registered" | "Checked in" | "Checked out"
  medical: string
  specialNeeds: string
  baptism: "Yes" | "No"
  payment: "Verified" | "Awaiting verification" | "Flagged" | "Waived"
  mpesaCode: string
  registration: "Online" | "Walk-in"
  edition: string
}

const paymentLabel = { pending: "Awaiting verification", verified: "Verified", flagged: "Flagged" } as const
const dash = (value: string) => value || "-"

const buildRoster = (): Camper[] => campers.map((record) => {
  const payment = paymentOf(record)
  return {
    id: record.id,
    name: fullName(record),
    age: record.age,
    gender: record.gender,
    phone: record.phone,
    camp: record.camp,
    campus: record.campus,
    church: record.church,
    contactName: fullName(record.contact),
    contactPhone: record.contact.phone,
    status: record.status,
    medical: dash(record.medical),
    specialNeeds: dash(record.specialNeeds),
    baptism: record.baptised ? "Yes" : "No",
    payment: record.waiver ? "Waived" : payment ? paymentLabel[payment.status] : "Waived",
    mpesaCode: payment?.code ?? "",
    registration: record.channel,
    edition: record.editionId,
  }
})

const columns = [
  { id: "phone", label: "Phone number" },
  { id: "contact", label: "Emergency contact" },
  { id: "camp", label: "Camp" },
  { id: "campus", label: "Campus" },
  { id: "church", label: "Church or organisation" },
  { id: "status", label: "Status" },
  { id: "payment", label: "Payment" },
  { id: "mpesaCode", label: "M-Pesa code" },
  { id: "medical", label: "Medical condition" },
  { id: "specialNeeds", label: "Special needs" },
  { id: "baptism", label: "Baptism" },
] as const
type ColumnId = (typeof columns)[number]["id"]
const defaultColumns: ColumnId[] = ["phone", "contact", "camp", "campus", "status", "medical", "specialNeeds", "baptism"]

type Filters = { camp: string; gender: string; campus: string; payment: string; status: string; registration: string; template: string; editions: string[] }
const emptyFilters: Filters = { camp: "all", gender: "all", campus: "all", payment: "all", status: "all", registration: "all", template: "none", editions: currentEditionIds }

// Templates set filters and columns for the lists people print most often.
const templates: { id: string; label: string; filters: Partial<Filters>; columns: ColumnId[]; match?: (camper: Camper) => boolean }[] = [
  { id: "medical", label: "Medical and special needs", filters: {}, columns: ["phone", "contact", "camp", "campus", "medical", "specialNeeds"], match: (camper) => camper.medical !== "-" || camper.specialNeeds !== "-" },
  { id: "baptism", label: "Baptism candidates", filters: {}, columns: ["camp", "campus", "baptism"], match: (camper) => camper.baptism === "Yes" },
  { id: "not-arrived", label: "Not yet checked in", filters: { status: "Registered" }, columns: ["phone", "contact", "camp", "campus", "status", "payment"] },
  { id: "waived", label: "Waived campers", filters: { payment: "Waived" }, columns: ["camp", "campus", "status", "payment"] },
  { id: "flagged-payments", label: "Flagged payments", filters: { payment: "Flagged" }, columns: ["phone", "contact", "camp", "campus", "payment", "mpesaCode"] },
]

function FilterSelect({ value, onChange, label, all, options, labelOf = (option) => option, width = "w-36" }: { value: string; onChange: (value: string) => void; label: string; all: string; options: string[]; labelOf?: (option: string) => string; width?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={width} aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{labelOf(option)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function EditionFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const allChosen = value.length === editions.length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" aria-label="Edition" className="w-40 justify-between font-normal"><span className="min-w-0 truncate">{editionTitle(value)}</span><IconChevronDown className="text-muted-foreground" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-48">
        <DropdownMenuLabel>Show editions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={allChosen} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => onChange(checked ? editions.map((edition) => edition.id) : currentEditionIds)}>All editions</DropdownMenuCheckboxItem>
        {editions.map((edition) => (
          <DropdownMenuCheckboxItem key={edition.id} checked={value.includes(edition.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => { const next = checked ? [...value, edition.id] : value.filter((id) => id !== edition.id); if (next.length > 0) onChange(next) }}>
            {edition.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function autoTitle(filters: Filters) {
  const template = templates.find((item) => item.id === filters.template)
  const parts = [
    filters.camp === "all" ? "All camps" : filters.camp,
    filters.gender !== "all" && filters.gender.toLowerCase(),
    filters.campus !== "all" && (filters.campus === invitedCampus ? "from outside Mavuno" : `at ${filters.campus}`),
    filters.registration !== "all" && filters.registration.toLowerCase(),
    filters.payment !== "all" && filters.payment.toLowerCase(),
    filters.status !== "all" && filters.status.toLowerCase(),
    template && `· ${template.label.toLowerCase()}`,
  ].filter(Boolean)
  return `${parts.join(" ")} ${editionTitle(filters.editions)}`
}

// Until sign-in exists, the signed-in user is hardcoded like the sidebar's.

function TitleCard({ title, onTitle, count, total, onPreview, children }: { title: string; onTitle: (value: string) => void; count: number; total: number; onPreview: () => void; children?: React.ReactNode }) {
  const { can } = useSession()
  return (
    <Card className="min-w-0 shadow-none print:hidden">
      <CardHeader>
        <CardTitle className="text-base">Report title</CardTitle>
        <CardDescription>Built from your filters. Edit it before printing.</CardDescription>
        {can("print-records") && <CardAction><Button type="button" disabled={count === 0} onClick={onPreview}><IconPrinter />Print report</Button></CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <Input className="max-w-md bg-muted/40" aria-label="Report title" value={title} onChange={(event) => onTitle(event.target.value)} />
          <p className="text-sm text-muted-foreground tabular-nums">{count} of {total} records</p>
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </CardContent>
    </Card>
  )
}

type PrintData = { title: string; camp: string; filters: string; columns: string[]; rows: string[][]; footer: string }

// The one document shown in the preview and sent to the printer.
function PrintDocument({ data }: { data: PrintData }) {
  const statusColumn = data.columns.indexOf("Status")
  return (
    <div className="flex flex-col gap-4 text-sm print:text-xs">
      <h2 className="text-base font-semibold">{data.title}</h2>
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-1.5"><dt className="font-medium">Camp:</dt><dd className="text-muted-foreground">{data.camp}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Filters:</dt><dd className="text-muted-foreground">{data.filters}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Records:</dt><dd className="text-muted-foreground tabular-nums">{data.rows.length}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Generated by:</dt><dd className="text-muted-foreground">{currentUser.name}</dd></div>
        <div className="flex gap-1.5"><dt className="font-medium">Date:</dt><dd className="text-muted-foreground tabular-nums">{formatDateTime(new Date())}</dd></div>
      </dl>
      <div className="overflow-x-auto rounded-lg border print:overflow-visible">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>{data.columns.map((column) => <TableHead key={column} className="whitespace-nowrap print:whitespace-normal">{column}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, index) => (
              <TableRow key={index}>
                {row.map((cell, column) => {
                  const [first, second] = cell.split("\n")
                  return (
                    <TableCell key={column} className="whitespace-nowrap print:whitespace-normal">
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
  const csv = toCsv(data.columns, data.rows)
  const link = document.createElement("a")
  link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }))
  link.download = `${data.title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  toast.success("Report successfully exported")
}

function PrintPreview({ open, data, onClose }: { open: boolean; data: PrintData; onClose: () => void }) {
  const { can } = useSession()
  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 bg-background p-4 sm:max-w-6xl sm:p-6 print:hidden">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="text-base font-bold leading-none tracking-tight">Print preview</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Check the report before you print it. Long values wrap onto a second line on paper.</DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close print preview" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
          </DialogHeader>
          <div className="flex min-h-0 min-w-0 flex-col">
            {data.columns.length > 6 && <p className="pb-2 text-sm text-muted-foreground">Wide report. Choose Landscape in the print dialog for the best fit.</p>}
            <div className="-mx-4 min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6"><PrintDocument data={data} /></div>
            <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">
              <Button type="button" variant="outline" onClick={onClose}>Close</Button>
              {can("export-records") && <Button type="button" variant="outline" onClick={() => exportCsv(data)}><IconDownload />Export</Button>}
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
  const roster = React.useMemo(buildRoster, [])
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<Filters>(emptyFilters)
  const [visible, setVisible] = React.useState<ColumnId[]>(defaultColumns)
  const [title, setTitle] = React.useState(autoTitle(emptyFilters))
  const [titleEdited, setTitleEdited] = React.useState(false)

  const template = templates.find((item) => item.id === filters.template)
  const rows = roster.filter((camper) =>
    `${camper.name} ${camper.phone} ${camper.contactPhone} ${camper.mpesaCode}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    filters.editions.includes(camper.edition) &&
    (filters.camp === "all" || camper.camp === filters.camp) &&
    (filters.gender === "all" || camper.gender === filters.gender) &&
    (filters.campus === "all" || camper.campus === filters.campus) &&
    (filters.payment === "all" || camper.payment === filters.payment) &&
    (filters.status === "all" || camper.status === filters.status) &&
    (filters.registration === "all" || camper.registration === filters.registration) &&
    (!template?.match || template.match(camper)))

  // Heading clicks sort the list, and the preview, the printout and the CSV follow it. Default: A to Z by first name.
  const hasNote = (value: string) => (value !== "-" ? 0 : 1)
  const statusRank = byRank(["Registered", "Checked in", "Checked out"])
  const paymentRank = byRank(["Flagged", "Awaiting verification", "Verified", "Waived"])
  const { rows: sortedRows, sort, toggle } = useSortedRows<Camper>(
    rows,
    {
      camper: (a, b) => byText(a.name, b.name),
      contact: (a, b) => byText(a.contactName, b.contactName),
      camp: (a, b) => byText(a.camp, b.camp),
      campus: (a, b) => byText(a.campus, b.campus),
      church: (a, b) => byText(a.church || "~", b.church || "~"),
      edition: (a, b) => editionRank(a.edition) - editionRank(b.edition),
      status: (a, b) => statusRank(a.status, b.status),
      payment: (a, b) => paymentRank(a.payment, b.payment),
      mpesaCode: (a, b) => byText(a.mpesaCode || "~", b.mpesaCode || "~"),
      medical: (a, b) => hasNote(a.medical) - hasNote(b.medical) || byText(a.medical, b.medical),
      specialNeeds: (a, b) => hasNote(a.specialNeeds) - hasNote(b.specialNeeds) || byText(a.specialNeeds, b.specialNeeds),
      baptism: (a, b) => byRank(["Yes", "No"])(a.baptism, b.baptism),
    },
    (a, b) => byText(a.name, b.name)
  )

  const updateFilters = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    if (!titleEdited) setTitle(autoTitle(next))
  }
  const applyTemplate = (id: string) => {
    const chosen = templates.find((item) => item.id === id)
    if (!chosen) { updateFilters({ template: "none" }); setVisible(defaultColumns); return }
    updateFilters({ ...emptyFilters, camp: filters.camp, editions: filters.editions, ...chosen.filters, template: id })
    setVisible(chosen.columns)
  }
  const reset = () => { setQuery(""); setFilters(emptyFilters); setVisible(defaultColumns); setTitle(autoTitle(emptyFilters)); setTitleEdited(false) }
  const { can } = useSession()
  // Medical details and special needs are only for roles that may view them.
  const medicalHidden = (id: string) => !can("view-medical") && (id === "medical" || id === "specialNeeds")
  const show = (id: ColumnId) => visible.includes(id) && !medicalHidden(id)
  const multiEdition = filters.editions.length > 1
  const [previewing, setPreviewing] = React.useState(false)
  const cell = (camper: Camper, id: ColumnId) => ({ phone: camper.phone || "-", contact: `${camper.contactName}\n${camper.contactPhone}`, camp: camper.camp, campus: campusLabel(camper.campus), church: camper.church || "-", status: camper.status, payment: camper.payment, mpesaCode: camper.mpesaCode || "-", medical: camper.medical, specialNeeds: camper.specialNeeds, baptism: camper.baptism })[id]
  const shownColumns = columns.filter((column) => show(column.id))
  const printData: PrintData = {
    title: title,
    camp: filters.camp === "all" ? "All camps" : filters.camp,
    filters: describeFilters([["Edition", editionTitle(filters.editions)], ["Camp", filters.camp], ["Gender", filters.gender], ["Campus", filters.campus], ["Payment", filters.payment], ["Status", filters.status], ["Registration", filters.registration]], query, template?.label),
    columns: ["Camper", ...(multiEdition ? ["Edition"] : []), ...shownColumns.map((column) => column.label)],
    rows: sortedRows.map((camper) => [`${camper.name}\nAge: ${camper.age} - ${camper.gender}`, ...(multiEdition ? [editionLabel(camper.edition)] : []), ...shownColumns.map((column) => cell(camper, column.id))]),
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
            <EditionFilter value={filters.editions} onChange={(editions) => updateFilters({ editions })} />
            <FilterSelect label="Camp" value={filters.camp} onChange={(camp) => updateFilters({ camp })} all="All camps" options={["MYF", "MYA"]} width="w-32" />
            <FilterSelect label="Campus" value={filters.campus} onChange={(campus) => updateFilters({ campus })} all="All campuses" options={filterCampuses()} labelOf={campusLabel} width="w-40" />
            <FilterSelect label="Status" value={filters.status} onChange={(status) => updateFilters({ status })} all="All statuses" options={["Registered", "Checked in", "Checked out"]} />
            <FilterSelect label="Payment" value={filters.payment} onChange={(payment) => updateFilters({ payment })} all="All payments" options={["Verified", "Awaiting verification", "Flagged", "Waived"]} width="w-44" />
            <FilterSelect label="Registration" value={filters.registration} onChange={(registration) => updateFilters({ registration })} all="All registrations" options={["Online", "Walk-in"]} width="w-40" />
            <FilterSelect label="Gender" value={filters.gender} onChange={(gender) => updateFilters({ gender })} all="All genders" options={["Female", "Male"]} width="w-32" />
            <Button type="button" variant="outline" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <TitleCard title={title} onTitle={(value) => { setTitle(value); setTitleEdited(true) }} count={rows.length} total={roster.length} onPreview={() => setPreviewing(true)}>
            <Select value={filters.template} onValueChange={applyTemplate}>
              <SelectTrigger className="w-56" aria-label="Report template"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No report template</SelectItem>
                {templates.filter((item) => can("view-medical") || item.id !== "medical").map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-32 justify-between font-normal">Columns<IconChevronDown className="text-muted-foreground" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="min-w-48">
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.filter((column) => !medicalHidden(column.id)).map((column) => (
                  <DropdownMenuCheckboxItem key={column.id} checked={show(column.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setVisible((current) => (checked ? columns.map((item) => item.id).filter((id) => id === column.id || current.includes(id)) : current.filter((id) => id !== column.id)))}>
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
      </TitleCard>
      <PrintPreview open={previewing} data={printData} onClose={() => setPreviewing(false)} />

      <div className="overflow-x-auto rounded-lg border print:hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <SortableHead label="Camper" sortKey="camper" sort={sort} onSort={toggle} />
              {multiEdition && <SortableHead label="Edition" sortKey="edition" sort={sort} onSort={toggle} />}
              {show("phone") && <TableHead className="whitespace-nowrap">Phone number</TableHead>}
              {show("contact") && <SortableHead label="Emergency contact" sortKey="contact" sort={sort} onSort={toggle} />}
              {show("camp") && <SortableHead label="Camp" sortKey="camp" sort={sort} onSort={toggle} />}
              {show("campus") && <SortableHead label="Campus" sortKey="campus" sort={sort} onSort={toggle} />}
              {show("church") && <SortableHead label="Church or organisation" sortKey="church" sort={sort} onSort={toggle} />}
              {show("status") && <SortableHead label="Status" sortKey="status" sort={sort} onSort={toggle} />}
              {show("payment") && <SortableHead label="Payment" sortKey="payment" sort={sort} onSort={toggle} />}
              {show("mpesaCode") && <SortableHead label="M-Pesa code" sortKey="mpesaCode" sort={sort} onSort={toggle} />}
              {show("medical") && <SortableHead label="Medical condition" sortKey="medical" sort={sort} onSort={toggle} />}
              {show("specialNeeds") && <SortableHead label="Special needs" sortKey="specialNeeds" sort={sort} onSort={toggle} />}
              {show("baptism") && <SortableHead label="Baptism" sortKey="baptism" sort={sort} onSort={toggle} />}
              <TableHead className="w-10 print:hidden"><span className="sr-only">More actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((camper) => (
              <TableRow key={camper.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap"><div className="font-medium">{camper.name}</div><div className="text-muted-foreground">Age: {camper.age} - {camper.gender}</div></TableCell>
                {multiEdition && <TableCell className="whitespace-nowrap">{editionLabel(camper.edition)}</TableCell>}
                {show("phone") && <TableCell className="whitespace-nowrap tabular-nums">{camper.phone || "-"}</TableCell>}
                {show("contact") && <TableCell className="whitespace-nowrap"><div>{camper.contactName}</div><div className="text-muted-foreground tabular-nums">{camper.contactPhone}</div></TableCell>}
                {show("camp") && <TableCell className="whitespace-nowrap">{camper.camp}</TableCell>}
                {show("campus") && <TableCell className="whitespace-nowrap">{campusLabel(camper.campus)}</TableCell>}
                {show("church") && <TableCell className={cn("whitespace-nowrap", !camper.church && "text-muted-foreground")}>{camper.church || "-"}</TableCell>}
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

const ageColumns = [
  { id: "phone", label: "Phone number" },
  { id: "gender", label: "Gender" },
  { id: "campus", label: "Campus" },
  { id: "camp", label: "Camp" },
] as const
type AgeColumnId = (typeof ageColumns)[number]["id"]
const defaultAgeColumns: AgeColumnId[] = ["phone", "gender", "campus", "camp"]

type AgeFilters = { camp: string; gender: string; campus: string; ageGroup: string; editions: string[] }
const emptyAgeFilters: AgeFilters = { camp: "all", gender: "all", campus: "all", ageGroup: "all", editions: currentEditionIds }
// The adult camp starts where MYA starts (Camp setup).
const adultAge = campRecord("MYA").ageMin
const ageGroups: { label: string; match: (age: number) => boolean }[] = [
  { label: `Under ${adultAge}`, match: (age) => age < adultAge },
  { label: `${adultAge} and over`, match: (age) => age >= adultAge },
]

function ageTitle(filters: AgeFilters) {
  const parts = [
    filters.camp === "all" ? "All camps" : filters.camp,
    filters.gender !== "all" && filters.gender.toLowerCase(),
    filters.campus !== "all" && (filters.campus === invitedCampus ? "from outside Mavuno" : `at ${filters.campus}`),
    filters.ageGroup !== "all" && filters.ageGroup.toLowerCase(),
    "· age and gender",
  ].filter(Boolean)
  return `${parts.join(" ")} ${editionTitle(filters.editions)}`
}

function AgeReport() {
  const roster = React.useMemo(buildRoster, [])
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<AgeFilters>(emptyAgeFilters)
  const [visible, setVisible] = React.useState<AgeColumnId[]>(defaultAgeColumns)
  const [title, setTitle] = React.useState(ageTitle(emptyAgeFilters))
  const [titleEdited, setTitleEdited] = React.useState(false)
  const [previewing, setPreviewing] = React.useState(false)

  const group = ageGroups.find((item) => item.label === filters.ageGroup)
  const rows = roster.filter((camper) =>
    camper.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    filters.editions.includes(camper.edition) &&
    (filters.camp === "all" || camper.camp === filters.camp) &&
    (filters.gender === "all" || camper.gender === filters.gender) &&
    (filters.campus === "all" || camper.campus === filters.campus) &&
    (!group || group.match(camper.age)))

  // Default: youngest first, then A to Z by first name.
  const { rows: sortedRows, sort, toggle } = useSortedRows<Camper>(
    rows,
    {
      camper: (a, b) => byText(a.name, b.name),
      age: (a, b) => byNumber(a.age, b.age),
      gender: (a, b) => byText(a.gender, b.gender),
      campus: (a, b) => byText(a.campus, b.campus),
      edition: (a, b) => editionRank(a.edition) - editionRank(b.edition),
      camp: (a, b) => byText(a.camp, b.camp),
    },
    (a, b) => byNumber(a.age, b.age) || byText(a.name, b.name)
  )

  const updateFilters = (patch: Partial<AgeFilters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    if (!titleEdited) setTitle(ageTitle(next))
  }
  const reset = () => { setQuery(""); setFilters(emptyAgeFilters); setVisible(defaultAgeColumns); setTitle(ageTitle(emptyAgeFilters)); setTitleEdited(false) }
  const show = (id: AgeColumnId) => visible.includes(id)
  const multiEdition = filters.editions.length > 1
  const shownColumns = ageColumns.filter((column) => show(column.id))
  const printData: PrintData = {
    title,
    camp: filters.camp === "all" ? "All camps" : filters.camp,
    filters: describeFilters([["Edition", editionTitle(filters.editions)], ["Camp", filters.camp], ["Gender", filters.gender], ["Campus", filters.campus], ["Age", filters.ageGroup]], query),
    columns: ["Camper", ...(multiEdition ? ["Edition"] : []), "Age", ...shownColumns.map((column) => column.label)],
    rows: sortedRows.map((camper) => [camper.name, ...(multiEdition ? [editionLabel(camper.edition)] : []), String(camper.age), ...shownColumns.map((column) => (column.id === "campus" ? campusLabel(camper.campus) : camper[column.id] || "-"))]),
    footer: "Confidential. Contains personal data including minors. Handle under the Data Protection Act.",
  }

  return (
    <>
      <Card className="min-w-0 shadow-none print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Age and gender</CardTitle>
          <CardDescription>List campers by age, gender, campus and camp.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="border bg-muted/50 pl-8" aria-label="Search by name" placeholder="Search by name" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <EditionFilter value={filters.editions} onChange={(editions) => updateFilters({ editions })} />
            <FilterSelect label="Camp" value={filters.camp} onChange={(camp) => updateFilters({ camp })} all="All camps" options={["MYF", "MYA"]} width="w-32" />
            <FilterSelect label="Age" value={filters.ageGroup} onChange={(ageGroup) => updateFilters({ ageGroup })} all="All ages" options={ageGroups.map((item) => item.label)} width="w-36" />
            <FilterSelect label="Campus" value={filters.campus} onChange={(campus) => updateFilters({ campus })} all="All campuses" options={filterCampuses()} labelOf={campusLabel} width="w-40" />
            <FilterSelect label="Gender" value={filters.gender} onChange={(gender) => updateFilters({ gender })} all="All genders" options={["Female", "Male"]} width="w-32" />
            <Button type="button" variant="outline" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <TitleCard title={title} onTitle={(value) => { setTitle(value); setTitleEdited(true) }} count={rows.length} total={roster.length} onPreview={() => setPreviewing(true)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="w-32 justify-between font-normal">Columns<IconChevronDown className="text-muted-foreground" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6} className="min-w-48">
            <DropdownMenuLabel>Show columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ageColumns.map((column) => (
              <DropdownMenuCheckboxItem key={column.id} checked={show(column.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setVisible((current) => (checked ? ageColumns.map((item) => item.id).filter((id) => id === column.id || current.includes(id)) : current.filter((id) => id !== column.id)))}>
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TitleCard>
      <PrintPreview open={previewing} data={printData} onClose={() => setPreviewing(false)} />

      <div className="overflow-x-auto rounded-lg border print:hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <SortableHead label="Camper" sortKey="camper" sort={sort} onSort={toggle} />
              {multiEdition && <SortableHead label="Edition" sortKey="edition" sort={sort} onSort={toggle} />}
              <SortableHead label="Age" sortKey="age" sort={sort} onSort={toggle} />
              {show("phone") && <TableHead className="whitespace-nowrap">Phone number</TableHead>}
              {show("gender") && <SortableHead label="Gender" sortKey="gender" sort={sort} onSort={toggle} />}
              {show("campus") && <SortableHead label="Campus" sortKey="campus" sort={sort} onSort={toggle} />}
              {show("camp") && <SortableHead label="Camp" sortKey="camp" sort={sort} onSort={toggle} />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((camper) => (
              <TableRow key={camper.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap font-medium">{camper.name}</TableCell>
                {multiEdition && <TableCell className="whitespace-nowrap">{editionLabel(camper.edition)}</TableCell>}
                <TableCell className="whitespace-nowrap tabular-nums">{camper.age}</TableCell>
                {show("phone") && <TableCell className="whitespace-nowrap tabular-nums">{camper.phone || "-"}</TableCell>}
                {show("gender") && <TableCell className="whitespace-nowrap">{camper.gender}</TableCell>}
                {show("campus") && <TableCell className="whitespace-nowrap">{campusLabel(camper.campus)}</TableCell>}
                {show("camp") && <TableCell className="whitespace-nowrap">{camper.camp}</TableCell>}
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
  camp: "MYF" | "MYA" | "Both" // chosen when registering: "Both" serves MYF and MYA
  campus: string
  contactName: string
  contactPhone: string
  status: "Registered" | "Checked in" | "Checked out"
  medical: string
  specialNeeds: string
  payment: "Verified" | "Awaiting verification" | "Flagged" | "Waived"
  mpesaCode: string
  edition: string
}

// Facilitator teams are the roles that can't sign in (Users and roles). Facilitators pay the shared fee.
const teamNames = facilitatorTeams
const facilitatorRoster: Facilitator[] = facilitatorRecords.map((record) => ({
  id: record.id,
  name: fullName(record),
  age: record.age,
  gender: record.gender,
  phone: record.phone,
  team: record.team,
  camp: record.camp,
  campus: record.campus,
  contactName: fullName(record.contact),
  contactPhone: record.contact.phone,
  status: record.status,
  medical: dash(record.medical),
  specialNeeds: dash(record.specialNeeds),
  payment: record.feeWaived ? "Waived" : paymentOf(record) ? paymentLabel[paymentOf(record)!.status] : "Waived",
  mpesaCode: paymentOf(record)?.code ?? "",
  edition: record.editionId,
}))

type FacilitatorFilters = { camp: string; gender: string; campus: string; team: string; status: string; payment: string; template: string; editions: string[] }
const emptyFacilitatorFilters: FacilitatorFilters = { camp: "all", gender: "all", campus: "all", team: "all", status: "all", payment: "all", template: "none", editions: currentEditionIds }
const facilitatorColumns = [
  { id: "phone", label: "Phone number" },
  { id: "contact", label: "Emergency contact" },
  { id: "team", label: "Team" },
  { id: "camp", label: "Camp" },
  { id: "campus", label: "Campus" },
  { id: "status", label: "Status" },
  { id: "payment", label: "Payment" },
  { id: "mpesaCode", label: "M-Pesa code" },
  { id: "medical", label: "Medical condition" },
  { id: "specialNeeds", label: "Special needs" },
] as const
type FacilitatorColumnId = (typeof facilitatorColumns)[number]["id"]
const defaultFacilitatorColumns: FacilitatorColumnId[] = ["phone", "contact", "team", "camp", "campus", "status", "medical", "specialNeeds"]
const facilitatorTemplates: { id: string; label: string; filters: Partial<FacilitatorFilters>; columns: FacilitatorColumnId[]; match?: (facilitator: Facilitator) => boolean }[] = [
  { id: "medical", label: "Medical and special needs", filters: {}, columns: ["phone", "contact", "team", "camp", "medical", "specialNeeds"], match: (facilitator) => facilitator.medical !== "-" || facilitator.specialNeeds !== "-" },
  { id: "not-arrived", label: "Not yet checked in", filters: { status: "Registered" }, columns: ["phone", "contact", "team", "camp", "status"] },
  { id: "flagged-payments", label: "Flagged payments", filters: { payment: "Flagged" }, columns: ["phone", "contact", "team", "camp", "payment", "mpesaCode"] },
]

function facilitatorTitle(filters: FacilitatorFilters) {
  const template = facilitatorTemplates.find((item) => item.id === filters.template)
  const parts = [
    filters.camp === "all" ? "All camps" : filters.camp,
    "facilitators",
    filters.team !== "all" && `· ${filters.team.toLowerCase()}`,
    filters.gender !== "all" && filters.gender.toLowerCase(),
    filters.campus !== "all" && (filters.campus === invitedCampus ? "from outside Mavuno" : `at ${filters.campus}`),
    filters.payment !== "all" && filters.payment.toLowerCase(),
    filters.status !== "all" && filters.status.toLowerCase(),
    template && `· ${template.label.toLowerCase()}`,
  ].filter(Boolean)
  return `${parts.join(" ")} ${editionTitle(filters.editions)}`
}

function FacilitatorsReport() {
  const [query, setQuery] = React.useState("")
  const [filters, setFilters] = React.useState<FacilitatorFilters>(emptyFacilitatorFilters)
  const [visible, setVisible] = React.useState<FacilitatorColumnId[]>(defaultFacilitatorColumns)
  const [title, setTitle] = React.useState(facilitatorTitle(emptyFacilitatorFilters))
  const [titleEdited, setTitleEdited] = React.useState(false)

  const template = facilitatorTemplates.find((item) => item.id === filters.template)
  const rows = facilitatorRoster.filter((facilitator) =>
    `${facilitator.name} ${facilitator.phone} ${facilitator.contactPhone} ${facilitator.mpesaCode}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    filters.editions.includes(facilitator.edition) &&
    // MYF and MYA include the facilitators who chose Both; "Both" lists only those.
    (filters.camp === "all" || facilitator.camp === filters.camp || (facilitator.camp === "Both" && filters.camp !== "Both")) &&
    (filters.gender === "all" || facilitator.gender === filters.gender) &&
    (filters.campus === "all" || facilitator.campus === filters.campus) &&
    (filters.team === "all" || facilitator.team === filters.team) &&
    (filters.status === "all" || facilitator.status === filters.status) &&
    (filters.payment === "all" || facilitator.payment === filters.payment) &&
    (!template?.match || template.match(facilitator)))

  // Heading clicks sort the list, and the preview, the printout and the CSV follow it. Default: A to Z by first name.
  const hasNote = (value: string) => (value !== "-" ? 0 : 1)
  const statusRank = byRank(["Registered", "Checked in", "Checked out"])
  const { rows: sortedRows, sort, toggle } = useSortedRows<Facilitator>(
    rows,
    {
      facilitator: (a, b) => byText(a.name, b.name),
      contact: (a, b) => byText(a.contactName, b.contactName),
      team: (a, b) => byText(a.team, b.team),
      camp: (a, b) => byRank(["MYF", "MYA", "Both"])(a.camp, b.camp),
      campus: (a, b) => byText(a.campus, b.campus),
      edition: (a, b) => editionRank(a.edition) - editionRank(b.edition),
      status: (a, b) => statusRank(a.status, b.status),
      payment: (a, b) => byRank(["Flagged", "Awaiting verification", "Verified", "Waived"])(a.payment, b.payment),
      mpesaCode: (a, b) => byText(a.mpesaCode || "~", b.mpesaCode || "~"),
      medical: (a, b) => hasNote(a.medical) - hasNote(b.medical) || byText(a.medical, b.medical),
      specialNeeds: (a, b) => hasNote(a.specialNeeds) - hasNote(b.specialNeeds) || byText(a.specialNeeds, b.specialNeeds),
    },
    (a, b) => byText(a.name, b.name)
  )

  const updateFilters = (patch: Partial<FacilitatorFilters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    if (!titleEdited) setTitle(facilitatorTitle(next))
  }
  const applyTemplate = (id: string) => {
    const chosen = facilitatorTemplates.find((item) => item.id === id)
    if (!chosen) { updateFilters({ template: "none" }); setVisible(defaultFacilitatorColumns); return }
    updateFilters({ ...emptyFacilitatorFilters, camp: filters.camp, editions: filters.editions, ...chosen.filters, template: id })
    setVisible(chosen.columns)
  }
  const reset = () => { setQuery(""); setFilters(emptyFacilitatorFilters); setVisible(defaultFacilitatorColumns); setTitle(facilitatorTitle(emptyFacilitatorFilters)); setTitleEdited(false) }
  const { can } = useSession()
  const medicalHidden = (id: string) => !can("view-medical") && (id === "medical" || id === "specialNeeds")
  const show = (id: FacilitatorColumnId) => visible.includes(id) && !medicalHidden(id)
  const multiEdition = filters.editions.length > 1
  const [previewing, setPreviewing] = React.useState(false)
  const cell = (facilitator: Facilitator, id: FacilitatorColumnId) => ({ phone: facilitator.phone || "-", contact: `${facilitator.contactName}\n${facilitator.contactPhone}`, team: facilitator.team, camp: facilitator.camp, campus: campusLabel(facilitator.campus), status: facilitator.status, payment: facilitator.payment, mpesaCode: facilitator.mpesaCode || "-", medical: facilitator.medical, specialNeeds: facilitator.specialNeeds })[id]
  const shownColumns = facilitatorColumns.filter((column) => show(column.id))
  const printData: PrintData = {
    title: title,
    camp: filters.camp === "all" ? "All camps" : filters.camp,
    filters: describeFilters([["Edition", editionTitle(filters.editions)], ["Camp", filters.camp], ["Team", filters.team], ["Gender", filters.gender], ["Campus", filters.campus], ["Payment", filters.payment], ["Status", filters.status]], query, template?.label),
    columns: ["Facilitator", ...(multiEdition ? ["Edition"] : []), ...shownColumns.map((column) => column.label)],
    rows: sortedRows.map((facilitator) => [`${facilitator.name}\nAge: ${facilitator.age} - ${facilitator.gender}`, ...(multiEdition ? [editionLabel(facilitator.edition)] : []), ...shownColumns.map((column) => cell(facilitator, column.id))]),
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
            <EditionFilter value={filters.editions} onChange={(editions) => updateFilters({ editions })} />
            <FilterSelect label="Camp" value={filters.camp} onChange={(camp) => updateFilters({ camp })} all="All camps" options={["MYF", "MYA", "Both"]} width="w-32" />
            <FilterSelect label="Team" value={filters.team} onChange={(team) => updateFilters({ team })} all="All facilitators" options={teamNames} width="w-40" />
            <FilterSelect label="Campus" value={filters.campus} onChange={(campus) => updateFilters({ campus })} all="All campuses" options={filterCampuses()} labelOf={campusLabel} width="w-40" />
            <FilterSelect label="Status" value={filters.status} onChange={(status) => updateFilters({ status })} all="All statuses" options={["Registered", "Checked in", "Checked out"]} />
            <FilterSelect label="Payment" value={filters.payment} onChange={(payment) => updateFilters({ payment })} all="All payments" options={["Verified", "Awaiting verification", "Flagged", "Waived"]} />
            <FilterSelect label="Gender" value={filters.gender} onChange={(gender) => updateFilters({ gender })} all="All genders" options={["Female", "Male"]} width="w-32" />
            <Button type="button" variant="outline" onClick={reset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <TitleCard title={title} onTitle={(value) => { setTitle(value); setTitleEdited(true) }} count={rows.length} total={facilitatorRoster.length} onPreview={() => setPreviewing(true)}>
            <Select value={filters.template} onValueChange={applyTemplate}>
              <SelectTrigger className="w-56" aria-label="Report template"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No report template</SelectItem>
                {facilitatorTemplates.filter((item) => can("view-medical") || item.id !== "medical").map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-32 justify-between font-normal">Columns<IconChevronDown className="text-muted-foreground" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={6} className="min-w-48">
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {facilitatorColumns.filter((column) => !medicalHidden(column.id)).map((column) => (
                  <DropdownMenuCheckboxItem key={column.id} checked={show(column.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => setVisible((current) => (checked ? facilitatorColumns.map((item) => item.id).filter((id) => id === column.id || current.includes(id)) : current.filter((id) => id !== column.id)))}>
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
      </TitleCard>
      <PrintPreview open={previewing} data={printData} onClose={() => setPreviewing(false)} />

      <div className="overflow-x-auto rounded-lg border print:hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <SortableHead label="Facilitator" sortKey="facilitator" sort={sort} onSort={toggle} />
              {multiEdition && <SortableHead label="Edition" sortKey="edition" sort={sort} onSort={toggle} />}
              {show("phone") && <TableHead className="whitespace-nowrap">Phone number</TableHead>}
              {show("contact") && <SortableHead label="Emergency contact" sortKey="contact" sort={sort} onSort={toggle} />}
              {show("team") && <SortableHead label="Team" sortKey="team" sort={sort} onSort={toggle} />}
              {show("camp") && <SortableHead label="Camp" sortKey="camp" sort={sort} onSort={toggle} />}
              {show("campus") && <SortableHead label="Campus" sortKey="campus" sort={sort} onSort={toggle} />}
              {show("status") && <SortableHead label="Status" sortKey="status" sort={sort} onSort={toggle} />}
              {show("payment") && <SortableHead label="Payment" sortKey="payment" sort={sort} onSort={toggle} />}
              {show("mpesaCode") && <SortableHead label="M-Pesa code" sortKey="mpesaCode" sort={sort} onSort={toggle} />}
              {show("medical") && <SortableHead label="Medical condition" sortKey="medical" sort={sort} onSort={toggle} />}
              {show("specialNeeds") && <SortableHead label="Special needs" sortKey="specialNeeds" sort={sort} onSort={toggle} />}
              <TableHead className="w-10 print:hidden"><span className="sr-only">More actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((facilitator) => (
              <TableRow key={facilitator.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap"><div className="font-medium">{facilitator.name}</div><div className="text-muted-foreground">Age: {facilitator.age} - {facilitator.gender}</div></TableCell>
                {multiEdition && <TableCell className="whitespace-nowrap">{editionLabel(facilitator.edition)}</TableCell>}
                {show("phone") && <TableCell className="whitespace-nowrap tabular-nums">{facilitator.phone || "-"}</TableCell>}
                {show("contact") && <TableCell className="whitespace-nowrap"><div>{facilitator.contactName}</div><div className="text-muted-foreground tabular-nums">{facilitator.contactPhone}</div></TableCell>}
                {show("team") && <TableCell className="whitespace-nowrap">{facilitator.team}</TableCell>}
                {show("camp") && <TableCell className="whitespace-nowrap">{facilitator.camp}</TableCell>}
                {show("campus") && <TableCell className="whitespace-nowrap">{campusLabel(facilitator.campus)}</TableCell>}
                {show("status") && <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(facilitator.status))}>{facilitator.status}</Badge></TableCell>}
                {show("payment") && <TableCell className="whitespace-nowrap">{facilitator.payment}</TableCell>}
                {show("mpesaCode") && <TableCell className={cn("whitespace-nowrap tabular-nums", !facilitator.mpesaCode && "text-muted-foreground")}>{facilitator.mpesaCode || "-"}</TableCell>}
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
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger className="w-full" value="campers">Campers</TabsTrigger>
          <TabsTrigger className="w-full" value="facilitators">Facilitators</TabsTrigger>
          <TabsTrigger className="w-full" value="ages">Age and gender</TabsTrigger>
        </TabsList>
      </Tabs>
      {kind === "campers" ? <CampersReport /> : kind === "facilitators" ? <FacilitatorsReport /> : <AgeReport />}
    </main>
  )
}
