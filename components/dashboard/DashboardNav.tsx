'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, BarChart3, Package, FileText, HelpCircle, LogOut, Menu, X, Settings, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth'
import { toast } from 'sonner'

export function DashboardNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/dashboard/sales', label: 'Sales', icon: TrendingUp },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
    { href: '/dashboard/reports', label: 'Reports', icon: FileText },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    { href: '/dashboard/ask', label: 'Ask Vendari', icon: MessageCircle },
    { href: '/dashboard/help', label: 'Help & Tutorial', icon: HelpCircle },
  ]

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
      setLoggingOut(false)
    }
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button className="fixed top-4 right-4 z-50 md:hidden bg-slate-800 p-2 rounded-lg border border-slate-700" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 p-6 transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Vendari</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition group"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-5 h-5 group-hover:text-blue-400 transition" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <Button 
            onClick={handleLogout}
            disabled={loggingOut}
            variant="outline" 
            className="w-full border-slate-700 hover:bg-red-900/20 hover:border-red-700 text-slate-300 hover:text-red-300 justify-start gap-3 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Close sidebar when clicking outside on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
