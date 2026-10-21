"use client"

import { LoadingButton } from "@/components/loading-button"
import { useAction } from "@/lib/use-action"
import { placeNameMaxChars } from "@/lib/validation"
import * as React from "react"
import { AlertCircle, X } from "lucide-react"
import { IconDotsVertical, IconPlus, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import { SortableHead } from "@/components/sortable-head"
import { byText, type SortState } from "@/lib/sort"
import { campusesByNetwork, initialNetworks, isCampusDeleted, markCampusDeleted, type Network } from "@/lib/campuses"
import { Button, buttonVariants } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"

type Campus = { id: string; name: string; networkId: string; campers: number }

// Sample registrations across all camps and editions, used to warn before deleting a campus. Kizazi and Lifeway are new campuses with none yet.
const sampleCampers = (name: string) => (["Kizazi", "Lifeway"].includes(name) ? 0 : ([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) * 7) % 58 + 3)
const initialCampuses: Campus[] = Object.entries(campusesByNetwork).flatMap(([networkId, names]) => names.filter((name) => !isCampusDeleted(name)).map((name) => ({ id: `${networkId}-${name}`, name, networkId, campers: sampleCampers(name) })))

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "es"}`

type NameDialogState =
  | { kind: "add-network" }
  | { kind: "rename-network"; network: Network }
  | { kind: "add-campus"; networkId?: string }
  | { kind: "rename-campus"; campus: Campus }

function MoreMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label={label}><IconDotsVertical /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

function NameDialog({ state, networks, campuses, onClose, onSave }: { state: NameDialogState | null; networks: Network[]; campuses: Campus[]; onClose: () => void; onSave: (name: string, networkId: string) => void }) {
  const { pending, run } = useAction()
  const [name, setName] = React.useState("")
  const [networkId, setNetworkId] = React.useState("")
  React.useEffect(() => {
    if (!state) return
    setName(state.kind === "rename-network" ? state.network.name : state.kind === "rename-campus" ? state.campus.name : "")
    setNetworkId(state.kind === "add-campus" ? state.networkId ?? "" : "")
  }, [state])

  if (!state) return <Dialog open={false} />
  const isNetwork = state.kind === "add-network" || state.kind === "rename-network"
  const currentId = state.kind === "rename-network" ? state.network.id : state.kind === "rename-campus" ? state.campus.id : null
  const taken = (isNetwork ? networks : campuses).some((item) => item.id !== currentId && item.name.toLowerCase() === name.trim().toLowerCase())
  const unchanged = (state.kind === "rename-network" && name.trim() === state.network.name) || (state.kind === "rename-campus" && name.trim() === state.campus.name)
  const valid = name.trim() !== "" && !taken && !unchanged && (state.kind !== "add-campus" || networkId !== "")
  const copy = {
    "add-network": { title: "Add network", description: "Networks group campuses for reports.", label: "Network name", button: "Add network" },
    "rename-network": { title: "Rename network", description: "Reports show the new name for every campus in it.", label: "Name", button: "Save name" },
    "add-campus": { title: "Add campus", description: "Campers choose their campus when they register.", label: "Campus name", button: "Add campus" },
    "rename-campus": { title: "Rename campus", description: "Every registration at this campus is updated too.", label: "Name", button: "Save name" },
  }[state.kind]

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{copy.description}</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label={`Close ${copy.title.toLowerCase()}`} className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {copy.label}
            <Input className="bg-muted/40" maxLength={placeNameMaxChars} value={name} onChange={(event) => setName(event.target.value)} />
            {taken && <span className="text-sm font-normal text-destructive">A {isNetwork ? "network" : "campus"} with this name already exists.</span>}
          </label>
          {state.kind === "add-campus" && (
            <label className="flex flex-col gap-2 text-sm font-medium">
              Network
              <Select value={networkId} onValueChange={setNetworkId}>
                <SelectTrigger className="w-full bg-muted/40"><SelectValue placeholder="Choose a network" /></SelectTrigger>
                <SelectContent>{[...networks].sort(byName).map((network) => <SelectItem key={network.id} value={network.id}>{network.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
          )}
        </div>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <LoadingButton type="button" pending={pending} loadingLabel="Saving..." disabled={!valid} onClick={() => run(() => onSave(name.trim(), networkId), "save the name")}>{copy.button}</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({ target, onCancel, onConfirm, onShowCampuses }: { target: { id: string; name: string; kind: "campus" | "network"; campers?: number; campuses?: number } | null; onCancel: () => void; onConfirm: () => void; onShowCampuses: (networkId: string) => void }) {
  const { pending, run } = useAction()
  const blocked = target?.kind === "network" && (target.campuses ?? 0) > 0
  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 pr-8 text-base font-bold leading-none tracking-tight"><AlertCircle className="text-destructive" />{blocked ? `Can't delete ${target?.name} yet` : `Delete ${target?.kind}?`}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {blocked
              ? <>It still has <strong className="text-foreground">{plural(target?.campuses ?? 0, "campus")}</strong>. Move them to another network first, then delete it.</>
              : target?.kind === "campus"
                ? target.campers
                  ? <><strong className="text-foreground">{target.name}</strong> will no longer be available for new registrations. The <strong className="text-foreground">{target.campers} campers</strong> already registered keep it across all camps and editions, and reports show it as <strong className="text-foreground">{target.name} (deleted)</strong>.</>
                  : <>No camper has registered at <strong className="text-foreground">{target.name}</strong>, so it is removed completely.</>
                : <>This permanently deletes the <strong className="text-foreground">{target?.name}</strong> network.</>}
          </DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close delete dialog" className="absolute right-0 top-0" onClick={onCancel}><X className="size-4" /></Button>
        </DialogHeader>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          {blocked
            ? <Button type="button" onClick={() => target && onShowCampuses(target.id)}>Show its campuses</Button>
            : <LoadingButton type="button" pending={pending} loadingLabel="Deleting..." onClick={() => run(onConfirm, `delete the ${target?.kind}`)}>Delete {target?.kind}</LoadingButton>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MoveDialog({ campus, networks, onClose, onMove }: { campus: Campus | null; networks: Network[]; onClose: () => void; onMove: (networkId: string) => void }) {
  const { pending, run } = useAction()
  const [networkId, setNetworkId] = React.useState("")
  React.useEffect(() => { if (campus) setNetworkId(campus.networkId) }, [campus])

  return (
    <Dialog open={campus !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">Move campus</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Reports count <strong className="text-foreground">{campus?.name}</strong>&apos;s campers under the new network.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close move campus" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Network
            <Select value={networkId} onValueChange={setNetworkId}>
              <SelectTrigger className="w-full bg-muted/40"><SelectValue /></SelectTrigger>
              <SelectContent>{[...networks].sort(byName).map((network) => <SelectItem key={network.id} value={network.id}>{network.name}{network.id === campus?.networkId ? " (current)" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </label>
        </div>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <LoadingButton type="button" pending={pending} loadingLabel="Moving..." disabled={!campus || networkId === campus.networkId} onClick={() => run(() => onMove(networkId), "move the campus")}>Move campus</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CampusesAndNetworksScreen() {
  const [networks, setNetworks] = React.useState(initialNetworks)
  const [campuses, setCampuses] = React.useState(initialCampuses)
  const [query, setQuery] = React.useState("")
  // Campuses stay grouped by network; the Campus heading flips to Z to A inside each group, and a second click goes back to A to Z.
  const [campusSort, setCampusSort] = React.useState<SortState>(null)
  const toggleCampusSort = () => setCampusSort((current) => (current?.direction === "desc" ? null : { key: "campus", direction: "desc" }))
  const [networkFilter, setNetworkFilter] = React.useState("all")
  const [nameDialog, setNameDialog] = React.useState<NameDialogState | null>(null)
  const [deleting, setDeleting] = React.useState<{ id: string; name: string; kind: "campus" | "network"; campers?: number; campuses?: number } | null>(null)
  const [tab, setTab] = React.useState("networks")
  const [moving, setMoving] = React.useState<Campus | null>(null)

  const sortedNetworks = [...networks].sort(byName)
  const campusesIn = (networkId: string) => campuses.filter((campus) => campus.networkId === networkId).sort(byName)
  const matches = (campus: Campus) => campus.name.toLowerCase().includes(query.trim().toLowerCase())
  const groups = sortedNetworks
    .filter((network) => networkFilter === "all" || network.id === networkFilter)
    .map((network) => ({ network, members: campusesIn(network.id).filter(matches) }))
    .filter((group) => group.members.length > 0)

  const save = (name: string, networkId: string) => {
    if (!nameDialog) return
    if (nameDialog.kind === "add-network") {
      setNetworks((current) => [...current, { id: `network-${Date.now()}`, name }])
      toast.success("Network successfully added")
    } else if (nameDialog.kind === "rename-network") {
      const { id } = nameDialog.network
      setNetworks((current) => current.map((network) => (network.id === id ? { ...network, name } : network)))
      toast.success("Network successfully renamed")
    } else if (nameDialog.kind === "add-campus") {
      setCampuses((current) => [...current, { id: `campus-${Date.now()}`, name, networkId, campers: 0 }])
      toast.success("Campus successfully added")
    } else {
      const { id } = nameDialog.campus
      setCampuses((current) => current.map((campus) => (campus.id === id ? { ...campus, name } : campus)))
      toast.success("Campus successfully renamed")
    }
    setNameDialog(null)
  }

  const confirmDelete = () => {
    if (!deleting) return
    if (deleting.kind === "campus") {
      // A campus with registrations is archived (reports keep it, marked deleted); one with none is erased.
      if (deleting.campers) markCampusDeleted(deleting.name)
      setCampuses((current) => current.filter((campus) => campus.id !== deleting.id))
    }
    else setNetworks((current) => current.filter((network) => network.id !== deleting.id))
    toast.success(deleting.kind === "campus" ? "Campus successfully deleted" : "Network successfully deleted")
    setDeleting(null)
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <div className="text-base font-semibold tabular-nums">{networks.length}</div>
          <div className="text-sm text-muted-foreground">Networks</div>
        </div>
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <div className="text-base font-semibold tabular-nums">{campuses.length}</div>
          <div className="text-sm text-muted-foreground">Campuses</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger className="w-full" value="networks">Networks</TabsTrigger>
          <TabsTrigger className="w-full" value="campuses">Campuses</TabsTrigger>
        </TabsList>

        <TabsContent value="networks">
          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Networks</CardTitle>
              <CardDescription>Networks group campuses for reports. Shared by MYF and MYA.</CardDescription>
              <CardAction><Button type="button" onClick={() => setNameDialog({ kind: "add-network" })}><IconPlus />Add network</Button></CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {sortedNetworks.map((network) => {
                  const members = campusesIn(network.id)
                  return (
                    <section key={network.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border">
                      <div className="flex items-start justify-between gap-6 p-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="text-base font-bold leading-none">{network.name}</h3>
                          <p className="text-sm text-muted-foreground tabular-nums">{plural(members.length, "campus")}</p>
                        </div>
                        <MoreMenu label={`More actions for ${network.name}`}>
                          <DropdownMenuItem onSelect={() => setNameDialog({ kind: "add-campus", networkId: network.id })}>Add campus to network</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setNameDialog({ kind: "rename-network", network })}>Rename network</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting({ id: network.id, name: network.name, kind: "network", campuses: members.length })}>Delete network</DropdownMenuItem>
                        </MoreMenu>
                      </div>
                      <div className="flex flex-1 flex-wrap content-start gap-2 border-t bg-muted/40 p-4">
                        {members.length > 0
                          ? members.map((campus) => <span key={campus.id} className="rounded-md border bg-muted/50 px-2.5 py-1 text-sm">{campus.name}</span>)
                          : <span className="text-sm text-muted-foreground">No campuses yet.</span>}
                      </div>
                    </section>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campuses">
          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Campuses</CardTitle>
              <CardDescription>Every campus campers can choose when they register. Changes apply to every report.</CardDescription>
              <CardAction><Button type="button" onClick={() => setNameDialog({ kind: "add-campus" })}><IconPlus />Add campus</Button></CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative max-w-md flex-1">
                  <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="border bg-muted/50 pl-8" aria-label="Search by campus name" placeholder="Search by campus name" value={query} onChange={(event) => setQuery(event.target.value)} />
                </div>
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger className="w-40" aria-label="Network"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All networks</SelectItem>
                    {sortedNetworks.map((network) => <SelectItem key={network.id} value={network.id}>{network.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <SortableHead label="Campus" sortKey="campus" sort={campusSort} onSort={toggleCampusSort} />
                      <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map(({ network, members }) => (
                      <React.Fragment key={network.id}>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={2} className="whitespace-nowrap py-2 text-xs font-medium text-muted-foreground">{network.name} · <span className="tabular-nums">{plural(campusesIn(network.id).length, "campus")}</span></TableCell>
                        </TableRow>
                        {[...members].sort((a, b) => byText(a.name, b.name) * (campusSort?.direction === "desc" ? -1 : 1)).map((campus) => (
                          <TableRow key={campus.id} className="hover:bg-muted/50">
                            <TableCell className="w-full whitespace-nowrap font-medium">{campus.name}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <MoreMenu label="More actions">
                                <DropdownMenuItem onSelect={() => setNameDialog({ kind: "rename-campus", campus })}>Rename campus</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setMoving(campus)}>Move to network…</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting({ id: campus.id, name: campus.name, kind: "campus", campers: campus.campers })}>Delete campus</DropdownMenuItem>
                              </MoreMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                    {groups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">No campuses match your search.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NameDialog state={nameDialog} networks={networks} campuses={campuses} onClose={() => setNameDialog(null)} onSave={save} />
      <DeleteDialog target={deleting} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} onShowCampuses={(networkId) => { setDeleting(null); setQuery(""); setNetworkFilter(networkId); setTab("campuses") }} />
      <MoveDialog
        campus={moving}
        networks={networks}
        onClose={() => setMoving(null)}
        onMove={(networkId) => { const id = moving?.id; setCampuses((current) => current.map((campus) => (campus.id === id ? { ...campus, networkId } : campus))); setMoving(null); toast.success("Campus successfully moved") }}
      />
    </main>
  )
}
