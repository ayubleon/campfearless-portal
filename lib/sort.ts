import * as React from "react"

// Click a table heading to sort by it: ascending first, then descending, and a third click goes back to the table's
// own default order (so does refreshing the page). The default is what shows until a heading is clicked.
export type SortDirection = "asc" | "desc"
export type SortState = { key: string; direction: SortDirection } | null

// Ascending comparators. Names are stored "First Last", so comparing the whole string sorts by first name, then last.
export const byText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base", numeric: true })
export const byNumber = (a: number, b: number) => a - b
export const byDate = (a: Date, b: Date) => a.getTime() - b.getTime()

// For statuses: groups in a meaningful order rather than A to Z. Anything not listed goes last.
export function byRank(order: string[]) {
  const rank = (value: string) => { const index = order.indexOf(value); return index === -1 ? order.length : index }
  return (a: string, b: string) => rank(a) - rank(b)
}

// Sorts rows by the clicked heading, falling back to the table's default order for ties and when nothing is clicked.
export function useSortedRows<T>(rows: T[], comparators: Record<string, (a: T, b: T) => number>, defaultCompare: (a: T, b: T) => number) {
  const [sort, setSort] = React.useState<SortState>(null)
  const toggle = React.useCallback((key: string) => setSort((current) => (current?.key !== key ? { key, direction: "asc" } : current.direction === "asc" ? { key, direction: "desc" } : null)), [])
  const sorted = [...rows].sort((a, b) => {
    const compare = sort ? comparators[sort.key] : undefined
    const primary = compare ? compare(a, b) * (sort!.direction === "asc" ? 1 : -1) : 0
    return primary || defaultCompare(a, b)
  })
  return { rows: sorted, sort, toggle }
}
