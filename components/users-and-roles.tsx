"use client"

import { LoadingButton } from "@/components/loading-button"
import { useAction } from "@/lib/use-action"
import { isEmail, placeNameMaxChars } from "@/lib/validation"
import { allPermissions, campAccessOptions, initialRoles, initialUsers, permissionGroups, permissions, type CampAccess, type Role, type User, type UserStatus } from "@/lib/staff"
import * as React from "react"
import Link from "next/link"
import { AlertCircle, X } from "lucide-react"
import { IconDotsVertical, IconPlus, IconUserPlus } from "@tabler/icons-react"
import { toast } from "sonner"

import { SortableHead } from "@/components/sortable-head"
import { byNumber, byRank, byText, useSortedRows } from "@/lib/sort"
import { currentUser } from "@/lib/session"
import { cn } from "@/lib/utils"
import { statusClass } from "@/lib/status"
import { Field } from "@/components/field"
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
  const { pending, run } = useAction()
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 pr-8 text-lg font-semibold leading-none tracking-tight"><AlertCircle className="text-destructive" />{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close confirmation" className="absolute right-0 top-0" onClick={onCancel}><X className="size-4" /></Button>
        </DialogHeader>
        <DialogFooter className={cn("mt-4 gap-3 sm:mt-6", showCancel ? "grid grid-cols-2 sm:justify-stretch" : "flex-row justify-end")}>
          {showCancel && <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>Cancel</Button>}
          <LoadingButton type="button" pending={pending} loadingLabel="Working..." onClick={() => (showCancel ? run(onConfirm, "complete the action") : onConfirm())}>{confirmLabel}</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InviteDialog({ open, roles, users, onClose, onInvite }: { open: boolean; roles: Role[]; users: User[]; onClose: () => void; onInvite: (user: Omit<User, "id" | "name" | "status">) => void }) {
  const { pending, run } = useAction()
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
          <LoadingButton type="button" pending={pending} loadingLabel="Sending..." disabled={!valid} onClick={() => run(() => onInvite({ email: email.trim(), roleId, access: access as CampAccess }), "send the invite")}>Send invite</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type RoleDraft = { name: string; description: string; canSignIn: boolean; startFrom: string }

function RoleDialog({ open, role, roles, userCount, onClose, onSave }: { open: boolean; role: Role | null; roles: Role[]; userCount: number; onClose: () => void; onSave: (draft: RoleDraft) => void }) {
  const { pending, run } = useAction()
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
            <Input className="bg-muted/40" maxLength={placeNameMaxChars} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
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
          <LoadingButton type="button" pending={pending} loadingLabel="Saving..." disabled={!valid} onClick={() => run(() => onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() }), "save the role")}>{role ? "Save changes" : "Save role"}</LoadingButton>
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

  // Heading clicks sort the tables. Default: A to Z by first name for users, A to Z by role name for roles.
  const roleNameOf = (id: string) => roles.find((role) => role.id === id)?.name ?? ""
  const displayName = (user: User) => user.name || user.email
  const statusRank = byRank(["active", "inactive", "pending"])
  const { rows: sortedUsers, sort: userSort, toggle: toggleUserSort } = useSortedRows<User>(
    users,
    {
      user: (a, b) => byText(displayName(a), displayName(b)),
      role: (a, b) => byText(roleNameOf(a.roleId), roleNameOf(b.roleId)),
      access: (a, b) => byText(a.access, b.access),
      active: (a, b) => statusRank(a.status, b.status),
    },
    (a, b) => byText(displayName(a), displayName(b))
  )
  const { rows: sortedRoles, sort: roleSort, toggle: toggleRoleSort } = useSortedRows<Role>(
    roles,
    {
      role: (a, b) => byText(a.name, b.name),
      description: (a, b) => byText(a.description || "~", b.description || "~"),
      access: (a, b) => Number(b.canSignIn) - Number(a.canSignIn), // can sign in first
      users: (a, b) => byNumber(usersIn(a.id), usersIn(b.id)),
      permissions: (a, b) => byNumber(a.canSignIn ? a.permissions.length : -1, b.canSignIn ? b.permissions.length : -1),
    },
    (a, b) => byText(a.name, b.name)
  )
  const signInRoles = roles.filter((role) => role.canSignIn)
  const superAdmins = users.filter((user) => user.roleId === "super-admin" && user.status === "active").length
  const isProtected = (user: User) => user.email === currentUser.email || (user.roleId === "super-admin" && user.status === "active" && superAdmins <= 1)
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
              <CardTitle className="text-lg">Users</CardTitle>
              <CardDescription>Everyone with an account. Deactivating a user blocks sign in but keeps their history.</CardDescription>
              <CardAction><Button type="button" onClick={() => setInviteOpen(true)}><IconUserPlus />Invite user</Button></CardAction>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <SortableHead label="User" sortKey="user" sort={userSort} onSort={toggleUserSort} />
                      <SortableHead label="Role" sortKey="role" sort={userSort} onSort={toggleUserSort} />
                      <SortableHead label="Camp access" sortKey="access" sort={userSort} onSort={toggleUserSort} />
                      <SortableHead label="Active" sortKey="active" sort={userSort} onSort={toggleUserSort} />
                      <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user) => {
                      const you = user.email === currentUser.email
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
                          <TableCell className="whitespace-nowrap">
                            <MoreMenu>
                              {user.status === "pending" ? (
                                <>
                                  <DropdownMenuItem onSelect={() => toast.success("Invite successfully resent")}>Resend invite</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => setConfirm({
                                      title: "Cancel invite?",
                                      description: <>The invite to <strong className="text-foreground">{user.email}</strong> stops working. You can invite them again later.</>,
                                      confirmLabel: "Cancel invite",
                                      onConfirm: () => { setUsers((current) => current.filter((item) => item.id !== user.id)); toast.success("Invite successfully cancelled"); closeConfirm() },
                                    })}
                                  >Cancel invite</DropdownMenuItem>
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
              <CardTitle className="text-lg">Roles</CardTitle>
              <CardDescription>Roles with system access can sign in. The others only tag people, like teams.</CardDescription>
              <CardAction><Button type="button" onClick={() => setRoleDialog({ role: null })}><IconPlus />Add role</Button></CardAction>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <SortableHead label="Role" sortKey="role" sort={roleSort} onSort={toggleRoleSort} />
                      <SortableHead label="Description" sortKey="description" sort={roleSort} onSort={toggleRoleSort} />
                      <SortableHead label="System access" sortKey="access" sort={roleSort} onSort={toggleRoleSort} />
                      <SortableHead label="Users" sortKey="users" sort={roleSort} onSort={toggleRoleSort} />
                      <SortableHead label="Permissions" sortKey="permissions" sort={roleSort} onSort={toggleRoleSort} />
                      <TableHead className="w-10"><span className="sr-only">More actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRoles.map((role) => {
                      const count = usersIn(role.id)
                      const access = role.canSignIn ? "Can sign in" : "No access"
                      return (
                        <TableRow key={role.id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap font-medium">
                            <span className="flex items-center gap-2">{role.name}{role.locked && <Badge variant="outline" className={statusClass("Locked")}>Locked</Badge>}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {role.description || (role.locked ? "-" : <Button type="button" variant="link" className="h-auto p-0 font-normal text-muted-foreground hover:text-foreground" onClick={() => setRoleDialog({ role })}>Add description</Button>)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap"><Badge variant="outline" className={cn("whitespace-nowrap", statusClass(access))}>{access}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{count}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{role.canSignIn ? `${role.permissions.length} of ${permissions.length}` : "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">
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
              <CardTitle className="text-lg">Permissions by role</CardTitle>
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
