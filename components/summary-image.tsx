"use client"

import * as React from "react"
import Image from "next/image"
import { format } from "date-fns"
import { IconDownload } from "@tabler/icons-react"
import { X } from "lucide-react"
import { toast } from "sonner"

import { formatDateTime } from "@/lib/format"
import { currentUser } from "@/lib/session"
import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"

// The saved image is always light, so it looks the same when shared whatever theme the portal is in.
const ink = "#0a0a0a"
const muted = "#525252"
const line = "#e5e5e5"
const tileFill = "rgba(255, 255, 255, 0.88)" // a little see-through so the background shows around and behind the tiles
const orange = "#f05a22" // the Mavuno and Camp Fearless brand orange
const width = 1280
const pad = 56
const columns = 3
const gap = 20
const tilePad = 28
const valueSize = 44
const labelSize = 22
const labelLine = 28
const footerSize = 18
const backgroundVeil = 0.62 // how much white covers the texture: 0 is the raw texture, 1 is plain white
const jpegQuality = 0.88 // a textured background makes a PNG several MB; a JPEG is a fraction of that

type Item = [value: string, label: string]
type Snapshot = { canvas: HTMLCanvasElement; url: string; createdAt: Date; width: number; height: number }

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

// Splits a label into lines that fit the tile.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let current = ""
  text.split(" ").forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  })
  if (current) lines.push(current)
  return lines
}

// The logo is dark on a transparent background; painting over what is drawn keeps only its shape, in orange.
function orangeLogo(logo: HTMLImageElement, w: number, h: number) {
  const canvas = document.createElement("canvas")
  canvas.width = w * 2
  canvas.height = h * 2
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(logo, 0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = "source-in"
  ctx.fillStyle = orange
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

async function drawSummary(items: Item[], createdAt: Date, scopeLabel: string): Promise<Snapshot> {
  await document.fonts.ready
  const logo = new window.Image()
  logo.src = "/camp-fearless-logo.png"
  const background = new window.Image()
  background.src = "/camp-summary-background.webp"
  await Promise.all([logo.decode().catch(() => undefined), background.decode().catch(() => undefined)])

  const font = getComputedStyle(document.body).fontFamily || "sans-serif"
  const scale = 2
  const tileWidth = (width - pad * 2 - gap * (columns - 1)) / columns

  // Measure first: every tile is as tall as the one with the most label lines.
  const measure = document.createElement("canvas").getContext("2d")!
  measure.font = `400 ${labelSize}px ${font}`
  const maxLines = Math.max(...items.map(([, label]) => wrapText(measure, label, tileWidth - tilePad * 2).length))
  const tileHeight = tilePad + valueSize + 14 + maxLines * labelLine + tilePad - 8
  const rows = Math.ceil(items.length / columns)

  const logoHeight = 88
  const headerHeight = logoHeight + 80 // room between the title block and the tiles
  const footerHeight = 112 // room between the tiles and the created line
  const height = pad + headerHeight + rows * tileHeight + (rows - 1) * gap + footerHeight

  const canvas = document.createElement("canvas")
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext("2d")!
  ctx.scale(scale, scale)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)
  // The textured background fills the image (cropped to fit, never stretched).
  if (background.naturalWidth) {
    const fit = Math.max(width / background.naturalWidth, height / background.naturalHeight)
    const w = background.naturalWidth * fit
    const h = background.naturalHeight * fit
    ctx.drawImage(background, (width - w) / 2, (height - h) / 2, w, h)
    // A white veil lifts the grey towards the white of the tiles; the rings stay as a soft hint.
    ctx.fillStyle = `rgba(255, 255, 255, ${backgroundVeil})`
    ctx.fillRect(0, 0, width, height)
  }

  // Header: orange logo, title in capitals and the subtitle.
  const logoWidth = logo.naturalWidth ? (logo.naturalWidth / logo.naturalHeight) * logoHeight : 0
  if (logoWidth) ctx.drawImage(orangeLogo(logo, Math.round(logoWidth), logoHeight), pad, pad, logoWidth, logoHeight)
  const textX = pad + logoWidth + (logoWidth ? 28 : 0)
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = orange
  ctx.font = `800 48px ${font}`
  ctx.fillText("CAMP FEARLESS", textX, pad + 46)
  ctx.fillStyle = muted
  ctx.font = `500 30px ${font}`
  ctx.fillText(`Quick summary · ${scopeLabel}`, textX, pad + 86)

  // Tiles, three to a row. A last odd tile spans what is left of its row.
  const top0 = pad + headerHeight
  items.forEach(([value, label], index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const isLast = index === items.length - 1
    const span = isLast ? columns - column : 1
    const x = pad + column * (tileWidth + gap)
    const w = tileWidth * span + gap * (span - 1)
    const top = top0 + row * (tileHeight + gap)
    roundedRect(ctx, x, top, w, tileHeight, 20)
    ctx.fillStyle = tileFill
    ctx.fill()
    ctx.strokeStyle = line
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = ink
    ctx.font = `700 ${valueSize}px ${font}`
    ctx.fillText(value, x + tilePad, top + tilePad + valueSize - 8)
    ctx.fillStyle = muted
    ctx.font = `400 ${labelSize}px ${font}`
    wrapText(ctx, label, w - tilePad * 2).forEach((text, lineIndex) => {
      ctx.fillText(text, x + tilePad, top + tilePad + valueSize + 14 + lineIndex * labelLine + labelLine - 8)
    })
  })

  // Footer: when it was created, and by whom.
  const footerY = top0 + rows * tileHeight + (rows - 1) * gap + 84
  ctx.fillStyle = muted
  ctx.font = `400 ${footerSize}px ${font}`
  ctx.fillText(`Created ${formatDateTime(createdAt)} by ${currentUser.name}`, pad, footerY)

  return { canvas, url: canvas.toDataURL("image/jpeg", jpegQuality), createdAt, width, height }
}

export function SummaryImageDialog({ open, items, scopeLabel, onClose }: { open: boolean; items: Item[]; scopeLabel: string; onClose: () => void }) {
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null)
  const [failed, setFailed] = React.useState(false)

  // A new image, with a new timestamp, every time the dialog opens.
  React.useEffect(() => {
    if (!open) { setSnapshot(null); return }
    let cancelled = false
    setFailed(false)
    drawSummary(items, new Date(), scopeLabel)
      .then((result) => { if (!cancelled) setSnapshot(result) })
      .catch(() => { if (!cancelled) { setFailed(true); toast.error("Failed to create the image. Something went wrong on our end. Please try again.") } })
    return () => { cancelled = true }
  }, [open, items, scopeLabel])

  const download = () => {
    if (!snapshot) return
    snapshot.canvas.toBlob((blob) => {
      if (!blob) { toast.error("Failed to download image. Something went wrong on our end. Please try again."); return }
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `camp-fearless-quick-summary-${scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${format(snapshot.createdAt, "yyyy-MM-dd-HHmm")}.jpg`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success("Summary image successfully downloaded")
    }, "image/jpeg", jpegQuality)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader className="relative space-y-1 pr-10 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">Quick summary image</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">A snapshot you can save or share. It shows when it was created.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close summary image" className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
        </DialogHeader>
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {snapshot ? (
              <Image src={snapshot.url} alt={`Quick summary created ${formatDateTime(snapshot.createdAt)}`} width={snapshot.width} height={snapshot.height} unoptimized className="h-auto w-full rounded-lg border" />
            ) : failed ? (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg border bg-muted/20 px-6 text-center text-sm text-muted-foreground">The image couldn&apos;t be created on this device. Close this and try again.</div>
            ) : (
              <div className="aspect-[4/5] w-full animate-pulse rounded-lg border bg-muted/40" aria-busy="true" />
            )}
          </div>
          <DialogFooter className="-mx-4 -mb-4 mt-4 shrink-0 flex-row justify-end gap-3 px-4 py-4 sm:-mx-6 sm:-mb-6 sm:mt-6 sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="button" disabled={!snapshot} onClick={download}><IconDownload />Download image</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
