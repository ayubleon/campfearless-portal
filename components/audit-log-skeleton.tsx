import { Card, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

export function AuditLogSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading audit log">
      <Card className="min-w-0 shadow-none">
        <CardHeader className="gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-8 max-w-md flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-8 w-44" />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-10 border-b bg-muted/50" />
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="hidden h-4 flex-1 md:block" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
