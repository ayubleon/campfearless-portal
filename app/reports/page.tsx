import { AppSidebar } from '@/components/app-sidebar'
import { ReportsScreen } from '@/components/reports'
import { RequirePermission } from '@/components/require-permission'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/ui/sidebar'

export const metadata = { title: 'Reports' }

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
        <SiteHeader title="Reports" />
        <RequirePermission permission="view-records"><ReportsScreen /></RequirePermission>
      </SidebarInset>
    </SidebarProvider>
  )
}
