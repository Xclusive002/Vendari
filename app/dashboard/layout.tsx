import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import DashboardNav from '@/components/dashboard/DashboardNav'

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
          <button type="button" aria-label="View notifications" className="rounded-lg border border-border bg-surface p-2.5 text-text-secondary shadow-sm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><Bell className="h-4 w-4" /></button>
          <button type="button" aria-label="Open user menu" className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1.5 pr-3 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-semibold text-white">EA</span><span className="hidden text-xs font-semibold text-ink sm:inline">Emmanuel</span></button>
        </header>
        {children}
      </div>
    </div>
  )
}
