"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"

import { isEmail } from "@/lib/validation"
import { LoadingButton } from "@/components/loading-button"
import { useSession } from "@/components/session-provider"
import { initialUsers } from "@/lib/staff"
import { useAction } from "@/lib/use-action"
import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const resetValid = isEmail(resetEmail)
  const { pending: resetPending, run: runReset } = useAction()
  const { pending: loginPending, run: runLogin } = useAction()
  const [error, setError] = useState("")
  const { signInAs } = useSession()
  const sendReset = async () => {
    if (!resetValid) return
    if (!(await runReset(() => undefined, "send the reset link"))) return
    setResetOpen(false)
    toast.success("Password reset link successfully sent")
  }

  // Demo sign-in: a sample staff email with any password. The real server checks the password and answers 401 when it is wrong.
  const logIn = async () => {
    setError("")
    const person = initialUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase())
    let message = ""
    const ok = await runLogin(() => {
      if (!person) message = "Invalid email or password."
      else if (person.status === "inactive") message = "This account is inactive. Ask your camp administrator."
      else if (person.status === "pending") message = "This account isn't set up yet. Open the invite in your email."
    }, "log in")
    if (!ok) return
    if (message) { setError(message); return }
    signInAs(person!.id)
    router.push("/dashboard")
  }

  return (
    <>
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(event) => {
        event.preventDefault()
        void logIn()
      }}
      {...props}
    >
      <div className="flex flex-col items-center space-y-1.5 text-center">
        <Image src="/camp-fearless-logo.png" alt="Camp Fearless logo" width={120} height={128} priority className="mb-4 h-16 w-auto dark:invert" />
        <h1 className="text-2xl font-bold">Log in to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email and password to open the camp portal.
        </p>
      </div>
      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <Input type="email" autoComplete="email" placeholder="name@mavuno.org" className="bg-muted/40" value={email} onChange={(event) => { setEmail(event.target.value); setError("") }} required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span className="flex items-center">
            Password
            <Button type="button" variant="link" className="ml-auto h-auto p-0 text-sm font-normal text-muted-foreground hover:text-foreground" onClick={() => { setResetEmail(email); setResetOpen(true) }}>
              Forgot password?
            </Button>
          </span>
          <Input type="password" autoComplete="current-password" className="bg-muted/40" value={password} onChange={(event) => { setPassword(event.target.value); setError("") }} required />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <LoadingButton type="submit" className="mt-2 w-full" pending={loginPending} loadingLabel="Logging in..." disabled={!email.trim() || !password}>
          Log in
        </LoadingButton>
        <p className="text-xs text-muted-foreground">Demo: use john@mavuno.org (Super admin), sharon@mavuno.org (Lead registrar) or dennis@mavuno.org (Registrar) with any password.</p>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account? Ask your camp administrator.
      </p>
    </form>
    <Dialog open={resetOpen} onOpenChange={setResetOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader className="relative space-y-1 text-left">
          <DialogTitle className="text-base font-bold leading-none tracking-tight">Reset your password</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Enter your email and we'll send you a link to choose a new password.</DialogDescription>
          <Button type="button" variant="ghost" size="icon" aria-label="Close reset password" className="absolute right-0 top-0" onClick={() => setResetOpen(false)}><X className="size-4" /></Button>
        </DialogHeader>
        <label className="flex flex-col gap-2 text-sm font-medium">Email
          <Input type="email" autoComplete="email" placeholder="name@mavuno.org" className="bg-muted/40" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendReset() }} />
        </label>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:justify-stretch">
          <Button type="button" variant="outline" disabled={resetPending} onClick={() => setResetOpen(false)}>Cancel</Button>
          <LoadingButton type="button" pending={resetPending} loadingLabel="Sending..." disabled={!resetValid} onClick={sendReset}>Send reset link</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
