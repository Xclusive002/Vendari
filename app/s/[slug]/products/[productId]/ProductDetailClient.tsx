'use client'

import Link from 'next/link'
import { ArrowLeft, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStorefrontCartKey } from '@/lib/storefront'

type ProductDetailData = {
  product_name: string
  description: string
  image: string | null
  selling_price: string | number
  in_stock: boolean
}

type DetailData = {
  business_name: string
  storefront: {
    slug: string
    logo: string | null
    theme: string
    primary_color: string
    accent_color: string
  }
  product: ProductDetailData
}

type CartLine = ProductDetailData & { quantity: number }

function money(value: string | number) {
  return `N${Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

export default function ProductDetailClient({ data }: { data: DetailData }) {
  const { storefront, product } = data
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(window.localStorage.getItem(getStorefrontCartKey(storefront.slug)) || '[]') as CartLine[]
    } catch {
      return []
    }
  })
  const [added, setAdded] = useState(false)
  const primary = storefront.primary_color || '#1d4ed8'
  const accent = storefront.accent_color || primary
  const isBold = storefront.theme === 'bold'
  const isMinimal = storefront.theme === 'minimal'
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.selling_price) * item.quantity, 0)

  const addToCart = () => {
    if (!product.in_stock) return
    setCart((current) => {
      const existing = current.find((item) => item.product_name === product.product_name)
      return existing
        ? current.map((item) => item.product_name === product.product_name ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }]
    })
    setAdded(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(getStorefrontCartKey(storefront.slug), JSON.stringify(cart))
  }, [cart, storefront.slug])

  return (
    <main className={`min-h-screen bg-white text-slate-900 ${isBold ? 'tracking-wide' : isMinimal ? 'font-light' : ''}`} style={{ '--store-primary': primary, '--store-accent': accent } as React.CSSProperties}>
      <header className={`border-b border-slate-200 ${isMinimal ? 'bg-white' : 'text-white'}`} style={{ backgroundColor: isMinimal ? undefined : primary }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href={`/s/${encodeURIComponent(storefront.slug)}`} className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-75"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
          <span className="text-sm font-semibold">{data.business_name}</span>
        </div>
      </header>
      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 sm:px-8 sm:py-16 md:grid-cols-2 md:items-center">
        <div className={`aspect-square overflow-hidden border border-slate-200 bg-slate-100 ${isMinimal ? 'rounded-none' : isBold ? 'rounded-3xl' : 'rounded-2xl'}`}>
          {product.image ? <img src={product.image} alt={product.product_name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center" style={{ color: primary }}><ShoppingBag className="h-20 w-20 opacity-35" /></div>}
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Product details</p>
          <h1 className={`mt-3 font-bold leading-tight ${isBold ? 'text-5xl' : 'text-4xl'}`}>{product.product_name}</h1>
          <p className="mt-5 whitespace-pre-line text-base leading-7 text-slate-600">{product.description || 'No description has been added for this product yet.'}</p>
          <p className="mt-7 text-2xl font-bold" style={{ color: accent }}>{money(product.selling_price)}</p>
          {!product.in_stock ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">This product is no longer available.</div> : <button type="button" onClick={addToCart} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white md:w-auto" style={{ backgroundColor: accent }}><ShoppingCart className="h-5 w-5" />{added ? 'Added to cart' : 'Add to cart'}</button>}
          {cartCount > 0 && <p className="mt-4 text-sm text-slate-500">Shared cart: {cartCount} item{cartCount === 1 ? '' : 's'} · {money(cartTotal)}</p>}
        </div>
      </section>
    </main>
  )
}