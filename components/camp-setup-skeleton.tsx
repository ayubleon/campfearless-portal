import { Card, CardAction, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

function ColumnSkeleton({ fields }: { fields: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: fields }, (_, index) => <FieldSkeleton key={index} />)}
    </div>
  )
}

function SetupCardSkeleton({ columns }: { columns: number[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-60" />
        <CardAction><Skeleton className="h-8 w-14" /></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          {columns.map((fields, index) => <ColumnSkeleton key={index} fields={fields} />)}
        </div>
        <div className="pt-2">
          <Skeleton className="h-3 w-48" />
        </div>
      </CardContent>
    </Card>
  )
}

export function CampSetupSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading camp setup">
      <SetupCardSkeleton columns={[3, 2, 4]} />
      <SetupCardSkeleton columns={[3, 2, 4]} />
      <SetupCardSkeleton columns={[1]} />
    </main>
  )
}
