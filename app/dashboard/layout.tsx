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
      <div className="min-h-screen md:pl-64">
        <header className="flex h-20 items-center justify-end gap-3 border-b border-border bg-surface px-5 sm:px-8">
          <NotificationBell />
          <AccountMenu />
        </header>
        {children}
      </div>
    </div>
  )
}
