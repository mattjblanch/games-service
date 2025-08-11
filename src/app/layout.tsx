import './globals.css'
import type { ReactNode } from 'react'
import OnlineUsers from '@/components/OnlineUsers'

export const metadata = {
  title: 'Game Service',
  description: 'Tiny multiplayer game shell',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <header className="container py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Game Service</h1>
          {/* show number of users currently online */}
          <OnlineUsers />
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
