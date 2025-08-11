import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Game Service',
  description: 'Tiny multiplayer game shell',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <header className="container py-3">
          <h1 className="text-xl font-bold">Game Service</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
