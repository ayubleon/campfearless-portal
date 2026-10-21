import { Card, CardAction, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

export function CampusesAndNetworksSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading campuses and networks">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[70px] rounded-lg" />
        <Skeleton className="h-[70px] rounded-lg" />
      </div>
      <Skeleton className="h-8 w-full max-w-md" />
      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <CardAction><Skeleton className="h-8 w-28" /></CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex flex-col overflow-hidden rounded-xl border">
                <div className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex flex-1 flex-wrap content-start gap-2 border-t bg-muted/40 p-4">
                  {Array.from({ length: 6 }, (_, chip) => <Skeleton key={chip} className="h-7 w-20" />)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
