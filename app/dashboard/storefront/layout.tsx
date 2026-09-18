'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Palette, Package, Image, Scissors, ShoppingBag, CreditCard } from 'lucide-react'

const links = [
  { href: '/dashboard/storefront', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/storefront/customize', label: 'Customize', icon: Palette },
  { href: '/dashboard/storefront/products', label: 'Products', icon: Package },
  { href: '/dashboard/storefront/services', label: 'Services', icon: Scissors },
  { href: '/dashboard/storefront/gallery', label: 'Gallery', icon: Image },
  { href: '/dashboard/storefront/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/storefront/payouts', label: 'Payouts', icon: CreditCard },
]

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <>
    <div className="dashboard-page pb-24 md:pb-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2" aria-label="Storefront sections">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard/storefront' && pathname.startsWith(`${href}/`))
            return <Link key={href} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-brand-gradient text-white' : 'text-text-secondary hover:bg-bg hover:text-ink'}`}><Icon className="h-4 w-4" />{label}</Link>
          })}
        </nav>
        {children}
      </div>
    </div>
  </>
}
