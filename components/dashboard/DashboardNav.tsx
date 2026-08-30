'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart3, HelpCircle, LayoutDashboard, LogOut, Menu, MessageCircleQuestion, MoreHorizontal, Package, Receipt, Settings, Settings2, ShoppingCart, Users, X } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export function DashboardNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/sales', label: 'Sales', icon: ShoppingCart },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
    { href: '/dashboard/expenses', label: 'Expenses', icon: Receipt },
    { href: '/dashboard/help', label: 'Help', icon: HelpCircle },
    { href: '/dashboard/setup', label: 'Setup', icon: Settings2 },
    { href: '/dashboard/ask', label: 'Ask', icon: MessageCircleQuestion },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const primaryNavItems = navItems.slice(0, 3)
  const moreNavItems = navItems.slice(3)

  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[min(18rem,85vw)] flex-col bg-ink px-4 py-6 text-white md:flex">
      <div className="flex h-full flex-col overflow-hidden">
        <Link href="/dashboard" className="mb-6 flex items-center rounded-md px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><Image src="/vendari-dark-blue-bg.png" alt="Vendari" width={180} height={180} className="h-14 w-auto object-contain" /></Link>
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain pb-4 pr-1 [-webkit-overflow-scrolling:touch]" aria-label="Dashboard navigation">{navItems.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} onClick={() => setIsOpen(false)} className={`group flex items-center gap-3 rounded-r-lg border-l-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue ${active ? 'border-blue bg-brand-gradient/20 text-white' : 'border-transparent text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon className={`h-4 w-4 ${active ? 'text-blue' : 'text-white/45 group-hover:text-blue'}`} />{label}</Link> })}</nav>
        <button type="button" onClick={() => logout()} className="mt-2 flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-white/55 hover:bg-negative/10 hover:text-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><LogOut className="h-4 w-4" /> Log out</button>
      </div>
    </aside>

    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-12px_30px_rgba(6,18,43,0.08)] backdrop-blur md:hidden" aria-label="Mobile dashboard navigation">
      <div className="grid grid-cols-4 items-center gap-1">
        {primaryNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
          return (
            <Link key={href} href={href} className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${active ? 'bg-brand-gradient text-white shadow-sm' : 'text-text-secondary hover:bg-bg'}`}>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}

        <button type="button" onClick={() => setShowMore(true)} className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${showMore || pathname.startsWith('/dashboard/') && !primaryNavItems.some(({ href }) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))) ? 'bg-brand-gradient text-white shadow-sm' : 'text-text-secondary hover:bg-bg'}`}>
          <MoreHorizontal className="h-4 w-4" />
          <span>More</span>
        </button>
      </div>
    </nav>

    {showMore && (
      <>
        <button type="button" aria-label="Close more navigation" className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[1px] md:hidden" onClick={() => setShowMore(false)} />
        <div className="fixed inset-x-0 bottom-[76px] z-50 mx-auto w-[calc(100%-1.5rem)] rounded-2xl border border-border bg-surface p-3 shadow-2xl md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {moreNavItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
              return (
                <Link key={href} href={href} onClick={() => setShowMore(false)} className={`flex min-h-[48px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${active ? 'bg-brand-gradient text-white' : 'bg-bg text-text-secondary hover:text-ink'}`}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </>
    )}
  </>
}

export default DashboardNav
