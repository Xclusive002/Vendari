'use client'

import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingBag, ShoppingCart, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStorefrontCartKey } from '@/lib/storefront'

type ProductDetailData = {
  product_name: string
  description: string
  image: string | null
  images?: string[]
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
  const [cartOpen, setCartOpen] = useState(false)
  const primary = storefront.primary_color || '#1d4ed8'
  const accent = storefront.accent_color || primary
  const isBold = storefront.theme === 'bold'
  const isMinimal = storefront.theme === 'minimal'
  const gallery = product.images?.length ? product.images : product.image ? [product.image] : []
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
    setCartOpen(true)
  }

  const updateQuantity = (name: string, delta: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.product_name !== name) return [item]
      const quantity = item.quantity + delta
      return quantity > 0 ? [{ ...item, quantity }] : []
    }))
  }

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(getStorefrontCartKey(storefront.slug), JSON.stringify(cart))
  }, [cart, storefront.slug])

  return (
    <main className={`min-h-screen bg-white text-slate-900 ${isBold ? 'tracking-wide' : isMinimal ? 'font-light' : ''}`} style={{ '--store-primary': primary, '--store-accent': accent } as React.CSSProperties}>
      <header className={`border-b border-slate-200 ${isMinimal ? 'bg-white' : 'text-white'}`} style={{ backgroundColor: isMinimal ? undefined : primary }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href={`/s/${encodeURIComponent(storefront.slug)}`} className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-75"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCartOpen(true)} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/15" aria-label={`Open cart with ${cartCount} items`}>
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-slate-900">{cartCount}</span>}
            </button>
            <span className="text-sm font-semibold">{data.business_name}</span>
          </div>
        </div>
      </header>
      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 sm:px-8 sm:py-16 md:grid-cols-2 md:items-center">
        <div className={`aspect-square overflow-hidden border border-slate-200 bg-slate-100 ${isMinimal ? 'rounded-none' : isBold ? 'rounded-3xl' : 'rounded-2xl'}`}>
          {gallery.length ? <img src={gallery[0]} alt={product.product_name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center" style={{ color: primary }}><ShoppingBag className="h-20 w-20 opacity-35" /></div>}
        </div>
        {gallery.length > 1 && <div className="grid grid-cols-5 gap-2 md:col-start-1 md:row-start-2">{gallery.slice(0, 6).map((image) => <img key={image} src={image} alt="" className="aspect-square w-full rounded-lg border border-slate-200 object-cover" />)}</div>}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>Product details</p>
          <h1 className={`mt-3 font-bold leading-tight ${isBold ? 'text-5xl' : 'text-4xl'}`}>{product.product_name}</h1>
          <p className="mt-5 whitespace-pre-line text-base leading-7 text-slate-600">{product.description || 'No description has been added for this product yet.'}</p>
          <p className="mt-7 text-2xl font-bold" style={{ color: accent }}>{money(product.selling_price)}</p>
          {!product.in_stock ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">This product is no longer available.</div> : <button type="button" onClick={addToCart} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white md:w-auto" style={{ backgroundColor: accent }}><ShoppingCart className="h-5 w-5" />{added ? 'Added to cart' : 'Add to cart'}</button>}
          {cartCount > 0 && <p className="mt-4 text-sm text-slate-500">Shared cart: {cartCount} item{cartCount === 1 ? '' : 's'} · {money(cartTotal)}</p>}
        </div>
      </section>

      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close cart" className="absolute inset-0 bg-slate-950/45" onClick={() => setCartOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold">Your cart</h2>
                <p className="text-sm text-slate-500">{cartCount} item{cartCount === 1 ? '' : 's'}</p>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close cart"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto py-5">
              {cart.length === 0 ? <p className="py-10 text-center text-slate-500">Your cart is empty.</p> : cart.map((item) => (
                <div key={`${item.product_name}-${item.selling_price}`} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.product_name}</p>
                    <p className="text-sm text-slate-500">{money(item.selling_price)}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
                    <button type="button" onClick={() => updateQuantity(item.product_name, -1)} aria-label={`Remove one ${item.product_name}`}><Minus className="h-4 w-4" /></button>
                    <span className="w-5 text-center text-sm">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.product_name, 1)} aria-label={`Add one ${item.product_name}`}><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span style={{ color: primary }}>{money(cartTotal)}</span></div>
              <Link href={`/s/${encodeURIComponent(storefront.slug)}`} onClick={() => setCartOpen(false)} className="mt-4 flex w-full items-center justify-center rounded-xl px-4 py-3 font-semibold text-white" style={{ backgroundColor: accent }}>
                Review cart & checkout
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}