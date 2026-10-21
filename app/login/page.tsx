import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/site-header"

export const metadata = { title: 'Log in' }

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/login-tent.webp"
          alt="An orange tent on a grassy hilltop under a cloudy sky"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
