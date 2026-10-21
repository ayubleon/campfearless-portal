import { pageCount } from "@/lib/paging"
import { Button } from "@/ui/button"

// The footer under a long table: which rows are showing, and Previous and Next. `pageCount` is in lib/paging.ts.

export function TablePagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const pages = pageCount(total, pageSize)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground tabular-nums">Showing {from}-{to} of {total}</p>
      <div className="flex items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground tabular-nums">Page {page} of {pages}</span>
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button type="button" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  )
}
