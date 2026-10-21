"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, X } from "lucide-react"
import { IconDotsVertical, IconPlus, IconUserPlus } from "@tabler/icons-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { statusClass } from "@/lib/status"
import { Badge } from "@/ui/badge"
import { Button, buttonVariants } from "@/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card"
import { Checkbox } from "@/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Input } from "@/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Switch } from "@/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"

// Until sign-in exists, the signed-in user is hardcoded like the sidebar's.
const currentUserEmail = "john@mavuno.org"

type CampAccess = "Both" | "MYF only" | "MYA only"
type UserStatus = "active" | "inactive" | "pending"
type User = { id: string; name: string; email: string; roleId: string; access: CampAccess; status: UserStatus }
type Role = { id: string; name: string; description: string; canSignIn: boolean; locked?: boolean; permissions: string[] }

const permissionGroups = [
  { label: "Campers", permissions: [
    { id: "register", label: "Register campers" },
    { id: "check-in", label: "Check in campers" },
    { id: "check-out", label: "Check out campers" },
  ] },
  { label: "Waivers and payments", permissions: [
    { id: "issue-waivers", label: "Issue waivers" },
    { id: "verify-payments", label: "Verify payments" },
  ] },
  { label: "Records", permissions: [
    { id: "view-records", label: "View records" },
    { id: "print-records", label: "Print records", sensitive: true },
    { id: "export-records", label: "Export records", sensitive: true },
    { id: "view-medical", label: "View medical details", sensitive: true },
  ] },
  { label: "Administration", permissions: [
    { id: "edit-camp-setup", label: "Edit camp setup" },
    { id: "manage-campuses", label: "Manage campuses and networks" },
    { id: "manage-users", label: "Manage users" },
    { id: "view-audit-log", label: "View audit log", sensitive: true },
  ] },
]
const permissions: { id: string; label: string; sensitive?: boolean }[] = permissionGroups.flatMap((group) => group.permissions)
const allPermissions = permissions.map((permission) => permission.id)
const campAccessOptions: CampAccess[] = ["Both", "MYF only", "MYA only"]

const initialRoles: Role[] = [
  { id: "super-admin", name: "Super admin", description: "Full access. Creates roles and manages everything.", canSignIn: true, locked: true, permissions: allPermissions },
  { id: "lead-registrar", name: "Lead registrar", description: "Leads the registration desk.", canSignIn: true, permissions: ["register", "check-in", "check-out", "issue-waivers", "verify-payments", "view-records", "print-records", "export-records"] },
  { id: "registrar", name: "Registrar", description: "Registers walk-ins and checks campers in.", canSignIn: true, permissions: ["register", "check-in", "view-records"] },
  { id: "kitchen-crew", name: "Kitchen crew", description: "Facilitator team in the kitchen.", canSignIn: false, permissions: [] },
  { id: "security", name: "Security", description: "Facilitator team for the gate and safety.", canSignIn: false, permissions: [] },
  { id: "media-team", name: "Media team", description: "", canSignIn: false, permissions: [] },
  { id: "worship-team", name: "Worship team", description: "", canSignIn: false, permissions: [] },
]

const initialUsers: User[] = [
  { id: "u1", name: "John Doe", email: "john@mavuno.org", roleId: "super-admin", access: "Both", status: "active" },
  { id: "u2", name: "Sharon Wanjiru", email: "sharon@mavuno.org", roleId: "lead-registrar", access: "Both", status: "active" },
  { id: "u3", name: "Dennis Otieno", email: "dennis@mavuno.org", roleId: "registrar", access: "MYA only", status: "active" },
  { id: "u4", name: "Faith Akinyi", email: "faith@mavuno.org", roleId: "registrar", access: "MYF only", status: "active" },
  { id: "u5", name: "Mercy Chebet", email: "mercy@mavuno.org", roleId: "registrar", access: "Both", status: "active" },
  { id: "u6", name: "Kevin Mutua", email: "kevin@mavuno.org", roleId: "registrar", access: "Both", status: "inactive" },
  { id: "u7", name: "", email: "brian@mavuno.org", roleId: "registrar", access: "MYF only", status: "pending" },
]

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

function DialogTop({ title, description, onClose, closeLabel }: { title: React.ReactNode; description: React.ReactNode; onClose: () => void; closeLabel: string }) {
  return (
    <DialogHeader className="relative space-y-1 text-left">
      <DialogTitle className="text-base font-semibold leading-none tracking-tight">{title}</DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
      <Button type="button" variant="ghost" size="icon" aria-label={closeLabel} className="absolute right-0 top-0" onClick={onClose}><X className="size-4" /></Button>
    </DialogHeader>
  )
}

function ConfirmDialog({ open, title, description, confirmLabel, showCancel = true, onCancel, onConfirm }: { open: boolean; title: string; description: React.ReactNode; confirmLabel: string; showCancel?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold leading-none tracking-tight"><AlertCircle className="text-destructive" />{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close confirmation" className="absolute right-0 top-0" onClick={onCancel}><X className="size-4" /></Button>
        </DialogHeader>
        <DialogFooter className={cn("mt-4 gap-3 sm:mt-6", showCancel ? "grid grid-cols-2 sm:justify-stretch" : "flex-row justify-end")}>
          {showCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="button" onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2 text-sm font-medium">{label}{children}</label>
}

function InviteDialog({ open, roles, users, onClose, onInvite }: { open: boolean; roles: Role[]; users: User[]; onClose: () => void; onInvite: (user: Omit<User, "id" | "name" | "status">) => void }) {
  const [email, setEmail] = React.useState("")
  const [roleId, setRoleId] = React.useState("")
  const [access, setAccess] = React.useState("")
  React.useEffect(() => { if (open) { setEmail(""); setRoleId(""); setAccess("") } }, [open])
  const taken = users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())
  const valid = isEmail(email) && !taken && roleId !== "" && access !== ""

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogTop title="Invite user" description="They get an email to set up their account." onClose={onClose} closeLabel="Close invite user" />
        <div className="flex flex-col gap-4 pt-4">
          <Field label="Email">
            <Input type="email" className="bg-muted/40" placeholder="name@mavuno.org" value={email} onChange={(event) => setEmail(event.target.value)} />
            {taken && <span className="text-sm font-normal text-destructive">Someone with this email already has an account.</span>}
          </Field>
          <Field label="Role">
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="w-full bg-muted/40"><SelectValue placeholder="Choose a role" /></SelectTrigger>
              <SelectContent>{roles.filter((role) => role.canSignIn).map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Camp access">
            <Select value={access} onValueChange={setAccess}>
              <SelectTrigger className="w-full bg-muted/40"><SelectValue placeholder="Choose camp access" /></SelectTrigger>
              <SelectContent>{campAccessOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={!valid} onClick={() => onInvite({ email: email.trim(), roleId, access: access as CampAccess })}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type RoleDraft = { name: string; description: string; canSignIn: boolean; startFrom: string }

function RoleDialog({ open, role, roles, userCount, onClose, onSave }: { open: boolean; role: Role | null; roles: Role[]; userCount: number; onClose: () => void; onSave: (draft: RoleDraft) => void }) {
  const [draft, setDraft] = React.useState<RoleDraft>({ name: "", description: "", canSignIn: false, startFrom: "none" })
  React.useEffect(() => { if (open) setDraft({ name: role?.name ?? "", description: role?.description ?? "", canSignIn: role?.canSignIn ?? false, startFrom: "none" }) }, [open, role])
  const duplicate = roles.some((other) => other.id !== role?.id && other.name.toLowerCase() === draft.name.trim().toLowerCase())
  const signInLocked = Boolean(role && role.canSignIn && userCount > 0)
  const valid = draft.name.trim() !== "" && !duplicate

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogTop title={role ? "Edit role" : "Add role"} description="If it can sign in, you tick its permissions in the matrix right after saving." onClose={onClose} closeLabel={role ? "Close edit role" : "Close add role"} />
        <div className="flex flex-col gap-4 pt-4">
          <Field label="Role name">
            <Input className="bg-muted/40" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            {duplicate && <span className="text-sm font-normal text-destructive">A role with this name already exists.</span>}
          </Field>
          <Field label="What the role does">
            <Input className="bg-muted/40" placeholder="One short description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </Field>
          <label className={cn("flex flex-col gap-2 rounded-2xl border bg-muted/30 p-4 text-sm", !signInLocked && "cursor-pointer")}>
            <span className="flex items-center gap-2 font-medium">
              <Switch aria-label="Can sign in to the system" checked={draft.canSignIn} disabled={signInLocked} onCheckedChange={(canSignIn) => setDraft({ ...draft, canSignIn })} />
              Can sign in to the system
            </span>
            <span className="pl-10 text-muted-foreground">{signInLocked ? `${userCount} ${userCount === 1 ? "person has" : "people have"} an account in this role. Move them to another role before switching this off.` : "Off means people in this role are only logged and don't get an account."}</span>
          </label>
          {!role && draft.canSignIn && (
            <Field label="Start from">
              <Select value={draft.startFrom} onValueChange={(startFrom) => setDraft({ ...draft, startFrom })}>
                <SelectTrigger className="w-full bg-muted/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No permissions</SelectItem>
                  {roles.filter((other) => other.canSignIn).map((other) => <SelectItem key={other.id} value={other.id}>Copy {other.name} permissions</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={!valid} onClick={() => onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() })}>{role ? "Save changes" : "Save role"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MoreMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger type="button" className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="More actions"><IconDotsVertical /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UsersAndRolesScreen() {
  const [tab, setTab] = React.useState("users")
  const [roles, setRoles] = React.useState(initialRoles)
  const [users, setUsers] = React.useState(initialUsers)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [roleDialog, setRoleDialog] = React.useState<{ role: Role | null } | null>(null)
  const [confirm, setConfirm] = React.useState<{ title: string; description: React.ReactNode; confirmLabel: string; showCancel?: boolean; onConfirm: () => void } | null>(null)

  const roleById = (id: string) => roles.find((role) => role.id === id)
  const usersIn = (roleId: string) => users.filter((user) => user.roleId === roleId).length
  const signInRoles = roles.filter((role) => role.canSignIn)
  const superAdmins = users.filter((user) => user.roleId === "super-admin" && user.status === "active").length
  const isProtected = (user: User) => user.email === currentUserEmail || (user.roleId === "super-admin" && user.status === "active" && superAdmins <= 1)
  const updateUser = (id: string, patch: Partial<User>) => setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...patch } : user)))
  const closeConfirm = () => setConfirm(null)

  const setPermission = (role: Role, permissionId: string, granted: boolean) => {
    const apply = () => {
      setRoles((current) => current.map((item) => (item.id === role.id ? { ...item, permissions: granted ? [...item.permissions, permissionId] : item.permissions.filter((id) => id !== permissionId) } : item)))
      toast.success("Permission successfully updated")
    }
    const permission = permissions.find((item) => item.id === permissionId)
    if (granted && permission?.sensitive) {
      setConfirm({
        title: `Allow ${permission.label.toLowerCase()}?`,
        description: <>Everyone with the <strong className="text-foreground">{role.name}</strong> role will be able to {permission.label.toLowerCase()}. This is sensitive camper information.</>,
        confirmLabel: "Allow",
        onConfirm: () => { apply(); closeConfirm() },
      })
      return
    }
    apply()
  }

  const saveRole = (draft: RoleDraft) => {
    const editing = roleDialog?.role
    if (editing) {
      setRoles((current) => current.map((role) => (role.id === editing.id ? { ...role, name: draft.name, description: draft.description, canSignIn: draft.canSignIn, permissions: draft.canSignIn ? role.permissions : [] } : role)))
      toast.success("Role successfully updated")
    } else {
      const copied = draft.canSignIn && draft.startFrom !== "none" ? roleById(draft.startFrom)?.permissions ?? [] : []
      setRoles((current) => [...current, { id: `role-${Date.now()}`, name: draft.name, description: draft.description, canSignIn: draft.canSignIn, permissions: [...copied] }])
      toast.success("Role successfully added")
    }
    setRoleDialog(null)
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-6">
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger className="w-full" value="users">Users</TabsTrigger>
          <TabsTrigger className="w-full" value="roles">Roles and permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Users</CardTitle>
              <CardDescription>Everyone with an account. Deactivating a user blocks sign in but keeps their history.</CardDescription>
              <CardAction><Button type="button" onClick={() => setInviteOpen(true)}><IconUserPlus />Invite user</Button></CardAction>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">User</TableHead>
                      <TableHead className="whitespace-nowrap">Role</TableHead>
                      <TableHead className="whitespace-nowrap">Camp access</TableHead>
                      <TableHead className="whitespace-nowrap">Active</TableHead>
                      <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const you = user.email === currentUserEmail
                      const locked = isProtected(user)
                      return (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap">
                            {user.status === "pending" ? (
                              <div className="font-medium">{user.email}</div>
                            ) : (
                              <>
                                <div className="font-medium">{user.name}{you && <span className="font-normal text-muted-foreground"> (you)</span>}</div>
                                <div className="text-muted-foreground">{user.email}</div>
                              </>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Select value={user.roleId} disabled={locked} onValueChange={(roleId) => { updateUser(user.id, { roleId }); toast.success("Role successfully updated") }}>
                              <SelectTrigger className="w-44" aria-label={`Role for ${user.email}`}><SelectValue /></SelectTrigger>
                              <SelectContent>{signInRoles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Select value={user.access} onValueChange={(access) => { updateUser(user.id, { access: access as CampAccess }); toast.success("Camp access successfully updated") }}>
                              <SelectTrigger className="w-36" aria-label={`Camp access for ${user.email}`}><SelectValue /></SelectTrigger>
                              <SelectContent>{campAccessOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {user.status === "pending" ? (
                              <Badge variant="outline" className={cn("whitespace-nowrap", statusClass("Invite pending"))}>Invite pending</Badge>
                            ) : (
                              <Switch
                                checked={user.status === "active"}
                                disabled={locked}
                                aria-label={`Active: ${user.email}`}
                                onCheckedChange={(checked) => {
                                  if (checked) { updateUser(user.id, { status: "active" }); toast.success("User successfully activated"); return }
                                  setConfirm({
                                    title: "Deactivate user?",
                                    description: <><strong className="text-foreground">{user.name || user.email}</strong> will be signed out and can't sign in again until you activate them.</>,
                                    confirmLabel: "Deactivate user",
                                    onConfirm: () => { updateUser(user.id, { status: "inactive" }); toast.success("User successfully deactivated"); closeConfirm() },
                                  })
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <MoreMenu>
                              {user.status === "pending" ? (
                                <>
                                  <DropdownMenuItem onSelect={() => toast.success("Invite successfully resent")}>Resend invite</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { setUsers((current) => current.filter((item) => item.id !== user.id)); toast.success("Invite successfully cancelled") }}>Cancel invite</DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                <DropdownMenuItem asChild><Link href={`/audit-log?q=${encodeURIComponent(user.name)}`}>View activity</Link></DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => locked ? setConfirm({
                                    title: you ? "You can't remove yourself" : `Can't remove ${user.name}`,
                                    description: you
                                      ? <>Ask another <strong className="text-foreground">Super admin</strong> to remove your account.</>
                                      : <><strong className="text-foreground">{user.name}</strong> is the last active Super admin. Give someone else the Super admin role first.</>,
                                    confirmLabel: "Got it",
                                    showCancel: false,
                                    onConfirm: closeConfirm,
                                  }) : setConfirm({
                                    title: "Remove user?",
                                    description: <><strong className="text-foreground">{user.name || user.email}</strong> will no longer be able to access the system. Their name stays in the audit log, marked (removed).</>,
                                    confirmLabel: "Remove user",
                                    onConfirm: () => { setUsers((current) => current.filter((item) => item.id !== user.id)); toast.success("User successfully removed"); closeConfirm() },
                                  })}
                                >
                                  Remove user
                                </DropdownMenuItem>
                                </>
                              )}
                            </MoreMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="flex flex-col gap-4">
          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Roles</CardTitle>
              <CardDescription>Roles with system access can sign in. The others only tag people, like teams.</CardDescription>
              <CardAction><Button type="button" onClick={() => setRoleDialog({ role: null })}><IconPlus />Add role</Button></CardAction>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Role</TableHead>
                      <TableHead className="whitespace-nowrap">Description</TableHead>
                      <TableHead className="whitespace-nowrap">System access</TableHead>
                      <TableHead className="whitespace-nowrap">Users</TableHead>
                      <TableHead className="whitespace-nowrap">Permissions</TableHead>
                      <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => {
                      const count = usersIn(role.id)
                      const access = role.canSignIn ? "Can sign in" : "No access"
                      return (
                        <TableRow key={role.id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap font-medium">
                            <span className="flex items-center gap-2">{role.name}{role.locked && <Badge variant="outline" className={statusClass("Locked")}>Locked</Badge>}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {role.description || (role.locked ? "-" : <button type="button" className="underline-offset-4 hover:text-foreground hover:underline" onClick={() => setRoleDialog({ role })}>Add description</button>)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(access))}>{access}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{count}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{role.canSignIn ? `${role.permissions.length} of ${permissions.length}` : "-"}</TableCell>
                          <TableCell>
                            <MoreMenu>
                              <DropdownMenuItem disabled={role.locked} onSelect={() => setRoleDialog({ role })}>Edit role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => role.locked ? setConfirm({
                                  title: "Super admin can't be deleted",
                                  description: <>The <strong className="text-foreground">Super admin</strong> role is locked so someone can always manage the system.</>,
                                  confirmLabel: "Got it",
                                  showCancel: false,
                                  onConfirm: closeConfirm,
                                }) : count > 0 ? setConfirm({
                                  title: `Can't delete ${role.name} yet`,
                                  description: <><strong className="text-foreground">{count} {count === 1 ? "person has" : "people have"}</strong> an account in this role. Move them to another role first, then delete it.</>,
                                  confirmLabel: "Show users",
                                  onConfirm: () => { setTab("users"); closeConfirm() },
                                }) : setConfirm({
                                  title: "Delete role?",
                                  description: <>This permanently deletes the <strong className="text-foreground">{role.name}</strong> role.</>,
                                  confirmLabel: "Delete role",
                                  onConfirm: () => { setRoles((current) => current.filter((item) => item.id !== role.id)); toast.success("Role successfully deleted"); closeConfirm() },
                                })}
                              >
                                Delete role
                              </DropdownMenuItem>
                            </MoreMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Permissions by role</CardTitle>
              <CardDescription>Only roles with system access appear here. Ticks save straight away.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Permission</TableHead>
                      {signInRoles.map((role) => <TableHead key={role.id} className="whitespace-nowrap">{role.name}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionGroups.map((group) => (
                      <React.Fragment key={group.label}>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={signInRoles.length + 1} className="whitespace-nowrap py-2 text-xs font-medium text-muted-foreground">{group.label}</TableCell>
                        </TableRow>
                      {group.permissions.map((permission: { id: string; label: string; sensitive?: boolean }) => (
                        <TableRow key={permission.id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap">
                            <span className="flex items-center gap-2">{permission.label}{permission.sensitive && <Badge variant="outline" className={statusClass("Sensitive")}>Sensitive</Badge>}</span>
                          </TableCell>
                          {signInRoles.map((role) => (
                            <TableCell key={role.id} className="whitespace-nowrap">
                              <Checkbox
                                checked={role.permissions.includes(permission.id)}
                                disabled={role.locked}
                                aria-label={`${role.name}: ${permission.label}`}
                                onCheckedChange={(checked) => setPermission(role, permission.id, checked === true)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteDialog
        open={inviteOpen}
        roles={roles}
        users={users}
        onClose={() => setInviteOpen(false)}
        onInvite={(invite) => { setUsers((current) => [...current, { ...invite, id: `u-${Date.now()}`, name: "", status: "pending" }]); setInviteOpen(false); toast.success("Invite successfully sent") }}
      />
      <RoleDialog open={roleDialog !== null} role={roleDialog?.role ?? null} roles={roles} userCount={roleDialog?.role ? usersIn(roleDialog.role.id) : 0} onClose={() => setRoleDialog(null)} onSave={saveRole} />
      <ConfirmDialog open={confirm !== null} title={confirm?.title ?? ""} description={confirm?.description} confirmLabel={confirm?.confirmLabel ?? ""} showCancel={confirm?.showCancel} onCancel={closeConfirm} onConfirm={() => confirm?.onConfirm()} />
    </main>
  )
}
