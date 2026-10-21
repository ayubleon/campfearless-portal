import Link from "next/link"

import { Button } from "@/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-base font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">This page doesn't exist or has moved. Check the address, or go back to the dashboard.</p>
      <Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>
    </main>
  )
}
