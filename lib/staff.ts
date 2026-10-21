// Staff data: the roles, what each role may do, and the people who sign in. The backend will serve these; Users and roles
// edits them, and every record that says "registered by" or "issued by" points at a user id from here (never a typed name).

export type CampAccess = "Both" | "MYF only" | "MYA only"
export type UserStatus = "active" | "inactive" | "pending"
export type User = { id: string; name: string; email: string; roleId: string; access: CampAccess; status: UserStatus }
export type Role = { id: string; name: string; description: string; canSignIn: boolean; locked?: boolean; permissions: string[] }

export const permissionGroups = [
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
export const permissions: { id: string; label: string; sensitive?: boolean }[] = permissionGroups.flatMap((group) => group.permissions)
export const allPermissions = permissions.map((permission) => permission.id)
export const campAccessOptions: CampAccess[] = ["Both", "MYF only", "MYA only"]

export const initialRoles: Role[] = [
  { id: "super-admin", name: "Super admin", description: "Full access. Creates roles and manages everything.", canSignIn: true, locked: true, permissions: allPermissions },
  { id: "lead-registrar", name: "Lead registrar", description: "Leads the registration desk.", canSignIn: true, permissions: ["register", "check-in", "check-out", "issue-waivers", "verify-payments", "view-records", "print-records", "export-records"] },
  { id: "registrar", name: "Registrar", description: "Registers walk-ins and checks campers in.", canSignIn: true, permissions: ["register", "check-in", "view-records"] },
  { id: "kitchen-crew", name: "Kitchen crew", description: "Facilitator team in the kitchen.", canSignIn: false, permissions: [] },
  { id: "security", name: "Security", description: "Facilitator team for the gate and safety.", canSignIn: false, permissions: [] },
  { id: "media-team", name: "Media team", description: "", canSignIn: false, permissions: [] },
  { id: "worship-team", name: "Worship team", description: "", canSignIn: false, permissions: [] },
]

export const initialUsers: User[] = [
  { id: "u1", name: "John Doe", email: "john@mavuno.org", roleId: "super-admin", access: "Both", status: "active" },
  { id: "u2", name: "Sharon Wanjiru", email: "sharon@mavuno.org", roleId: "lead-registrar", access: "Both", status: "active" },
  { id: "u3", name: "Dennis Otieno", email: "dennis@mavuno.org", roleId: "registrar", access: "MYA only", status: "active" },
  { id: "u4", name: "Faith Akinyi", email: "faith@mavuno.org", roleId: "registrar", access: "MYF only", status: "active" },
  { id: "u5", name: "Mercy Chebet", email: "mercy@mavuno.org", roleId: "registrar", access: "Both", status: "active" },
  { id: "u6", name: "Kevin Mutua", email: "kevin@mavuno.org", roleId: "registrar", access: "Both", status: "inactive" },
  { id: "u7", name: "", email: "brian@mavuno.org", roleId: "registrar", access: "MYF only", status: "pending" },
]


export const userName = (id: string) => initialUsers.find((user) => user.id === id)?.name ?? ""
