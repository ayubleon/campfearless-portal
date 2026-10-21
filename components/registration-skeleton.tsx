import type * as React from "react"

import { Card, CardContent, CardHeader } from "@/ui/card"
import { Skeleton } from "@/ui/skeleton"

function FormCardSkeleton({ fields, children }: { fields: number; children?: React.ReactNode }) {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: fields }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function ChurchCampusSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-3 h-4 w-48" />
      <Skeleton className="h-[88px] rounded-2xl" />
      <Skeleton className="h-[88px] rounded-2xl" />
    </div>
  )
}

export function RegistrationSkeleton() {
  return (
    <main className="@container flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6" aria-busy="true" aria-label="Loading registration">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 @7xl:grid-cols-[minmax(0,1fr)_24rem] @7xl:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <FormCardSkeleton fields={6}><ChurchCampusSkeleton /></FormCardSkeleton>
          <FormCardSkeleton fields={5} />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </main>
  )
}
