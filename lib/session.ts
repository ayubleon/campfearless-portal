// The signed-in user and what their role may do. A placeholder until real sign-in exists: the user is one of the sample staff in
// lib/staff.ts (John Doe, a Super admin, until someone logs in as another). Every screen reads who is signed in from here, and
// asks `can("verify-payments")` before it shows something a role may not use. The real server must enforce the same permissions.
import { initialRoles, initialUsers } from "@/lib/staff"

export const defaultUserId = "u1"

type SessionUser = { id: string; firstName: string; lastName: string; name: string; email: string; role: string; roleId: string }

const toSessionUser = (id: string): SessionUser => {
  const user = initialUsers.find((item) => item.id === id) ?? initialUsers[0]
  const [firstName, ...rest] = user.name.split(" ")
  return { id: user.id, firstName, lastName: rest.join(" "), name: user.name, email: user.email, role: initialRoles.find((role) => role.id === user.roleId)?.name ?? "", roleId: user.roleId }
}

// Changed in place when someone signs in, so code that reads `currentUser.name` always sees the current person.
export const currentUser: SessionUser = toSessionUser(defaultUserId)

export function applySession(userId: string) {
  Object.assign(currentUser, toSessionUser(userId))
}

export const permissionsOf = (roleId: string) => initialRoles.find((role) => role.id === roleId)?.permissions ?? []
export const hasPermission = (roleId: string, permission: string) => permissionsOf(roleId).includes(permission)
export const can = (permission: string) => hasPermission(currentUser.roleId, permission)

// Sample staff who can sign in (active users whose role can sign in), for the login screen and the "View as" menu.
export const signInUsers = initialUsers.filter((user) => user.status === "active" && initialRoles.find((role) => role.id === user.roleId)?.canSignIn)
