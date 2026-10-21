"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  Grid2X2,
  History,
  ReceiptText,
  UserRound,
  UsersRound,
} from "lucide-react"

import { useSession } from "@/components/session-provider"
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/ui/sidebar'

// Each item is shown only to roles with its permission (none listed: everyone signed in).
const data = {
  sections: [
    {
      label: "",
      items: [{ title: "Dashboard", icon: Grid2X2, url: "/dashboard" }],
    },
    {
      label: "Camps",
      items: [{ title: "Camp setup", icon: CalendarDays, url: "/camp-setup", permission: "edit-camp-setup" }],
    },
    {
      label: "Registration",
      items: [
        { title: "Reports", icon: ClipboardList, url: "/reports", permission: "view-records" },
        { title: "Registration", icon: UserRound, url: "/registration", permission: "register" },
        { title: "Waivers", icon: FileCheck2, url: "/waivers", permission: "issue-waivers" },
        { title: "Payments", icon: ReceiptText, url: "/payments", permission: "verify-payments" },
      ],
    },
    {
      label: "Administration",
      items: [
        { title: "Users and roles", icon: UsersRound, url: "/users-and-roles", permission: "manage-users" },
        { title: "Campuses and networks", icon: Building2, url: "/campuses-and-networks", permission: "manage-campuses" },
        { title: "Audit log", icon: History, url: "/audit-log", permission: "view-audit-log" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { can, user } = useSession()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto gap-3 p-0 hover:bg-transparent"
            >
              <Link href="/dashboard">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card p-1.5">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%201000005756-Snn0NVpYSU5MruXfptoDy95BACFSkJ.png"
                    alt="Camp Fearless logo"
                    className="h-full w-full object-contain dark:invert"
                  />
                </span>
                <span className="grid gap-0.5">
                  <span className="font-title text-base font-normal">CAMP FEARLESS</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.role}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {data.sections
          .map((section) => ({ ...section, items: section.items.filter((item) => !("permission" in item) || can(item.permission as string)) }))
          .filter((section) => section.items.length > 0)
          .map((section) => (
          <SidebarGroup key={section.label || "dashboard"} className="py-2">
            {section.label && <SidebarGroupLabel className="px-2 pb-2 text-sm font-normal text-muted-foreground">{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={"url" in item && item.url !== undefined && pathname === item.url}
                      tooltip={item.title}
                      className="h-9 gap-3 rounded-lg px-2.5 text-sm font-medium data-[active=true]:bg-nav-active data-[active=true]:text-nav-active-foreground data-[active=true]:hover:bg-nav-active data-[active=true]:hover:text-nav-active-foreground"
                    >
                      <Link href={("url" in item && item.url) || "#"}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.name, email: user.role }} />
      </SidebarFooter>
    </Sidebar>
  )
}
