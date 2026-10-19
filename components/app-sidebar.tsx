"use client"

import * as React from "react"
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

const data = {
  user: {
    name: "John Doe",
    email: "Registration Facilitator",
    avatar: "/avatars/john-doe.jpg",
  },
  sections: [
    {
      label: "",
      items: [{ title: "Dashboard", icon: Grid2X2, active: true }],
    },
    {
      label: "Camps",
      items: [{ title: "Camp setup", icon: CalendarDays }],
    },
    {
      label: "Registration",
      items: [
        { title: "Reports", icon: ClipboardList },
        { title: "Registration", icon: UserRound },
        { title: "Waivers", icon: FileCheck2 },
        { title: "Payments", icon: ReceiptText },
      ],
    },
    {
      label: "Administration",
      items: [
        { title: "Users and roles", icon: UsersRound },
        { title: "Campuses and networks", icon: Building2 },
        { title: "Audit log", icon: History },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#18181b] text-[10px] font-bold leading-none text-white">
                  CAMP
                  <span className="sr-only">Fearless</span>
                </span>
                <span className="grid gap-0.5">
                  <span className="text-base font-bold tracking-tight">CAMP FEARLESS</span>
                  <span className="text-xs font-normal text-muted-foreground">Registration Facilitator</span>
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
                      isActive={item.active}
                      tooltip={item.title}
                      className="h-9 gap-3 rounded-lg px-2.5 text-sm font-medium"
                    >
                      <a href="#">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </a>
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
