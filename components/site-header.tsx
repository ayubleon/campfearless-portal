'use client'

import { useEffect, useState } from 'react'
import { Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Switch } from '@/ui/switch'
import { SidebarTrigger } from '@/ui/sidebar'

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => setMounted(true), [])

  return (
    <div className="ml-auto flex items-center gap-2">
      <Sun className="size-4 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        disabled={!mounted}
        aria-label="Toggle dark mode"
      />
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-base font-semibold">Dashboard</h1>
        <ThemeToggle />
      </div>
    </header>
  )
}
