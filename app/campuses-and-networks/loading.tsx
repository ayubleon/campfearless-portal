import { AppSidebar } from '@/components/app-sidebar'
import { CampusesAndNetworksSkeleton } from '@/components/campuses-and-networks-skeleton'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/ui/sidebar'

export default function Loading() {
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
        <SiteHeader title="Campuses and networks" />
        <CampusesAndNetworksSkeleton />
      </SidebarInset>
    </SidebarProvider>
  )
}
