'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart3, HelpCircle, LayoutDashboard, LogOut, Menu, MessageCircleQuestion, Package, Receipt, Settings, Settings2, ShoppingCart, Users, X } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export function DashboardNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
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

  return <>
    <button type="button" aria-label={isOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setIsOpen(!isOpen)} className="fixed right-4 top-4 z-50 rounded-lg bg-ink p-2 text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue md:hidden">{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink px-4 py-6 text-white transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <Link href="/dashboard" className="mb-10 flex items-center rounded-md px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><Image src="/vendari-dark-blue-bg.png" alt="Vendari" width={180} height={180} className="h-14 w-auto object-contain" /></Link>
      <nav className="flex-1 space-y-1" aria-label="Dashboard navigation">{navItems.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} onClick={() => setIsOpen(false)} className={`group flex items-center gap-3 rounded-r-lg border-l-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue ${active ? 'border-blue bg-brand-gradient/20 text-white' : 'border-transparent text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon className={`h-4 w-4 ${active ? 'text-blue' : 'text-white/45 group-hover:text-blue'}`} />{label}</Link> })}</nav>
      <button type="button" onClick={() => logout()} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-white/55 hover:bg-negative/10 hover:text-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"><LogOut className="h-4 w-4" /> Log out</button>
    </aside>
    {isOpen && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-ink/60 md:hidden" onClick={() => setIsOpen(false)} />}
  </>
}

export default DashboardNav
