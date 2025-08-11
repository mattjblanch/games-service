import './globals.css'
import type { ReactNode } from 'react'
import OnlineUsers from '@/components/OnlineUsers'
import UserEmail from '@/components/UserEmail'

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
          <div className="flex items-center gap-4">
            {/* show user email and number of users online */}
            <UserEmail />
            <OnlineUsers />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
