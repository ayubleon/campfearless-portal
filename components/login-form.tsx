"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={(event) => {
        event.preventDefault()
        try {
          router.push("/dashboard")
        } catch {
          toast.error("Failed to log in. Something went wrong on our end. Please try again.")
        }
      }}
      {...props}
    >
      <div className="flex flex-col items-center space-y-1.5 text-center">
        <img src="/camp-fearless-logo.png" alt="Camp Fearless logo" className="mb-4 h-16 w-auto dark:invert" />
        <h1 className="text-2xl font-bold">Log in to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email and password to open the camp portal.
        </p>
      </div>
      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Email
          <Input type="email" autoComplete="email" placeholder="name@campfearless.org" className="bg-muted/40" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          <span className="flex items-center">
            Password
            <a href="#" className="ml-auto text-sm font-normal text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Forgot password?
            </a>
          </span>
          <Input type="password" autoComplete="current-password" className="bg-muted/40" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <Button type="submit" className="mt-2 w-full" disabled={!email.trim() || !password}>
          Log in
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account? Ask your <strong className="text-foreground">camp administrator</strong>.
      </p>
    </form>
  )
}
