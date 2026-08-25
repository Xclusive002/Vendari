'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { getCurrentUser, logout } from '@/app/actions/auth'
import { getBusiness } from '@/app/actions/business'

type Account = {
  email: string
  businessName: string
}

function displayName(email: string) {
  const localPart = email.split('@')[0] || email
  return localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AccountMenu() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    Promise.all([getCurrentUser(), getBusiness()]).then(([user, business]) => {
      if (user) setAccount({ email: user.email, businessName: business?.business_name || business?.name || 'No business set up' })
    })
  }, [])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push('/login')
  }

  const name = account ? displayName(account.email) : 'Account'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <div ref={containerRef} className="relative">
      <button type="button" aria-label="Open user menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1.5 pr-3 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-semibold text-white">{initials}</span>
        <span className="hidden text-xs font-semibold text-ink sm:inline">{name}</span>
        <ChevronDown className={`hidden h-3.5 w-3.5 text-text-muted transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div role="menu" aria-label="User menu" className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
        <div className="border-b border-border px-4 py-4"><p className="font-display text-sm font-semibold text-ink">{name}</p><p className="mt-1 truncate text-xs text-text-secondary">{account?.email || 'Loading account...'}</p><p className="mt-3 text-xs text-text-muted">Business</p><p className="mt-1 truncate text-sm font-medium text-ink">{account?.businessName || 'Loading...'}</p></div>
        <div className="p-2"><Link href="/dashboard/settings" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-bg hover:text-ink"><Settings className="h-4 w-4" />Settings</Link><button type="button" role="menuitem" disabled={loggingOut} onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-negative hover:bg-negative/10 disabled:opacity-60"><LogOut className="h-4 w-4" />{loggingOut ? 'Logging out...' : 'Log out'}</button></div>
      </div>}
    </div>
  )
}
