import * as React from "react"
import Link from "next/link"

import { editions } from "@/lib/editions"
import { Button } from "@/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/ui/card"

// Registration, Waivers and Payments only work on the open edition. Closed editions are read-only and live in Reports.
// With no open edition the screen is replaced by a card that points to Camp setup.
export function EditionScope({ children }: { children: React.ReactNode }) {
  const edition = editions.find((item) => item.open)
  if (!edition) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">No edition is open</CardTitle>
          <CardDescription>Open or create an edition in Camp setup to register campers, issue waivers and verify payments.</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href="/camp-setup">Go to Camp setup</Link>
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    )
  }
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Edition: <strong className="text-foreground">{edition.name}</strong>
      </p>
      {children}
    </>
  )
}
