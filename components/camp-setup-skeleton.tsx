import { Card, CardAction, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

export function CampSetupSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading camp setup">
      <Skeleton className="h-8 w-full max-w-md" />
      <Card className="shadow-none">
        <CardHeader>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <CardAction><Skeleton className="h-8 w-28" /></CardAction>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-10 border-b bg-muted/50" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
