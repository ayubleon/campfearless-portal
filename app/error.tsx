"use client"

import Link from "next/link"

import { Button } from "@/ui/button"

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-base font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Something went wrong on our end. Please try again.</p>
      <div className="flex gap-3">
        <Button variant="outline" asChild><Link href="/dashboard">Go to dashboard</Link></Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
