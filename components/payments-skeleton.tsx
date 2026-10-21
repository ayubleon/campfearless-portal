import { Card, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

export function PaymentsSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading payments">
      <Card className="min-w-0 shadow-none">
        <CardHeader className="gap-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Skeleton className="h-8 max-w-md flex-1" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-[70px] rounded-lg" />)}
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="h-10 border-b bg-muted/50" />
            {Array.from({ length: 13 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                <Skeleton className="h-5 w-28 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="hidden h-4 w-16 md:block" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
