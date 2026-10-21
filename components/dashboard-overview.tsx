"use client"

import * as React from "react"
import Link from "next/link"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { AlertCircle, X } from "lucide-react"
import { IconDotsVertical, IconPhoto, IconSearch } from "@tabler/icons-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Badge } from "@/ui/badge"
import { Button, buttonVariants } from "@/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip"
import { EditionScope } from "@/components/edition-scope"
import { SortableHead } from "@/components/sortable-head"
import { campRecord } from "@/lib/camp-data"
import { campusLabel } from "@/lib/campuses"
import { ageValid } from "@/components/registration"
import { nameMaxChars, phoneError, phoneValid } from "@/lib/validation"
import { campers as campersRecords, facilitators as facilitatorRecords, fullName, paymentOf } from "@/lib/records"
import { byRank, byText, useSortedRows } from "@/lib/sort"
import { campSpotsUsed, statsFor, statsForEdition, type CampKey, type CampScope } from "@/lib/dashboard-stats"
import { currentEditionIds, editionLabel } from "@/lib/editions"
import { LoadingButton } from "@/components/loading-button"
import { useSession } from "@/components/session-provider"
import { TablePagination } from "@/components/table-pagination"
import { pageCount } from "@/lib/paging"
import { useAction } from "@/lib/use-action"
import { SummaryImageDialog } from "@/components/summary-image"
import { limitMedical, medicalMaxChars, medicalSubtitle } from "@/components/registration"
import { formatDateTime } from "@/lib/format"
import { statusClass } from "@/lib/status"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { UndoOverlay } from "@/components/undo-overlay"
import { Checkbox } from "@/ui/checkbox"
import { Input } from "@/ui/input"
import { Textarea } from "@/ui/textarea"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"

const COLORS = ["#336699", "#55C4AE", "#FFD400"]
const spotsLeft = (id: CampKey, editionId: string) => Math.max(campRecord(id).details.camperLimit - campSpotsUsed(id, statsForEdition(editionId)), 0)

// Ordered as the camp unfolds: registered, room left, arrivals, departures and baptism requests, then facilitators.
// Every number belongs to the selected tab: one camp shows only its own spots left. The saved image reads them
// three to a row (a last odd one spans what is left of its row).
function summaryItems(scope: CampScope, editionId: string): [string, string][] {
  const stats = statsFor(scope, statsForEdition(editionId))
  const camps: CampKey[] = scope === "all" ? ["MYF", "MYA"] : [scope]
  return [
    [String(stats.registered), "Total registered campers"],
    [String(stats.walkIn), "Walk in registrations"],
    ...camps.map((id): [string, string] => [String(spotsLeft(id, editionId)), `${id} spots left`]),
    [String(stats.pendingArrivals), "Pending arrivals"],
    [String(stats.present), "Campers present on site"],
    [String(stats.departedEarly), "Campers departed early"],
    [String(stats.baptismRequests), "Baptism requests"],
    [String(stats.facilitators), "Total registered facilitators"],
  ]
}
// The roster shows the open edition's campers from the shared records (lib/records.ts), the same people Reports, Waivers and Payments list.
type RosterCamper = { id: string; name: string; ageLine: string; contactName: string; contactPhone: string; phone: string; campus: string; status: string; medical: string; needs: string; camp: string; waived: boolean; mpesaCode: string; age: number; gender: string; baptised: boolean; role: "Camper" | "Facilitator"; team: string }
// Every camper of the open edition, including walk-ins registered since the page loaded.
const buildCampers = (): RosterCamper[] => [
  ...campersRecords
    .filter((camper) => currentEditionIds.includes(camper.editionId))
    .map((camper): RosterCamper => ({
      id: camper.id,
      name: fullName(camper),
      ageLine: `Age: ${camper.age} - ${camper.gender}`,
      contactName: fullName(camper.contact),
      contactPhone: camper.contact.phone,
      phone: camper.phone,
      campus: camper.campus,
      status: camper.status,
      medical: camper.medical || "-",
      needs: camper.specialNeeds || "-",
      camp: camper.camp,
      waived: Boolean(camper.waiver),
      mpesaCode: paymentOf(camper)?.code ?? "",
      age: camper.age,
      gender: camper.gender,
      baptised: camper.baptised,
      role: "Camper",
      team: "",
    })),
  // Facilitators are at camp too, so they are on the roster (they are not counted as campers in the charts).
  ...facilitatorRecords
    .filter((facilitator) => currentEditionIds.includes(facilitator.editionId))
    .map((facilitator): RosterCamper => ({
      id: facilitator.id,
      name: fullName(facilitator),
      ageLine: `Age: ${facilitator.age} - ${facilitator.gender}`,
      contactName: fullName(facilitator.contact),
      contactPhone: facilitator.contact.phone,
      phone: facilitator.phone,
      campus: facilitator.campus,
      status: facilitator.status,
      medical: facilitator.medical || "-",
      needs: facilitator.specialNeeds || "-",
      camp: facilitator.camp,
      waived: facilitator.feeWaived,
      mpesaCode: "",
      age: facilitator.age,
      gender: facilitator.gender,
      baptised: false,
      role: "Facilitator",
      team: facilitator.team,
    })),
]

type DonutDatum = { name: string; value: number }

function DonutCard({
  title,
  description,
  data,
  centerValue,
  centerLabel,
  labels,
}: {
  title: string
  description: string
  data: DonutDatum[]
  centerValue: string
  centerLabel: string
  labels: string[]
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-56 w-full max-w-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius="52%" outerRadius="78%" strokeWidth={0}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-xl">{centerValue}</strong>
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {data.map((item, index) => (
            <span key={item.name} className="inline-flex items-center gap-1">
              <i className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
              {labels[index]} {item.value}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickSummary({ scope, editionId }: { scope: CampScope; editionId: string }) {
  const [imageOpen, setImageOpen] = React.useState(false)
  const summary = React.useMemo(() => summaryItems(scope, editionId), [scope, editionId])
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">Quick summary</CardTitle>
        <CardDescription>{scope === "all" ? "A summary of campers data" : `A summary of ${scope} campers data`}</CardDescription>
        <CardAction>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="View summary as image" onClick={() => setImageOpen(true)}>
                <IconPhoto />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View as image</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {summary.map(([value, label]) => (
            <div key={label} className="rounded-lg border bg-muted/20 px-4 py-3">
              <div className="text-base font-semibold tabular-nums">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </CardContent>
      <SummaryImageDialog open={imageOpen} items={summary} scopeLabel={`${scope === "all" ? "All camps" : scope} · ${editionLabel(editionId)}`} onClose={() => setImageOpen(false)} />
    </Card>
  )
}

function RowActions({
  status,
  onUndo,
  onUndoCheckIn,
  onEdit,
  onCancelRegistration,
}: {
  status: string
  onUndo?: () => void
  onUndoCheckIn?: () => void
  onEdit?: () => void
  onCancelRegistration?: () => void
}) {
  const checkedOut = status === "Checked out"
  const { can } = useSession()
  const items = {
    edit: can("register"),
    undoCheckOut: checkedOut && can("check-out"),
    undoCheckIn: status === "Checked in" && can("check-in"),
    cancel: can("register"),
  }
  if (!Object.values(items).some(Boolean)) return null // nothing this role may do on the row
  return (
    <DropdownMenu>
      <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="More actions">
        <IconDotsVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
        {items.edit && <DropdownMenuItem onSelect={onEdit}>Edit details</DropdownMenuItem>}
        {items.undoCheckOut && <DropdownMenuItem onSelect={onUndo}>Undo check out</DropdownMenuItem>}
        {items.undoCheckIn && <DropdownMenuItem onSelect={onUndoCheckIn}>Undo check in</DropdownMenuItem>}
        {items.cancel && (
          <>
            {(items.edit || items.undoCheckOut || items.undoCheckIn) && <DropdownMenuSeparator />}
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onCancelRegistration}>Cancel registration</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardOverview() {
  const [campus, setCampus] = React.useState("all")
  // The tabs scope the charts and the Quick summary as well as the roster.
  const scope: CampScope = campus === "all" ? "all" : (campus.toUpperCase() as CampKey)
  // The roster is the shared records plus what staff edited here. Edit camper updates the row (a prototype: it resets on refresh).
  const baseCampers = React.useMemo(buildCampers, [])
  const [edits, setEdits] = React.useState<Record<string, Partial<RosterCamper>>>({})
  const campers = React.useMemo(() => baseCampers.map((camper) => ({ ...camper, ...edits[camper.id] })), [baseCampers, edits])
  // The dashboard is the live screen for the open edition. Past editions are read in Reports.
  const editionId = currentEditionIds[0] ?? ""
  const stats = statsFor(scope, statsForEdition(editionId))
  const [search, setSearch] = React.useState("")
  const [campusFilter, setCampusFilter] = React.useState("all")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [exitPermitCamper, setExitPermitCamper] = React.useState<string | null>(null)
  const [editCamper, setEditCamper] = React.useState<{
    id: string
    firstName: string
    lastName: string
    age: string
    gender: string
    phone: string
    baptized: string
    medical: boolean
    specialNeeds: boolean
    medicalDetails: string
    specialNeedsDetails: string
  } | null>(null)
  const [rowStatuses, setRowStatuses] = React.useState<Record<string, string>>({})
  const [checkedOutCampers, setCheckedOutCampers] = React.useState<Set<string>>(
    () => new Set(baseCampers.flatMap((camper) => (camper.status === "Checked out" ? [camper.id] : [])))
  )
  const [checkedInCampers, setCheckedInCampers] = React.useState<Set<string>>(
    () => new Set(baseCampers.flatMap((camper) => (camper.status === "Checked in" ? [camper.id] : [])))
  )
  const [exitPermitTimes, setExitPermitTimes] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(baseCampers.filter((camper) => camper.status === "Checked out").map((camper) => [camper.id, "19/10/26, 07:10 PM"]))
  )
  const [exitPermitId, setExitPermitId] = React.useState<string | null>(null)
  // Cancelled registrations leave the roster and free their spot (a demo: nothing is stored).
  const [cancelling, setCancelling] = React.useState<RosterCamper | null>(null)
  // Undoing a check-in or a check-out changes the attendance record, so it asks first.
  const [undoing, setUndoing] = React.useState<{ kind: "check-in" | "check-out"; camper: RosterCamper } | null>(null)
  const [cancelledIds, setCancelledIds] = React.useState<Set<string>>(new Set())
  const [checkInSearch, setCheckInSearch] = React.useState("")
  const [checkInOpen, setCheckInOpen] = React.useState(false)
  const [selectedCheckIns, setSelectedCheckIns] = React.useState<Set<string>>(new Set())
  const [checkInSuccess, setCheckInSuccess] = React.useState<{ ids: string[]; attendee: string } | null>(null)
  // Edit camper rules: the same ones as Registration (names, the camp's age limits, a valid phone).
  const editRecord = editCamper ? campers.find((camper) => camper.id === editCamper.id) : undefined
  const editAgeError = !editCamper || !editRecord
    ? ""
    : editRecord.role === "Facilitator"
      ? !/^\d{1,2}$/.test(editCamper.age.trim()) || Number(editCamper.age) < 18 ? "Facilitators are 18 or older." : ""
      : !ageValid(editRecord.camp as "MYF" | "MYA", editCamper.age.trim()) ? `${editRecord.camp} is for ages ${campRecord(editRecord.camp as "MYF" | "MYA").ageLabel.replace("Age ", "")}.` : ""
  const editPhoneError = editCamper && !phoneValid(editCamper.phone.trim()) ? phoneError : ""
  const editValid = Boolean(editCamper) && editCamper!.firstName.trim() !== "" && editCamper!.lastName.trim() !== "" && !editAgeError && !editPhoneError
  // The roster shows ten campers a page; any search, filter, sort or tab change goes back to the first page.
  const rosterPageSize = 10
  const { can } = useSession()
  // Every change goes through the server call: the button shows its loading state and the action can't run twice.
  const { pending, run } = useAction()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [rosterPage, setRosterPage] = React.useState(1)
  const campusOptions = Array.from(new Set(campers.map((camper) => camper.campus))).sort()
  const statusOf = (id: string, camper: RosterCamper) =>
    rowStatuses[id] ?? (checkedOutCampers.has(id) ? "Checked out" : checkedInCampers.has(id) ? "Checked in" : camper.status)
  const filtered = campers
    .filter((camper) => !cancelledIds.has(camper.id))
    .map((camper) => ({ camper, id: camper.id }))
    .filter(
      ({ camper, id }) =>
        `${camper.name} ${camper.phone} ${camper.contactName} ${camper.contactPhone} ${camper.mpesaCode}`.toLowerCase().includes(search.trim().toLowerCase()) &&
        // A facilitator who serves Both camps is on the roster of each.
        (campus === "all" || camper.camp.toLowerCase() === campus || camper.camp === "Both") &&
        (campusFilter === "all" || camper.campus === campusFilter) &&
        (roleFilter === "all" || camper.role === roleFilter) &&
        (statusFilter === "all" || statusOf(id, camper) === statusFilter)
    )
  // Heading clicks sort the roster. Default: A to Z by first name. Status groups follow the camper's journey.
  type Row = { camper: RosterCamper; id: string }
  const hasNote = (value: string) => (value !== "-" ? 0 : 1)
  const statusRank = byRank(["Registered", "Checked in", "Checked out"])
  const { rows: sortedRows, sort, toggle } = useSortedRows<Row>(
    filtered,
    {
      camper: (a, b) => byText(a.camper.name, b.camper.name),
      camp: (a, b) => byText(a.camper.camp, b.camper.camp),
      campus: (a, b) => byText(a.camper.campus, b.camper.campus),
      status: (a, b) => statusRank(statusOf(a.id, a.camper), statusOf(b.id, b.camper)),
      medical: (a, b) => hasNote(a.camper.medical) - hasNote(b.camper.medical) || byText(a.camper.medical, b.camper.medical),
      specialNeeds: (a, b) => hasNote(a.camper.needs) - hasNote(b.camper.needs) || byText(a.camper.needs, b.camper.needs),
    },
    (a, b) => byText(a.camper.name, b.camper.name)
  )
  React.useEffect(() => setRosterPage(1), [search, campus, campusFilter, roleFilter, statusFilter, sort])
  const currentRosterPage = Math.min(rosterPage, pageCount(sortedRows.length, rosterPageSize))
  const pagedRows = sortedRows.slice((currentRosterPage - 1) * rosterPageSize, currentRosterPage * rosterPageSize)
  // Look up by name, the camper's or the emergency contact's phone, or the M-Pesa code. Never by medical details.
  const checkInMatches = campers
    .filter((camper) => !cancelledIds.has(camper.id))
    .map((camper) => ({ camper, id: camper.id }))
    .filter(({ camper }) => `${camper.name} ${camper.phone} ${camper.contactPhone} ${camper.mpesaCode}`.toLowerCase().includes(checkInSearch.trim().toLowerCase()))
    .slice(0, 3)
  const openCheckIn = () => {
    if (checkInSearch.trim() === "") return
    setSelectedCheckIns(new Set())
    setCheckInOpen(true)
  }
  const checkInRow = async (id: string) => {
    setActiveId(id)
    const ok = await run(() => {
      setCheckedInCampers((current) => new Set(current).add(id))
      setRowStatuses((current) => ({ ...current, [id]: "Checked in" }))
    }, "check in the camper")
    setActiveId(null)
    if (ok) setCheckInSuccess({ ids: [id], attendee: campers.find((camper) => camper.id === id)?.name ?? "Camper" })
  }
  const applyUndo = (kind: "check-in" | "check-out", id: string) => {
    setCheckedOutCampers((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
    setExitPermitTimes((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    if (kind === "check-out") {
      // The camper is back on site.
      setCheckedInCampers((current) => new Set(current).add(id))
      setRowStatuses((current) => ({ ...current, [id]: "Checked in" }))
    } else {
      // The camper goes back to Registered.
      setCheckedInCampers((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      setRowStatuses((current) => ({ ...current, [id]: "Registered" }))
    }
  }
  const startExitPermit = (id: string) => {
    setExitPermitCamper(campers.find((camper) => camper.id === id)?.name ?? null)
    setExitPermitId(id)
  }
  const undoCheckInSuccess = () => {
    checkInSuccess?.ids.forEach((id) => {
      setCheckedInCampers((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      setRowStatuses((current) => ({ ...current, [id]: "Registered" }))
    })
    setCheckInSuccess(null)
    toast.success("Camper check-in successfully cancelled")
  }
  return (
    <>
      {checkInSuccess && (
        <UndoOverlay
          title="Successfully checked in"
          description={`Attendee: ${checkInSuccess.attendee} successfully verified and checking in.`}
          onUndo={undoCheckInSuccess}
          onDone={() => {
            setCheckInSuccess(null)
            toast.success("Camper successfully checked in")
          }}
        />
      )}
      <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <EditionScope>
        <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
          <DialogContent showCloseButton={false} className="gap-0 p-4 sm:max-w-xl">
            <DialogHeader className="relative space-y-1 text-left">
              <DialogTitle className="text-base font-bold leading-none tracking-tight">Check-in online registrant</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Search string:{" "}
                <span className="ml-1 rounded bg-muted px-3 py-1 text-muted-foreground">{checkInSearch || "All registrations"}</span>
              </DialogDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close check-in dialog"
                className="absolute right-0 top-0"
                onClick={() => setCheckInOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </DialogHeader>
            <div className="space-y-3 pt-3">
              <div className="pt-2 text-sm">{checkInMatches.length} registrations found.</div>
              <div className="space-y-1">
                {checkInMatches.map(({ camper, id }) => {
                  const status =
                    rowStatuses[id] ??
                    (checkedOutCampers.has(id) ? "Checked out" : checkedInCampers.has(id) ? "Checked in" : camper.status)
                  const selected = selectedCheckIns.has(id)
                  const eligible = status === "Registered" // someone already in, or already left, can't be checked in again
                  return (
                    <label key={id} className={cn("flex items-start gap-3 rounded-lg border bg-muted/20 p-2", eligible ? "cursor-pointer" : "opacity-60")}>
                      <Checkbox
                        checked={selected}
                        disabled={!eligible}
                        onCheckedChange={() =>
                          setSelectedCheckIns((current) => {
                            const next = new Set(current)
                            selected ? next.delete(id) : next.add(id)
                            return next
                          })
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{camper.name}</span>
                        <span className="block text-sm text-muted-foreground">{camper.ageLine}</span>
                      </span>
                      <Badge className={cn("shrink-0", statusClass(status))}>{status === "Checked in" ? "Checked in" : status}</Badge>
                    </label>
                  )
                })}
              </div>
              <DialogFooter className="mt-4 flex-row justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setCheckInOpen(false)}>
                  Cancel
                </Button>
                <LoadingButton
                  type="button"
                  pending={pending}
                  loadingLabel="Checking in..."
                  disabled={selectedCheckIns.size === 0}
                  onClick={async () => {
                    const ok = await run(() => {
                      selectedCheckIns.forEach((id) => {
                        setCheckedInCampers((current) => new Set(current).add(id))
                        setRowStatuses((current) => ({ ...current, [id]: "Checked in" }))
                      })
                    }, "check in the camper")
                    if (!ok) return
                    setCheckInOpen(false)
                    window.setTimeout(
                      () =>
                        setCheckInSuccess({
                          ids: Array.from(selectedCheckIns),
                          attendee:
                            checkInMatches
                              .filter(({ id }) => selectedCheckIns.has(id))
                              .map(({ camper }) => camper.name)
                              .join(", ") || "Camper",
                        }),
                      450
                    )
                  }}
                >
                  Confirm check-in
                </LoadingButton>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={campus} onValueChange={setCampus} className="w-fit">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger className="w-full" value="all">
                All camps
              </TabsTrigger>
              <TabsTrigger className="w-full" value="myf">
                {campRecord("MYF").label}
              </TabsTrigger>
              <TabsTrigger className="w-full" value="mya">
                {campRecord("MYA").label}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr]">
          <DonutCard
            title="Campers attendance"
            description="A summary of campers check in statuses."
            data={[
              { name: "Online checked in", value: stats.onlineCheckedIn },
              { name: "Pending arrivals", value: stats.pendingArrivals },
              { name: "Walk in", value: stats.walkIn },
            ]}
            centerValue={String(stats.registered)}
            centerLabel="Registered"
            labels={["Online checked in:", "Pending arrivals:", "Walk in:"]}
          />
          <DonutCard
            title="Checked-in campers by gender"
            description="A summary of male and female campers on site."
            data={[
              { name: "Male", value: stats.male },
              { name: "Female", value: stats.female },
            ]}
            centerValue={String(stats.present)}
            centerLabel="Present"
            labels={["Male:", "Female:"]}
          />
          <div className="md:col-span-2 xl:col-span-1">
            <QuickSummary scope={scope} editionId={editionId} />
          </div>
        </section>
        <>
          <section className={cn("grid gap-4", can("check-in") && can("register") && "lg:grid-cols-2")}>
            {can("check-in") && <Card className="flex flex-col shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Check-in online registrant</CardTitle>
                <CardDescription>Lookup camper&apos;s name, M-Pesa code or phone number to instantly check them in.</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex items-center gap-3">
                <div className="relative flex-1">
                  <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={checkInSearch}
                    onChange={(event) => setCheckInSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") openCheckIn()
                    }}
                    className="border bg-muted/50 pl-8"
                    aria-label="Search by name, phone, M-Pesa code"
                    placeholder="Search by name, phone, M-Pesa code"
                  />
                </div>
                <Button onClick={openCheckIn} disabled={checkInSearch.trim() === ""}>Check in</Button>
              </CardContent>
            </Card>}
            {can("register") && <Card className="flex flex-col shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Walk-in registration</CardTitle>
                <CardDescription>
                  Capture full camper details. Walk-ins are auto-checked in as present upon payment verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full">
                  <Link href="/registration">Open walk-in registration form</Link>
                </Button>
              </CardContent>
            </Card>}
          </section>
          <Card className="shadow-none">
            <CardHeader className="gap-1">
              <CardTitle className="text-base">Camp roster &amp; status monitor</CardTitle>
              <CardDescription>Manage attendees, filter by campus or status, or process early exit permits.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative max-w-md flex-1">
                  <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="border bg-muted/50 pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search by name, phone, M-Pesa code"
                    placeholder="Search by name, phone, M-Pesa code"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={campusFilter} onValueChange={setCampusFilter}>
                    <SelectTrigger className="w-36" aria-label="Campus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All campuses</SelectItem>
                      {campusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {campusLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-36" aria-label="Role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="Camper">Campers</SelectItem>
                      <SelectItem value="Facilitator">Facilitators</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36" aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="Registered">Registered</SelectItem>
                      <SelectItem value="Checked in">Checked in</SelectItem>
                      <SelectItem value="Checked out">Checked out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <SortableHead label="Camper" sortKey="camper" sort={sort} onSort={toggle} />
                      {campus === "all" && <SortableHead label="Camp" sortKey="camp" sort={sort} onSort={toggle} />}
                      <TableHead className="whitespace-nowrap">Emergency contact</TableHead>
                      <SortableHead label="Campus" sortKey="campus" sort={sort} onSort={toggle} />
                      <SortableHead label="Status" sortKey="status" sort={sort} onSort={toggle} />
                      {can("view-medical") && <SortableHead label="Medical condition" sortKey="medical" sort={sort} onSort={toggle} />}
                      {can("view-medical") && <SortableHead label="Special needs" sortKey="specialNeeds" sort={sort} onSort={toggle} />}
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">More actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map(({ camper, id }) => (
                      <TableRow key={`${camper.name}-${id}`} className="hover:bg-muted/50">
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{camper.name}</div>
                          <div className="text-muted-foreground">
                            {camper.ageLine}
                            {camper.waived ? " · Fee waived" : ""}
                          </div>
                          {camper.role === "Facilitator" && <div className="text-muted-foreground">Facilitator, {camper.team}</div>}
                        </TableCell>
                        {campus === "all" && <TableCell className="whitespace-nowrap">{camper.camp}</TableCell>}
                        <TableCell className="whitespace-nowrap">
                          <div>{camper.contactName}</div>
                          <div className="text-muted-foreground">{camper.contactPhone}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{campusLabel(camper.campus)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`whitespace-nowrap ${statusClass(rowStatuses[id] ?? (checkedOutCampers.has(id) ? "Checked out" : checkedInCampers.has(id) ? "Checked in" : camper.status))}`}
                          >
                            {rowStatuses[id] ??
                              (checkedOutCampers.has(id) ? "Checked out" : checkedInCampers.has(id) ? "Checked in" : camper.status)}
                          </Badge>
                        </TableCell>
                        {can("view-medical") && <TableCell className="whitespace-nowrap">{camper.medical}</TableCell>}
                        {can("view-medical") && <TableCell className="whitespace-nowrap">{camper.needs}</TableCell>}
                        <TableCell className="whitespace-nowrap">
                          {(rowStatuses[id] ??
                            (checkedOutCampers.has(id) ? "Checked out" : checkedInCampers.has(id) ? "Checked in" : camper.status)) ===
                          "Registered" ? (
                            !can("check-in") ? <span className="text-sm text-muted-foreground">-</span> : <LoadingButton
                              type="button"
                              className="bg-brand text-brand-foreground hover:bg-brand-hover"
                              pending={pending && activeId === id}
                              loadingLabel="Checking in..."
                              disabled={pending}
                              onClick={() => checkInRow(id)}
                            >
                              Check in
                            </LoadingButton>
                          ) : (rowStatuses[id] ??
                              (checkedOutCampers.has(id) ? "Checked out" : checkedInCampers.has(id) ? "Checked in" : camper.status)) ===
                            "Checked in" ? (
                            !can("check-out") ? <span className="text-sm text-muted-foreground">-</span> : <Button type="button" variant="outline" onClick={() => startExitPermit(id)}>
                              Issue exit permit
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">{exitPermitTimes[id] ?? ""}</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <RowActions
                            onCancelRegistration={() => setCancelling(camper)}
                            onEdit={() =>
                              setEditCamper({
                                id,
                                firstName: camper.name.split(" ")[0],
                                lastName: camper.name.split(" ").slice(1).join(" "),
                                age: camper.ageLine.match(/Age: (\d+)/)?.[1] ?? "",
                                gender: camper.ageLine.includes("Female") ? "Female" : "Male",
                                phone: camper.phone,
                                baptized: camper.baptised ? "Yes" : "No",
                                medical: camper.medical !== "-",
                                specialNeeds: camper.needs !== "-",
                                medicalDetails: camper.medical !== "-" ? camper.medical : "",
                                specialNeedsDetails: camper.needs !== "-" ? camper.needs : "",
                              })
                            }
                            status={
                              rowStatuses[id] ??
                              (checkedOutCampers.has(id) ? "Checked out" : checkedInCampers.has(id) ? "Checked in" : camper.status)
                            }
                            onUndo={() => setUndoing({ kind: "check-out", camper })}
                            onUndoCheckIn={() => setUndoing({ kind: "check-in", camper })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No campers match these filters.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <TablePagination page={currentRosterPage} pageSize={rosterPageSize} total={sortedRows.length} onPage={setRosterPage} />
            </CardContent>
          </Card>
        </>
        <Dialog open={undoing !== null} onOpenChange={(open) => !open && setUndoing(null)}>
          <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
            <DialogHeader className="relative space-y-1 text-left">
              <DialogTitle className="flex items-center gap-2 pr-10 text-base font-bold leading-none tracking-tight"><AlertCircle className="text-destructive" />{undoing?.kind === "check-out" ? "Undo check out?" : "Undo check in?"}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {undoing?.kind === "check-out"
                  ? <><strong className="text-foreground">{undoing.camper.name}</strong> left with an exit permit{exitPermitTimes[undoing.camper.id] ? ` at ${exitPermitTimes[undoing.camper.id]}` : ""}. This marks them as on site again.</>
                  : <><strong className="text-foreground">{undoing?.camper.name}</strong> goes back to Registered and no longer counts as present.</>}
              </DialogDescription>
              <Button type="button" variant="ghost" size="icon" aria-label="Close undo confirmation" className="absolute right-0 top-0" onClick={() => setUndoing(null)}><X className="size-4" /></Button>
            </DialogHeader>
            <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setUndoing(null)}>Cancel</Button>
              <LoadingButton
                type="button"
                pending={pending}
                loadingLabel="Undoing..."
                onClick={async () => {
                  if (!undoing) return
                  const { kind, camper } = undoing
                  const ok = await run(() => applyUndo(kind, camper.id), kind === "check-out" ? "undo the check out" : "undo the check in")
                  if (!ok) return
                  setUndoing(null)
                  toast.success(kind === "check-out" ? "Check-out successfully undone" : "Check-in successfully undone")
                }}
              >
                {undoing?.kind === "check-out" ? "Undo check out" : "Undo check in"}
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={cancelling !== null} onOpenChange={(open) => !open && setCancelling(null)}>
          <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
            <DialogHeader className="relative space-y-1 text-left">
              <DialogTitle className="flex items-center gap-2 pr-10 text-base font-bold leading-none tracking-tight"><AlertCircle className="text-destructive" />Cancel registration?</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                <strong className="text-foreground">{cancelling?.name}</strong> is removed from the roster and their spot is freed. Their payment stays on record for follow-up.
              </DialogDescription>
              <Button type="button" variant="ghost" size="icon" aria-label="Close cancel registration" className="absolute right-0 top-0" onClick={() => setCancelling(null)}><X className="size-4" /></Button>
            </DialogHeader>
            <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setCancelling(null)}>Keep registration</Button>
              <LoadingButton type="button" pending={pending} loadingLabel="Cancelling..." onClick={async () => { if (!cancelling) return; const ok = await run(() => setCancelledIds((current) => new Set(current).add(cancelling.id)), "cancel the registration"); if (!ok) return; setCancelling(null); toast.success("Registration successfully cancelled") }}>Cancel registration</LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editCamper)} onOpenChange={(open) => !open && setEditCamper(null)}>
          <DialogContent
            showCloseButton={false}
            className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 bg-background p-4 sm:max-w-4xl sm:p-6"
          >
            <DialogHeader className="relative space-y-1 text-left">
              <DialogTitle className="text-base font-bold leading-none tracking-tight">Edit camper details</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Fill in your details as per your legal documents
              </DialogDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close edit camper details"
                className="absolute right-0 top-0"
                onClick={() => setEditCamper(null)}
              >
                <X className="size-4" />
              </Button>
            </DialogHeader>
            {editCamper && (
              <div className="flex min-h-0 flex-col">
                <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      First name
                      <Input
                        className="bg-muted/40"
                        maxLength={nameMaxChars}
                        value={editCamper.firstName}
                        onChange={(event) => setEditCamper({ ...editCamper, firstName: event.target.value })}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Last name
                      <Input
                        className="bg-muted/40"
                        maxLength={nameMaxChars}
                        value={editCamper.lastName}
                        onChange={(event) => setEditCamper({ ...editCamper, lastName: event.target.value })}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Age
                      <Input
                        className="bg-muted/40"
                        value={editCamper.age}
                        onChange={(event) => setEditCamper({ ...editCamper, age: event.target.value })}
                      />
                      {editAgeError && <p className="text-sm font-normal text-destructive">{editAgeError}</p>}
                    </label>
                    <div className="flex flex-col gap-2 text-sm font-medium">
                      Gender
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={editCamper.gender === "Male" ? "default" : "outline"}
                          onClick={() => setEditCamper({ ...editCamper, gender: "Male" })}
                        >
                          Male
                        </Button>
                        <Button
                          type="button"
                          variant={editCamper.gender === "Female" ? "default" : "outline"}
                          onClick={() => setEditCamper({ ...editCamper, gender: "Female" })}
                        >
                          Female
                        </Button>
                      </div>
                    </div>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      Phone number
                      <Input
                        className="bg-muted/40"
                        value={editCamper.phone}
                        onChange={(event) => setEditCamper({ ...editCamper, phone: event.target.value })}
                      />
                      {editPhoneError && <p className="text-sm font-normal text-destructive">{editPhoneError}</p>}
                    </label>
                    <div className="flex flex-col gap-2 text-sm font-medium">
                      Want to be baptised?
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={editCamper.baptized === "Yes" ? "default" : "outline"}
                          onClick={() => setEditCamper({ ...editCamper, baptized: "Yes" })}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={editCamper.baptized === "No" ? "default" : "outline"}
                          onClick={() => setEditCamper({ ...editCamper, baptized: "No" })}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                  <section className="pt-6">
                    <h3 className="text-base font-bold">Medical and special needs</h3>
                    <p className="mb-3 text-sm text-muted-foreground">{medicalSubtitle}</p>
                    <div className="flex flex-col gap-4">
                      <label className="flex cursor-pointer flex-col gap-1 rounded-2xl border bg-muted/30 p-4 text-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20">
                        <span className="flex items-start gap-2 font-medium">
                          <Checkbox
                            checked={editCamper.medical}
                            onCheckedChange={(checked) => setEditCamper({ ...editCamper, medical: checked === true })}
                            className="mt-0.5 bg-background dark:bg-input/30"
                          />
                          Medical condition / Severe allergies
                        </span>
                        <span className="pl-6 text-muted-foreground">
                          Check if this camper has acute health conditions requiring medical staff awareness.
                        </span>
                        <span
                          className={cn(
                            "-mx-1 -mb-1 grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
                            editCamper.medical ? "mt-2 grid-rows-[1fr] opacity-100" : "-mt-2 grid-rows-[0fr] opacity-0"
                          )}
                        >
                          <span className="flex min-h-0 flex-col gap-2 px-1 pb-1">
                            <span className="font-medium">Specify medical condition</span>
                            <Textarea
                              className="min-h-16 resize-none bg-background text-sm font-normal"
                              maxLength={medicalMaxChars}
                              placeholder="e.g Asthma, Peanuts allergy, Epilepsy, Diabetes"
                              value={editCamper.medicalDetails}
                              onChange={(event) => setEditCamper({ ...editCamper, medicalDetails: limitMedical(event.target.value) })}
                            />
                            <span className="text-xs font-normal tabular-nums text-muted-foreground">{editCamper.medicalDetails.length} of {medicalMaxChars} characters</span>
                          </span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer flex-col gap-1 rounded-2xl border bg-muted/30 p-4 text-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20">
                        <span className="flex items-start gap-2 font-medium">
                          <Checkbox
                            checked={editCamper.specialNeeds}
                            onCheckedChange={(checked) => setEditCamper({ ...editCamper, specialNeeds: checked === true })}
                            className="mt-0.5 bg-background dark:bg-input/30"
                          />
                          Special needs / Accessibility support
                        </span>
                        <span className="pl-6 text-muted-foreground">
                          Check if this camper requires physical, sensory, or mobility accommodations.
                        </span>
                        <span
                          className={cn(
                            "-mx-1 -mb-1 grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
                            editCamper.specialNeeds ? "mt-2 grid-rows-[1fr] opacity-100" : "-mt-2 grid-rows-[0fr] opacity-0"
                          )}
                        >
                          <span className="flex min-h-0 flex-col gap-2 px-1 pb-1">
                            <span className="font-medium">Specify special needs</span>
                            <Textarea
                              className="min-h-16 resize-none bg-background text-sm font-normal"
                              maxLength={medicalMaxChars}
                              placeholder="e.g Deaf, Autism spectrum, Anxiety"
                              value={editCamper.specialNeedsDetails}
                              onChange={(event) => setEditCamper({ ...editCamper, specialNeedsDetails: limitMedical(event.target.value) })}
                            />
                            <span className="text-xs font-normal tabular-nums text-muted-foreground">{editCamper.specialNeedsDetails.length} of {medicalMaxChars} characters</span>
                          </span>
                        </span>
                      </label>
                    </div>
                  </section>
                </div>
                <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row sm:mt-6 justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
                  <Button type="button" variant="outline" onClick={() => setEditCamper(null)}>
                    Cancel
                  </Button>
                  <LoadingButton
                    type="button"
                    pending={pending}
                    loadingLabel="Saving..."
                    disabled={!editValid}
                    onClick={async () => {
                      if (!editCamper) return
                      const ok = await run(() => {
                        const name = `${editCamper.firstName.trim()} ${editCamper.lastName.trim()}`
                        setEdits((current) => ({
                          ...current,
                          [editCamper.id]: {
                            name,
                            age: Number(editCamper.age),
                            gender: editCamper.gender,
                            ageLine: `Age: ${Number(editCamper.age)} - ${editCamper.gender}`,
                            phone: editCamper.phone.trim(),
                            baptised: editCamper.baptized === "Yes",
                            medical: editCamper.medical && editCamper.medicalDetails.trim() ? editCamper.medicalDetails.trim() : "-",
                            needs: editCamper.specialNeeds && editCamper.specialNeedsDetails.trim() ? editCamper.specialNeedsDetails.trim() : "-",
                          },
                        }))
                      }, "update the details")
                      if (!ok) return
                      setEditCamper(null)
                      toast.success("Camper details successfully updated")
                    }}
                  >
                    Save changes
                  </LoadingButton>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(exitPermitCamper)} onOpenChange={(open) => !open && setExitPermitCamper(null)}>
          <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
            <DialogHeader className="gap-3 text-left">
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <AlertCircle className="text-destructive" data-icon="inline-start" />
                Issue early exit permit
              </DialogTitle>
              <DialogDescription>
                You are about to issue an official early exit permit for <strong className="text-foreground">{exitPermitCamper}</strong>.
                This will transition their status to <strong className="text-foreground">Checked out</strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExitPermitCamper(null)
                  setExitPermitId(null)
                }}
              >
                Cancel
              </Button>
              <LoadingButton
                type="button"
                pending={pending}
                loadingLabel="Issuing..."
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={async () => {
                  const camperId = exitPermitId
                  if (camperId === null) return
                  const issuedAt = formatDateTime(new Date())
                  const ok = await run(() => {
                    setCheckedInCampers((current) => {
                      const next = new Set(current)
                      next.delete(camperId)
                      return next
                    })
                    setCheckedOutCampers((current) => new Set(current).add(camperId))
                    setRowStatuses((current) => ({ ...current, [camperId]: "Checked out" }))
                    setExitPermitTimes((current) => ({ ...current, [camperId]: issuedAt }))
                  }, "issue the exit permit")
                  if (!ok) return
                  setExitPermitCamper(null)
                  setExitPermitId(null)
                  toast.success("Exit permit successfully issued")
                }}
              >
                Issue permit
              </LoadingButton>
            </DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3"
              onClick={() => {
                setExitPermitCamper(null)
                setExitPermitId(null)
              }}
              aria-label="Close"
            >
              <X />
            </Button>
          </DialogContent>
        </Dialog>
      </EditionScope>
      </main>
    </>
  )
}
