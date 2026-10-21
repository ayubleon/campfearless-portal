"use client"

import * as React from "react"
import Image from "next/image"
import { IconArrowRight, IconCalendar, IconCheck } from "@tabler/icons-react"
import { X } from "lucide-react"

import type { CampId } from "@/lib/camp-data"
import { cn } from "@/lib/utils"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Card, CardContent } from "@/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"

// A copy of the public welcome page's camp card and requirements dialog (the page lives in its own project),
// drawn from what is typed in the Welcome page card so staff can check it before saving.
export type PreviewCamp = {
  id: CampId
  label: string
  name: string
  ageLabel: string
  description: string
  image: string
  dates: string
  fee: string
  register: { open: boolean; label: string }
  bring: string[]
  expect: string[]
  know: string[]
}

const cardBringCount = 3

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground marker:text-foreground/40">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}

function PreviewCard({ camp, onSeeList }: { camp: PreviewCamp; onSeeList: (id: CampId) => void }) {
  const accent = camp.id === "MYF" && camp.register.open && "bg-camp-accent text-camp-accent-foreground hover:bg-camp-accent-hover"
  return (
    <Card className="min-w-0 gap-0 overflow-hidden p-0 shadow-none">
      <div className="relative aspect-[16/9] bg-muted">
        <Image src={camp.image} alt={`${camp.id} camp image`} fill sizes="(min-width: 768px) 400px, 100vw" unoptimized loading="eager" className="object-cover" />
        <Badge className="absolute left-4 top-4 h-6 bg-foreground px-2.5 text-xs text-background">{camp.ageLabel}</Badge>
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold leading-tight">{camp.name}</h2>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums"><IconCalendar className="size-4 text-muted-foreground" />{camp.dates}</p>
          <p className="text-sm text-muted-foreground">{camp.description}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 px-4 py-3">
          <h3 className="text-sm font-semibold">What to bring</h3>
          <ul className="flex flex-col gap-1.5">
            {camp.bring.slice(0, cardBringCount).map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><IconCheck className="mt-0.5 size-4 shrink-0" />{item}</li>
            ))}
          </ul>
          <Button type="button" variant="link" className="h-auto justify-start p-0 text-sm text-foreground underline" onClick={() => onSeeList(camp.id)}>
            See the full list for {camp.id}
          </Button>
        </div>
        <div className="-mx-4 -mb-4 mt-auto flex flex-col gap-3 border-t bg-muted/50 p-4 sm:-mx-6 sm:-mb-6 sm:p-6">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Registration fee</span>
            <strong className="font-semibold tabular-nums">{camp.fee}</strong>
          </div>
          <Button type="button" disabled={!camp.register.open} className={cn("w-full", accent)}>
            {camp.register.label}
            {camp.register.open && <IconArrowRight />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function WelcomePreviewDialog({ open, camps, onClose }: { open: boolean; camps: PreviewCamp[]; onClose: () => void }) {
  const [view, setView] = React.useState("cards")
  const [camp, setCamp] = React.useState<CampId>("MYF")

  React.useEffect(() => { if (open) setView("cards") }, [open])

  const seeList = (id: CampId) => { setCamp(id); setView("requirements") }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 p-4 sm:max-w-4xl sm:p-6">
        <DialogHeader className="relative space-y-1 pr-10 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">Preview welcome page</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">How campers will see it, using what is typed here. Nothing is saved until you save.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close preview" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            <Tabs value={view} onValueChange={setView} className="w-fit">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger className="w-full" value="cards">Camp cards</TabsTrigger>
                <TabsTrigger className="w-full" value="requirements">Requirements</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">Names, dates, fees and registration status come from each camp&apos;s setup. Only the first {cardBringCount} items under What to bring show on the card.</p>
            <div className="force-light flex flex-col gap-4 rounded-xl bg-muted/40 p-4 sm:p-6" aria-label="Preview of the welcome page">
              {view === "cards" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {camps.map((item) => <PreviewCard key={item.id} camp={item} onSeeList={seeList} />)}
                </div>
              ) : (
                <Tabs value={camp} onValueChange={(value) => setCamp(value as CampId)} className="flex flex-col gap-4">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    {camps.map((item) => <TabsTrigger key={item.id} className="w-full" value={item.id}>{item.label}</TabsTrigger>)}
                  </TabsList>
                  {camps.map((item) => (
                    <TabsContent key={item.id} value={item.id} className="flex flex-col gap-5 rounded-xl border bg-background p-4 sm:p-6">
                      <p className="text-sm text-muted-foreground"><strong className="text-foreground">{item.name}</strong> runs {item.dates}.</p>
                      <Section title="What to bring" items={item.bring} />
                      <Section title="What to expect" items={item.expect} />
                      <Section title="Good to know" items={item.know} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
          <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
