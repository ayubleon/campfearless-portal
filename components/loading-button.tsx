import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/ui/button"

// A button that, while its action is running, switches off and shows a spinner with its own wording ("Saving..."),
// so it can't be pressed twice and the person can see something is happening.
export function LoadingButton({ pending, loadingLabel, disabled, children, ...props }: React.ComponentProps<typeof Button> & { pending: boolean; loadingLabel: string }) {
  return (
    <Button {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending ? <><Loader2 className="animate-spin" aria-hidden="true" />{loadingLabel}</> : children}
    </Button>
  )
}
