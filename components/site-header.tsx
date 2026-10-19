'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/ui/button'
import { SidebarTrigger } from '@/ui/sidebar'

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="outline"
      size="icon"
      className="ml-auto rounded-full"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className={`flex size-6 items-center justify-center rounded-full ${!isDark ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}><Sun className="size-4" /></span>
      <span className={`flex size-6 items-center justify-center rounded-full ${isDark ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}><Moon className="size-4" /></span>
      <span className="sr-only">Switch to {isDark ? 'light' : 'dark'} mode</span>
    </Button>
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
