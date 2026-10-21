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

const roleName = "Super admin"

const data = {
  user: {
    name: "John Doe",
    email: roleName,
    avatar: "",
  },
  sections: [
    {
      label: "",
      items: [{ title: "Dashboard", icon: Grid2X2, url: "/dashboard" }],
    },
    {
      label: "Camps",
      items: [{ title: "Camp setup", icon: CalendarDays, url: "/camp-setup" }],
    },
    {
      label: "Registration",
      items: [
        { title: "Reports", icon: ClipboardList, url: "/reports" },
        { title: "Registration", icon: UserRound, url: "/registration" },
        { title: "Waivers", icon: FileCheck2, url: "/waivers" },
        { title: "Payments", icon: ReceiptText, url: "/payments" },
      ],
    },
    {
      label: "Administration",
      items: [
        { title: "Users and roles", icon: UsersRound, url: "/users-and-roles" },
        { title: "Campuses and networks", icon: Building2, url: "/campuses-and-networks" },
        { title: "Audit log", icon: History, url: "/audit-log" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto gap-3 p-0 hover:bg-transparent"
            >
              <a href="#">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card p-1.5">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%201000005756-Snn0NVpYSU5MruXfptoDy95BACFSkJ.png"
                    alt="Camp Fearless logo"
                    className="h-full w-full object-contain dark:invert"
                  />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-base font-bold tracking-tight">CAMP FEARLESS</span>
                  <span className="text-xs font-normal text-muted-foreground">{roleName}</span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {data.sections.map((section) => (
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
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
