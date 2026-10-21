export function statusClass(status: string) {
  if (status === "Checked in" || status === "Active link" || status === "Can sign in") return "border-transparent bg-status-checked-in text-status-checked-in-foreground"
  if (status === "Registered") return "border-transparent bg-status-registered text-status-registered-foreground"
  if (status === "Paused") return "border-transparent bg-status-paused text-status-paused-foreground"
  if (status === "Scheduled" || status === "Invite pending") return "border-transparent bg-status-scheduled text-status-scheduled-foreground"
  return "rounded-full border-2 border-border bg-muted text-muted-foreground"
}
