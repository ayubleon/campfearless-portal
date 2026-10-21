"use client"

import { placeNameMaxChars } from "@/lib/validation"
import * as React from "react"
import { format } from "date-fns"
import { AlertCircle, X } from "lucide-react"
import { IconDotsVertical } from "@tabler/icons-react"
import { toast } from "sonner"

import { editionDates } from "@/lib/camp-data"
import { editions as initialEditions, type Edition } from "@/lib/editions"
import { statusClass } from "@/lib/status"
import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { LoadingButton } from "@/components/loading-button"
import { useAction } from "@/lib/use-action"
import { Button, buttonVariants } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

const formatDate = (value: Date) => format(value, "dd/MM/yyyy")

function EditionDialog({ edition, names, pending, onClose, onSave }: { edition: Edition | null; names: string[]; pending: boolean; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = React.useState(edition?.name ?? "")
  const trimmed = name.trim()
  const taken = names.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())
  const invalid = trimmed === "" || taken || trimmed === edition?.name
  return (
    <Dialog open onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent showCloseButton={false} className="gap-4 p-4 sm:max-w-lg sm:p-6">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-semibold leading-none tracking-tight">{edition ? "Rename edition" : "New edition"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Name it however you plan your camps, such as Easter 2026 or December 2026. Camp dates are set in each camp's own setup card.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close edition dialog" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Name
            <Input className="bg-muted/40" value={name} maxLength={placeNameMaxChars} onChange={(event) => setName(event.target.value)} />
            {taken && <p className="text-sm font-normal text-destructive">An edition with this name already exists.</p>}
          </label>
        </div>
        <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
          <LoadingButton type="button" pending={pending} loadingLabel="Saving..." disabled={invalid} onClick={() => onSave(trimmed)}>{edition ? "Save name" : "Create edition"}</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditionsCard({ canEdit = true }: { canEdit?: boolean }) {
  const [list, setList] = React.useState<Edition[]>(initialEditions)
  const [editing, setEditing] = React.useState<Edition | "new" | null>(null)
  const [closing, setClosing] = React.useState<Edition | null>(null)
  const { pending, run } = useAction()
  // Only one edition is open at a time: opening another closes the current one, after a confirmation.
  const [switching, setSwitching] = React.useState<{ name: string; reopen: Edition | null } | null>(null)
  const openOne = list.find((item) => item.open)
  const openEdition = (name: string, reopen: Edition | null) => {
    setList((current) => {
      const closed = current.map((item) => ({ ...item, open: false }))
      return reopen ? closed.map((item) => (item.id === reopen.id ? { ...item, open: true } : item)) : [{ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, open: true, facilitatorFee: closed[0]?.facilitatorFee ?? 0 }, ...closed]
    })
    toast.success(reopen ? "Edition successfully reopened" : "Edition successfully created")
  }
  // The year comes from the edition's camp dates (editions are named freely); one without dates yet counts as this year.
  const yearOf = (id: string) => editionDates(id)?.start.getFullYear() ?? new Date().getFullYear()
  const years = [...new Set(list.map((item) => yearOf(item.id)))].sort((a, b) => b - a)
  const openYear = yearOf(initialEditions.find((item) => item.open)?.id ?? initialEditions[0].id)
  const [year, setYear] = React.useState(String(openYear))
  const shown = year === "all" ? list : list.filter((item) => String(yearOf(item.id)) === year)
  const dates = (id: string) => { const range = editionDates(id); return range ? `${formatDate(range.start)} - ${formatDate(range.end)}` : "-" }
  const patch = (id: string, change: Partial<Edition>) => setList((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)))

  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Camp editions</CardTitle>
        <CardDescription>One run of the camps. Registrations, payments and waivers belong to the edition they were made in.</CardDescription>
        {canEdit && <CardAction><Button type="button" variant="outline" onClick={() => setEditing("new")}>New edition</Button></CardAction>}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-36" aria-label="Year"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground tabular-nums">{shown.length} of {list.length} editions</p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="whitespace-nowrap">Edition</TableHead>
                <TableHead className="whitespace-nowrap">Dates</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                {canEdit && <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((edition) => (
                <TableRow key={edition.id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap font-medium">{edition.name}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{dates(edition.id)}</TableCell>
                  <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(edition.open ? "Open" : "Closed"))}>{edition.open ? "Open" : "Closed"}</Badge></TableCell>
                  {canEdit && (
                    <TableCell className="whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="More actions"><IconDotsVertical /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
                          <DropdownMenuItem onSelect={() => setEditing(edition)}>Rename edition</DropdownMenuItem>
                          {edition.open ? (
                            <DropdownMenuItem onSelect={() => setClosing(edition)}>Close edition</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => (openOne ? setSwitching({ name: edition.name, reopen: edition }) : openEdition(edition.name, edition))}>Reopen edition</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {editing && (
        <EditionDialog
          edition={editing === "new" ? null : editing}
          names={list.filter((item) => item !== editing).map((item) => item.name)}
          onClose={() => setEditing(null)}
          pending={pending}
          onSave={async (name) => {
            if (editing === "new") {
              if (openOne) { setSwitching({ name, reopen: null }); setEditing(null); return }
              if (!(await run(() => openEdition(name, null), "create the edition"))) return
            } else {
              if (!(await run(() => patch(editing.id, { name }), "rename the edition"))) return
              toast.success("Edition successfully renamed")
            }
            setEditing(null)
          }}
        />
      )}

      <Dialog open={switching !== null} onOpenChange={(next) => { if (!next) setSwitching(null) }}>
        <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 pr-10 text-lg font-semibold leading-none tracking-tight"><AlertCircle className="text-destructive" />Open {switching?.name} and close {openOne?.name}?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Only one edition is open at a time. <strong className="text-foreground">{openOne?.name}</strong> becomes read-only: registration, check-in, waivers and payment verification stop for it. Its records stay in Reports.
            </DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" className="absolute right-0 top-0" onClick={() => setSwitching(null)}><X className="size-4" /></Button>
          </DialogHeader>
          <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setSwitching(null)}>Cancel</Button>
            <LoadingButton type="button" pending={pending} loadingLabel="Opening..." onClick={async () => { if (!switching) return; if (!(await run(() => openEdition(switching.name, switching.reopen), "open the edition"))) return; setSwitching(null) }}>Open edition</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closing !== null} onOpenChange={(next) => { if (!next) setClosing(null) }}>
        <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
          <DialogHeader className="relative space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 pr-10 text-lg font-semibold leading-none tracking-tight"><AlertCircle className="text-destructive" />Close {closing?.name}?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              <strong className="text-foreground">{closing?.name}</strong> becomes read-only. Registration, check-in, waivers and payment verification stop for it, and its welcome page link stops taking sign-ups. Its records stay in Reports, and you can reopen it later.
            </DialogDescription>
            <Button type="button" variant="ghost" size="icon" aria-label="Close dialog" className="absolute right-0 top-0" onClick={() => setClosing(null)}><X className="size-4" /></Button>
          </DialogHeader>
          <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setClosing(null)}>Cancel</Button>
            <LoadingButton type="button" pending={pending} loadingLabel="Closing..." onClick={async () => { if (!closing) return; if (!(await run(() => patch(closing.id, { open: false }), "close the edition"))) return; setClosing(null); toast.success("Edition successfully closed") }}>Close edition</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
