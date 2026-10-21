"use client"

import { IconArrowDown, IconArrowsSort, IconArrowUp } from "@tabler/icons-react"

import type { SortState } from "@/lib/sort"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { TableHead } from "@/ui/table"

// A table heading that sorts the table when clicked. Shows an arrow for the current sort and a faint one on hover.
export function SortableHead({ label, sortKey, sort, onSort, className }: { label: string; sortKey: string; sort: SortState; onSort: (key: string) => void; className?: string }) {
  const active = sort?.key === sortKey
  const Icon = !active ? IconArrowsSort : sort.direction === "asc" ? IconArrowUp : IconArrowDown
  return (
    <TableHead className={cn("whitespace-nowrap", className)} aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}>
      <Button type="button" variant="ghost" className="group -mx-2.5 h-7 gap-1 px-2.5 font-medium" onClick={() => onSort(sortKey)}>
        {label}
        <Icon className={cn("size-3.5", active ? "text-foreground" : "text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100")} />
      </Button>
    </TableHead>
  )
}
