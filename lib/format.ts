import { format } from "date-fns"

// Every date and time shown in the portal, e.g. "20/10/26, 09:20 AM".
export const formatDateTime = (date: Date) => format(date, "dd/MM/yy, hh:mm a")

// Whole numbers with thousands commas, e.g. "1,000".
export const formatNumber = (value: number) => value.toLocaleString("en-US")

// Dates for campers on the public welcome page: month spelled out, both ends in full, "01 Dec - 06 Dec 2026".
// The staff portal itself uses dd/MM/yyyy; this is only for what campers see.
export function formatCamperDateRange(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear()
  return `${format(start, sameYear ? "dd MMM" : "dd MMM yyyy")} - ${format(end, "dd MMM yyyy")}`
}
