import { AppSidebar } from '@/components/app-sidebar'
import { RegistrationScreen } from '@/components/registration'
import { RequirePermission } from '@/components/require-permission'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/ui/sidebar'

export const metadata = { title: 'Walk-in registration' }

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
        <SiteHeader title="Walk-in camper registration" />
        <RequirePermission permission="register"><RegistrationScreen /></RequirePermission>
      </SidebarInset>
    </SidebarProvider>
  )
}
