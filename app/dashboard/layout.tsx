import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import NotificationBell from '@/components/dashboard/NotificationBell'
import AccountMenu from '@/components/dashboard/AccountMenu'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const accessToken = (await cookies()).get('vendari_access')?.value
  if (!accessToken) redirect('/login')

  return (
    <div className="min-h-screen bg-bg">
      <DashboardNav />
      <div className="min-h-screen pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pl-64 md:pb-0">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-end gap-2 border-b border-border bg-surface/95 px-4 pt-[max(env(safe-area-inset-top),0.5rem)] backdrop-blur supports-[backdrop-filter]:bg-surface/85 sm:gap-3 sm:px-8">
          <NotificationBell />
          <AccountMenu />
        </header>
        {children}
      </div>
    </div>
  )
}
