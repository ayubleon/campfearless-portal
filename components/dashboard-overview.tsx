"use client"

import * as React from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { IconChevronDown, IconDotsVertical, IconSearch, IconTicket } from "@tabler/icons-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Badge } from "@/ui/badge"
import { Button, buttonVariants } from "@/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs"

const COLORS = ["#336699", "#55C4AE", "#FFD400"]
const summary = [["5", "Campers departed early"], ["620", "Total registered campers"], ["590", "Campers present on site"], ["40", "Walk in registrations"], ["13", "Total registered facilitators"], ["210", "Pending arrivals"]]
const campers = [
  ["Sharon Wanjiru", "Age: 24 - Female", "Josephine Maina", "0714048876", "Downtown", "Registered", "-", "Autistic"],
  ["Sharon Wanjiru", "Age: 24 - Female", "Josephine Maina", "0714048876", "Downtown", "Registered", "-", "-"],
  ["Sharon Wanjiru", "Age: 24 - Female", "Josephine Maina", "0714048876", "Downtown", "Registered", "Asthmatic", "-"],
  ["Kevin Juma", "Age: 18 - Male", "William Kipchumba", "0714048876", "Mashauri", "Checked in", "-", "Down syndrome"],
  ["Noel Sholo", "Age: 23 - Male", "Helen Sholo", "0714048876", "Hill City", "Checked in", "-", "-"],
  ["Mase Webster", "Age: 20 - Male", "Jacques Webster", "0714048876", "Hill City", "Checked in", "Sinuses", "-"],
  ["Carter Nolan", "Age: 20 - Male", "Christine Sio", "0714048876", "Invited", "Checked in", "-", "-"],
  ["Kety Webster", "Age: 20 - Male", "Jacques Webster", "0714048876", "PCEA", "Checked in", "Protein allergy", "-"],
  ["Karen Jackson", "Age: 19 - Female", "Leon Sholo", "0714048876", "Hill City", "Checked out", "Asthmatic", "-"],
]

function DonutCard({ title, description, data, centerValue, centerLabel, labels }: any) {
  return <Card className="min-w-0 shadow-none"><CardHeader className="gap-1 pb-0"><CardTitle className="text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div className="relative mx-auto h-56 w-full max-w-xs"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" innerRadius="52%" outerRadius="78%" strokeWidth={0}>{data.map((entry: any, index: number) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl">{centerValue}</strong><span className="text-xs text-muted-foreground">{centerLabel}</span></div></div><div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">{data.map((item: any, index: number) => <span key={item.name} className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />{labels[index]} {item.value}</span>)}</div></CardContent></Card>
}

function QuickSummary() { return <Card className="min-w-0 overflow-hidden shadow-none"><CardHeader className="gap-1 pb-3"><CardTitle className="text-base">Quick summary</CardTitle><CardDescription>A summary of campers data</CardDescription></CardHeader><CardContent><div className="flex max-h-72 flex-col gap-2 overflow-y-auto px-1 pr-3">{summary.map(([value, label]) => <div key={label} className="rounded-lg border bg-muted/20 px-4 py-3"><div className="text-base font-semibold tabular-nums">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>)}</div></CardContent></Card> }

function statusClass(status: string) { return status === "Checked in" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400" : status === "Registered" ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400" }

function CheckInAction({ camperName, status, onCheckIn, onExit }: { camperName: string; status: string; onCheckIn: () => void; onExit: () => void }) {
  const checkedIn = status === "Checked in"
  const checkedOut = status === "Checked out"
  if (checkedOut) return <span className="whitespace-nowrap text-sm text-muted-foreground">{status}</span>
  return <Button type="button" className={checkedIn ? "whitespace-nowrap" : "whitespace-nowrap bg-[#336699] text-white hover:bg-[#2b5985]"} variant={checkedIn ? "outline" : "default"} onClick={checkedIn ? onExit : onCheckIn}>{checkedIn ? "Issue exit permit" : "Check in"}</Button>
}

function RowActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More actions">
          <IconDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="z-50 min-w-44">
        <DropdownMenuItem>Edit details</DropdownMenuItem>
        <DropdownMenuItem>Undo check in</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">Cancel registration</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardOverview() {
  const [campus, setCampus] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const filtered = campers.filter(([name, , contact, phone]) => `${name} ${contact} ${phone}`.toLowerCase().includes(search.toLowerCase()))
  return <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6"><Tabs value={campus} onValueChange={setCampus} className="w-fit"><TabsList className="grid w-full max-w-md grid-cols-3"><TabsTrigger className="w-full" value="all">All camps</TabsTrigger><TabsTrigger className="w-full" value="mya">MYA</TabsTrigger><TabsTrigger className="w-full" value="myf">MYF</TabsTrigger></TabsList></Tabs><section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]"><DonutCard title="Campers attendance" description="A summary of campers check in statuses." data={[{ name: "Online checked in", value: 370 }, { name: "Pending arrivals", value: 210 }, { name: "Walk in", value: 40 }]} centerValue="620" centerLabel="Registered" labels={["Online checked in:", "Pending arrivals:", "Walk in:"]} /><DonutCard title="Checked-in campers by gender" description="A summary of male and female campers on site." data={[{ name: "Male", value: 270 }, { name: "Female", value: 320 }]} centerValue="590" centerLabel="Present" labels={["Male:", "Female:"]} /><QuickSummary /></section><section className="grid gap-4 lg:grid-cols-2"><Card className="flex flex-col shadow-none"><CardHeader className="gap-1"><CardTitle className="text-base">Check-In online registrant</CardTitle><CardDescription>Lookup camper&apos;s name, M-Pesa code or phone number to instantly check them in.</CardDescription></CardHeader><CardContent className="mt-auto flex items-center gap-3"><div className="relative flex-1"><IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="border bg-muted/50 pl-10" placeholder="Search by name, phone, M-Pesa code" /></div><Button>Check in</Button></CardContent></Card><Card className="flex flex-col shadow-none"><CardHeader className="gap-1"><CardTitle className="text-base">Walk-in registration</CardTitle><CardDescription>Capture full camper details. Walk-ins are auto-checked in as present upon payment verification.</CardDescription></CardHeader><CardContent className="mt-auto"><Button className="w-full">Open walk-in registration form</Button></CardContent></Card></section><Card className="shadow-none"><CardHeader className="gap-1"><CardTitle className="text-base">Camp roster &amp; status monitor</CardTitle><CardDescription>Manage attendees, filter by campus or status, or process early exit permits.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div className="relative max-w-md flex-1"><IconSearch className="absolute left-3 top-2.5 text-muted-foreground" /><Input className="border bg-muted/50 pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, M-Pesa code" /></div><div className="flex gap-2"><Select defaultValue="all"><SelectTrigger className="w-36"><SelectValue placeholder="Campus" /></SelectTrigger><SelectContent><SelectItem value="all">Campus</SelectItem><SelectItem value="downtown">Downtown</SelectItem><SelectItem value="hill">Hill City</SelectItem></SelectContent></Select><Select defaultValue="all"><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Status</SelectItem><SelectItem value="registered">Registered</SelectItem><SelectItem value="checked-in">Checked in</SelectItem></SelectContent></Select></div></div><div className="overflow-x-auto rounded-lg border"><Table><TableHeader className="bg-muted/50"><TableRow><TableHead className="whitespace-nowrap">Camper</TableHead><TableHead className="whitespace-nowrap">Emergency contact</TableHead><TableHead className="whitespace-nowrap">Campus</TableHead><TableHead className="whitespace-nowrap">Status</TableHead><TableHead className="whitespace-nowrap">Medical condition</TableHead><TableHead className="whitespace-nowrap">Special needs</TableHead><TableHead className="whitespace-nowrap">Actions</TableHead><TableHead className="w-10">More</TableHead></TableRow></TableHeader><TableBody>{filtered.map((camper, index) => <TableRow key={`${camper[0]}-${index}`} className="hover:bg-muted/50"><TableCell className="whitespace-nowrap"><div className="font-medium">{camper[0]}</div><div className="text-muted-foreground">{camper[1]}</div></TableCell><TableCell className="whitespace-nowrap"><div>{camper[2]}</div><div className="text-muted-foreground">{camper[3]}</div></TableCell><TableCell className="whitespace-nowrap">{camper[4]}</TableCell><TableCell className="whitespace-nowrap"><Badge variant="outline" className={`whitespace-nowrap ${statusClass(camper[5])}`}>{camper[5]}</Badge></TableCell><TableCell className="whitespace-nowrap">{camper[6]}</TableCell><TableCell className="whitespace-nowrap">{camper[7]}</TableCell><TableCell className="whitespace-nowrap">{camper[5] === "Registered" ? <Button className="bg-[#336699] text-white hover:bg-[#2b5985]">Check in</Button> : <Button variant="outline">Issue exit permit</Button>}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`More actions for ${camper[0]}`}><RowActions /></Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></main>
}
