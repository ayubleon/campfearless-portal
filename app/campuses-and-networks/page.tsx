import { AppSidebar } from '@/components/app-sidebar'
import { CampusesAndNetworksScreen } from '@/components/campuses-and-networks'
import { RequirePermission } from '@/components/require-permission'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/ui/sidebar'

export const metadata = { title: 'Campuses and networks' }

export default function Page() {
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
        <RequirePermission permission="manage-campuses"><CampusesAndNetworksScreen /></RequirePermission>
      </SidebarInset>
    </SidebarProvider>
  )
}
