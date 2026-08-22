import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const accessToken = (await cookies()).get('vendari_access')?.value
  if (!accessToken) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardNav />
      <div className="pt-16 pb-8">
        {children}
      </div>
    </div>
  )
}
