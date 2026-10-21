import { AppSidebar } from '@/components/app-sidebar'
import { AuditLogScreen } from '@/components/audit-log'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/ui/sidebar'

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; camp?: string; area?: string }> }) {
  const { q, camp, area } = await searchParams

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Audit log" />
        <AuditLogScreen initialQuery={q} initialCamp={camp} initialArea={area} />
      </SidebarInset>
    </SidebarProvider>
  )
}
