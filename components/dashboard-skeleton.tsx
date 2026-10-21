import { Card, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

// The roster shows ten campers a page.
const rosterRows = 10

function CardHeaderSkeleton() {
  return (
    <CardHeader>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-56" />
    </CardHeader>
  )
}

function DonutCardSkeleton() {
  return (
    <Card className="min-w-0">
      <CardHeaderSkeleton />
      <CardContent>
        <div className="relative mx-auto flex h-56 w-full max-w-xs items-center justify-center">
          <Skeleton className="aspect-square h-[78%] rounded-full" />
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-full max-w-md" />
      <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr]">
        <DonutCardSkeleton />
        <DonutCardSkeleton />
        <div className="md:col-span-2 xl:col-span-1">
          <Card className="min-w-0 overflow-hidden">
            <CardHeaderSkeleton />
            <CardContent>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-[70px] rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index} className="flex flex-col shadow-none">
            <CardHeaderSkeleton />
            <CardContent className="mt-auto">
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="shadow-none">
        <CardHeaderSkeleton />
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-8 max-w-md flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-12 border-b bg-muted/50" />
            {Array.from({ length: rosterRows }, (_, index) => (
              <div key={index} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="hidden h-4 flex-1 md:block" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-52" />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
