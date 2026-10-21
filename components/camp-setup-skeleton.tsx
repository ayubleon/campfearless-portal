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

function WelcomeCardSkeleton() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <CardAction><Skeleton className="h-8 w-14" /></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-8 w-full max-w-md" />
        <div className="grid gap-x-4 gap-y-6 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-[70px]" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="aspect-[16/9] w-full max-w-sm" />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-36" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
        <Skeleton className="h-3 w-48" />
      </CardContent>
    </Card>
  )
}

export function CampSetupSkeleton() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading camp setup">
      <WelcomeCardSkeleton />
      <SetupCardSkeleton columns={[3, 2, 4]} />
      <SetupCardSkeleton columns={[3, 2, 4]} />
      <SetupCardSkeleton columns={[1]} />
    </main>
  )
}
