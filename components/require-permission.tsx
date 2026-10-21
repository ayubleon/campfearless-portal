"use client"

import * as React from "react"
import Link from "next/link"

import { useSession } from "@/components/session-provider"
import { Button } from "@/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/ui/card"

// Wraps a screen: a role without the permission sees this card instead of the screen (the sidebar hides the item too).
// The real server must refuse the same calls with a 403.
export function RequirePermission({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { can, user } = useSession()
  if (can(permission)) return <>{children}</>
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">You don&apos;t have access to this page</CardTitle>
          <CardDescription>The {user.role} role can&apos;t open it. Ask a Super admin if you need it.</CardDescription>
          <CardAction><Button asChild variant="outline"><Link href="/dashboard">Go to dashboard</Link></Button></CardAction>
        </CardHeader>
      </Card>
    </main>
  )
}
