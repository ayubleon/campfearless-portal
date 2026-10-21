import { Card, CardAction, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

export function AccountSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="shadow-none">
        <CardHeader>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-60" />
          <CardAction><Skeleton className="h-8 w-14" /></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-72" />
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-56" />
          <CardAction><Skeleton className="h-8 w-32" /></CardAction>
        </CardHeader>
      </Card>
    </main>
  )
}
