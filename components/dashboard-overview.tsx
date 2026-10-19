"use client"

import * as React from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import {
  IconCalendarEvent,
  IconCheck,
  IconChevronDown,
  IconDotsVertical,
  IconSearch,
  IconTicket,
} from "@tabler/icons-react"

import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/ui/toggle-group"

const COLORS = ["#336699", "#55C4AE", "#FFD400"]

const summary = [
  ["5", "Campers departed early"],
  ["620", "Total registered campers"],
  ["590", "Campers present on site"],
  ["40", "Walk in registrations"],
  ["13", "Total registered facilitators"],
  ["210", "Pending arrivals"],
]

const campers = [
  { name: "Sharon Wanjiru", details: "Age: 24 - Female", contact: "Josephine Maina", phone: "0714048876", campus: "Downtown", status: "Registered", medical: "-", needs: "Autistic" },
  { name: "Sharon Wanjiru", details: "Age: 24 - Female", contact: "Josephine Maina", phone: "0714048876", campus: "Downtown", status: "Registered", medical: "-", needs: "-" },
  { name: "Sharon Wanjiru", details: "Age: 24 - Female", contact: "Josephine Maina", phone: "0714048876", campus: "Downtown", status: "Registered", medical: "Asthmatic", needs: "-" },
  { name: "Kevin Juma", details: "Age: 18 - Male", contact: "William Kipchumba", phone: "0714048876", campus: "Mashauri", status: "Checked in", medical: "-", needs: "Down syndrome" },
  { name: "Noel Sholo", details: "Age: 23 - Male", contact: "Helen Sholo", phone: "0714048876", campus: "Hill City", status: "Checked in", medical: "-", needs: "-" },
  { name: "Mase Webster", details: "Age: 20 - Male", contact: "Jacques Webster", phone: "0714048876", campus: "Hill City", status: "Checked in", medical: "Sinuses", needs: "-" },
  { name: "Carter Nolan", details: "Age: 20 - Male", contact: "Christine Sio", phone: "0714048876", campus: "Invited", status: "Checked in", medical: "-", needs: "-" },
  { name: "Kety Webster", details: "Age: 20 - Male", contact: "Jacques Webster", phone: "0714048876", campus: "PCEA", status: "Checked in", medical: "Protein allergy", needs: "-" },
  { name: "Karen Jackson", details: "Age: 19 - Female", contact: "Leon Sholo", phone: "0714048876", campus: "Hill City", status: "Checked out", medical: "Asthmatic", needs: "-" },
]

function DonutCard({ title, description, data, centerValue, centerLabel, labels }: { title: string; description: string; data: { name: string; value: number }[]; centerValue: string; centerLabel: string; labels: string[] }) {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader className="pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-56 w-full max-w-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius="52%" outerRadius="78%" strokeWidth={0}>
                {data.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-xl">{centerValue}</strong>
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          {data.map((item, index) => <span key={item.name} className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />{labels[index]} {item.value}</span>)}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickSummary() {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader className="pb-3"><CardTitle>Quick summary</CardTitle><CardDescription>A summary of campers data</CardDescription></CardHeader>
      <CardContent><div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">{summary.map(([value, label]) => <div key={label} className="rounded-lg border bg-muted/20 px-4 py-3"><div className="text-2xl font-semibold tabular-nums">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>)}</div></CardContent>
    </Card>
  )
}

export function DashboardOverview() {
  const [campus, setCampus] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const filteredCampers = campers.filter((camper) => `${camper.name} ${camper.contact} ${camper.phone}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <main className="flex flex-1 flex-col gap-5 p-4 lg:p-6">
      <div className="flex flex-col gap-4"><h1 className="flex items-center gap-3 text-2xl font-semibold"><IconCalendarEvent />Dashboard</h1><ToggleGroup type="single" value={campus} onValueChange={(value) => value && setCampus(value)} variant="outline" className="w-fit"><ToggleGroupItem value="all">All camps</ToggleGroupItem><ToggleGroupItem value="mya">MYA</ToggleGroupItem><ToggleGroupItem value="myf">MYF</ToggleGroupItem></ToggleGroup></div>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]"><DonutCard title="Campers attendance" description="A summary of campers check in statuses." data={[{ name: "Online checked in", value: 370 }, { name: "Pending arrivals", value: 210 }, { name: "Walk in", value: 40 }]} centerValue="620" centerLabel="Registered" labels={["Online checked in:", "Pending arrivals:", "Walk in:"]} /><DonutCard title="Checked-in campers by gender" description="A summary of male and female campers on site." data={[{ name: "Male", value: 270 }, { name: "Female", value: 320 }]} centerValue="590" centerLabel="Present" labels={["Male:", "Female:"]} /><QuickSummary /></section>
      <section className="grid gap-4 lg:grid-cols-2"><Card className="shadow-none"><CardHeader><CardTitle>Check-In online registrant</CardTitle><CardDescription>Lookup camper&apos;s name, M-Pesa code or phone number to instantly check them in.</CardDescription></CardHeader><CardContent className="flex gap-3"><Input placeholder="Search by name, phone, M-Pesa code" /><Button><IconCheck data-icon="inline-start" />Check in</Button></CardContent></Card><Card className="shadow-none"><CardHeader><CardTitle>Walk-in registration</CardTitle><CardDescription>Capture full camper details. Walk-ins are auto-checked in as present upon payment verification.</CardDescription></CardHeader><CardContent><Button className="w-full">Open walk-in registration form</Button></CardContent></Card></section>
      <Card className="shadow-none"><CardHeader><CardTitle>Camp roster &amp; status monitor</CardTitle><CardDescription>Manage attendees, filter by campus or status, or process early exit permits.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div className="relative max-w-md flex-1"><IconSearch className="absolute left-3 top-2.5 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, M-Pesa code" /></div><div className="flex gap-2"><Select defaultValue="all"><SelectTrigger className="w-36"><SelectValue placeholder="Campus" /></SelectTrigger><SelectContent><SelectItem value="all">Campus</SelectItem><SelectItem value="downtown">Downtown</SelectItem><SelectItem value="hill">Hill City</SelectItem></SelectContent></Select><Select defaultValue="all"><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Status</SelectItem><SelectItem value="registered">Registered</SelectItem><SelectItem value="checked-in">Checked in</SelectItem></SelectContent></Select></div></div><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Camper</TableHead><TableHead>Emergency contact</TableHead><TableHead>Campus</TableHead><TableHead>Status</TableHead><TableHead>Medical condition</TableHead><TableHead>Special needs</TableHead><TableHead>Actions</TableHead><TableHead className="w-10">More</TableHead></TableRow></TableHeader><TableBody>{filteredCampers.map((camper, index) => <TableRow key={`${camper.name}-${index}`}><TableCell><div className="font-medium">{camper.name}</div><div className="text-muted-foreground">{camper.details}</div></TableCell><TableCell><div>{camper.contact}</div><div className="text-muted-foreground">{camper.phone}</div></TableCell><TableCell>{camper.campus}</TableCell><TableCell><Badge variant={camper.status === "Checked in" ? "secondary" : "outline"}>{camper.status}</Badge></TableCell><TableCell>{camper.medical}</TableCell><TableCell>{camper.needs}</TableCell><TableCell><Button variant={camper.status === "Registered" ? "default" : "outline"} size="sm">{camper.status === "Registered" ? "Check in" : "Issue exit permit"}</Button></TableCell><TableCell><Button variant="ghost" size="icon"><IconDotsVertical /><span className="sr-only">More actions for {camper.name}</span></Button></TableCell></TableRow>)}</TableBody></Table></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Rows per page <Button variant="outline" size="sm" className="ml-2">9</Button></span><div className="flex items-center gap-3"><Button variant="ghost" size="sm">Previous</Button><span>1</span><Button variant="outline" size="sm">2</Button><span>3</span><span>...</span><span>6</span><Button variant="ghost" size="sm">Next <IconChevronDown className="rotate-[-90deg]" data-icon="inline-end" /></Button></div></div></CardContent></Card>
    </main>
  )
}
