import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SessionProvider } from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/ui/sonner'
import { TooltipProvider } from '@/ui/tooltip'

// Panton Black Caps is used for the CAMP FEARLESS name in the sidebar and for the registration title on the public site. Nothing else uses it.
const panton = localFont({ src: './fonts/Panton-BlackCaps.otf', variable: '--font-panton', display: 'swap' })

// Runs before first paint so the saved (or system) theme never flashes the wrong colours.
const themeScript = `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.add(t)}catch(e){}`

export const metadata: Metadata = {
  // Where the link-preview image is found when the link is shared.
  metadataBase: new URL(process.env.VERCEL_ENV === 'production' ? 'https://campfearlessportal.vercel.app' : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: { default: 'Camp Fearless portal', template: '%s · Camp Fearless' },
  description: 'Registration, check-in and payments for Camp Fearless.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={panton.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <SessionProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
