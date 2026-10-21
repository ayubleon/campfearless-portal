import { AppSidebar } from '@/components/app-sidebar'
import { PaymentsScreen } from '@/components/payments'
import { RequirePermission } from '@/components/require-permission'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/ui/sidebar'

export const metadata = { title: 'Payments' }

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
        <SiteHeader title="Payments" />
        <RequirePermission permission="verify-payments"><PaymentsScreen /></RequirePermission>
      </SidebarInset>
    </SidebarProvider>
  )
}
