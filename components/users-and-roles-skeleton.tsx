import { Card, CardAction, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

function TableCardSkeleton({ rows, action }: { rows: number; action?: boolean }) {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-72 max-w-full" />
        {action && <CardAction><Skeleton className="h-8 w-24" /></CardAction>}
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <div className="h-10 border-b bg-muted/50" />
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="hidden h-4 flex-1 md:block" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="size-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function UsersAndRolesSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading users and roles">
      <Skeleton className="h-8 w-full max-w-md" />
      <TableCardSkeleton rows={7} action />
    </main>
  )
}
