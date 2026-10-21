import { format } from "date-fns"

// Every date and time shown in the portal, e.g. "20/10/26, 09:20 AM".
export const formatDateTime = (date: Date) => format(date, "dd/MM/yy, hh:mm a")
