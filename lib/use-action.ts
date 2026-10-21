"use client"

import * as React from "react"
import { toast } from "sonner"

import { callApi } from "@/lib/api"

// Runs one action through the server call, with a pending flag for the button, protection against a second click while it
// is running, and the standard error toast when it fails ("Failed to <what>. Something went wrong on our end. Please try again.").
// Returns true when the action succeeded, so the caller can close its dialog or show its success toast.
export function useAction() {
  const [pending, setPending] = React.useState(false)
  const running = React.useRef(false)

  const run = React.useCallback(async <T,>(action: () => T | Promise<T>, failedTo: string): Promise<boolean> => {
    if (running.current) return false
    running.current = true
    setPending(true)
    try {
      await callApi(action)
      return true
    } catch {
      toast.error(`Failed to ${failedTo}. Something went wrong on our end. Please try again.`)
      return false
    } finally {
      running.current = false
      setPending(false)
    }
  }, [])

  return { pending, run }
}
