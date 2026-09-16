'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Facebook, Globe, Instagram, Minus, Music2, Plus, ShoppingBag, ShoppingCart, X } from 'lucide-react'
import { getStorefrontCartKey, getStorefrontUrl } from '@/lib/storefront'
import { checkoutStorefront } from '@/app/actions/storefront'

type Product = {
  id: number
  product_name: string
  description: string
  image: string | null
  images?: string[]
  selling_price: string | number | null
  in_stock: boolean
}

type StorefrontData = {
  business_name: string
  storefront: {
    slug: string
    logo: string | null
    social_links: Record<string, string>
    theme: string
    primary_color: string
    accent_color: string
    banner_image: string | null
    description: string
    whatsapp_number: string
    delivery_option: string
  }
  items: Product[]
  has_payments_enabled: boolean
}

type CartLine = Product & { quantity: number }

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'tiktok', label: 'TikTok', icon: Music2 },
  { key: 'twitter', label: 'Twitter/X', icon: Globe },
] as const

function excerpt(value: string) {
  if (!value) return ''
  return value.length > 92 ? `${value.slice(0, 92).trim()}...` : value
}

function money(value: string | number | null) {
  if (value === null) return 'Message us for price'
  return `N${Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

export default function StorefrontClient({ data }: { data: StorefrontData }) {
  const { storefront } = data
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(window.localStorage.getItem(getStorefrontCartKey(storefront.slug)) || '[]') as CartLine[] } catch { return [] }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_address: '', delivery_option: storefront.delivery_option || 'both', checkout_method: data.has_payments_enabled ? 'pay_now' as const : 'whatsapp' as const })
  const primary = storefront.primary_color || '#1d4ed8'
  const accent = storefront.accent_color || primary
  const theme = storefront.theme || 'classic'
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const total = cart.reduce((sum, item) => sum + Number(item.selling_price) * item.quantity, 0)

  const themeClass = theme === 'bold' ? 'tracking-wide' : theme === 'minimal' ? 'font-light' : ''
  const isBold = theme === 'bold'
  const isMinimal = theme === 'minimal'
  const socialLinks = SOCIAL_PLATFORMS.filter(({ key }) => storefront.social_links?.[key])

  useEffect(() => {
    window.localStorage.setItem(getStorefrontCartKey(storefront.slug), JSON.stringify(cart))
  }, [cart, storefront.slug])

  const addToCart = (product: Product) => {
    if (product.selling_price === null || Number(product.selling_price) <= 0) return
    setCart((current) => {
      const existing = current.find((item) => item.product_name === product.product_name)
      if (existing) return current.map((item) => item.product_name === product.product_name ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (name: string, delta: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.product_name !== name) return [item]
      const quantity = item.quantity + delta
      return quantity > 0 ? [{ ...item, quantity }] : []
    }))
  }

  const submitCheckout = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setCheckoutError('')
    const result = await checkoutStorefront(storefront.slug, {
      ...form,
      items: cart.map((item) => ({ product_name: item.product_name, quantity: item.quantity })),
    })
    setSubmitting(false)
    if (!result.success) {
      setCheckoutError(result.error)
      return
    }
    if (form.checkout_method === 'whatsapp' && result.data.whatsapp_url) {
      window.open(result.data.whatsapp_url, '_blank', 'noopener,noreferrer')
      setCheckoutOpen(false)
      setCart([])
      return
    }
    if (result.data.authorization_url) window.location.assign(result.data.authorization_url)
  }

  return (
    <main className={`min-h-screen bg-white text-slate-900 ${themeClass}`} style={{ '--store-primary': primary, '--store-accent': accent } as React.CSSProperties}>
      <header className={`relative overflow-hidden ${isMinimal ? 'border-b border-slate-200' : ''}`} style={{ backgroundColor: primary }}>
        {storefront.banner_image && <img src={storefront.banner_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-black/25" />
        <div className={`relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-7 pt-14 text-white sm:px-8 sm:pb-12 ${isBold ? 'min-h-[23rem]' : isMinimal ? 'min-h-[15rem]' : 'min-h-[19rem] sm:min-h-[25rem]'}`}>
          <div className="max-w-2xl">
            {storefront.logo && <img src={storefront.logo} alt={`${data.business_name} logo`} className="mb-5 h-16 w-16 rounded-2xl border border-white/40 bg-white object-cover p-1 shadow-lg sm:h-20 sm:w-20" />}
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/75">Online shop</p>
            <h1 className={`font-bold leading-tight ${isBold ? 'text-5xl sm:text-7xl' : isMinimal ? 'text-3xl sm:text-5xl' : 'text-3xl sm:text-6xl'}`}>{data.business_name}</h1>
            {storefront.description && <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:mt-4 sm:text-lg sm:leading-7">{storefront.description}</p>}
          </div>
        </div>
      </header>

      <section className={`mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 ${isMinimal ? 'bg-white' : isBold ? 'bg-slate-50' : ''}`}>
        <div className="mb-6 flex items-end justify-between gap-3">
          <div><p className="text-sm font-semibold" style={{ color: accent }}>Shop collection</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Available products</h2></div>
          <button type="button" onClick={() => setCartOpen(true)} className="sticky top-4 z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-lg" style={{ backgroundColor: primary }} aria-label={`Open cart with ${cartCount} items`}><ShoppingCart className="h-5 w-5" />{cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold" style={{ color: primary }}>{cartCount}</span>}</button>
        </div>

        {data.items.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-600">No products are available right now.</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">{data.items.map((product) => { const hasPrice = product.selling_price !== null && Number(product.selling_price) > 0; const canAdd = product.in_stock && hasPrice; return <div key={product.id} className={`group overflow-hidden border border-slate-200 bg-white shadow-sm ${isMinimal ? 'rounded-none' : isBold ? 'rounded-3xl' : 'rounded-2xl'}`}><Link href={`/s/${encodeURIComponent(storefront.slug)}/products/${product.id}`} className="block"><div className="aspect-[4/3] bg-slate-100 sm:aspect-square">{product.image ? <img src={product.image} alt={product.product_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex h-full items-center justify-center" style={{ color: primary }}><ShoppingBag className="h-10 w-10 opacity-40" /></div>}</div><div className="p-4"><div className="mb-2 flex items-start justify-between gap-2"><h3 className="min-w-0 text-base font-semibold leading-tight">{product.product_name}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${product.in_stock ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{product.in_stock ? 'In stock' : 'Out of stock'}</span></div>{product.description && <p className="mb-3 text-sm leading-5 text-slate-500">{excerpt(product.description)}</p>}<p className="text-lg font-bold" style={{ color: accent }}>{hasPrice ? money(product.selling_price) : 'Message us for price'}</p></div></Link><div className="border-t border-slate-200 p-3"><button type="button" onClick={(event) => { event.preventDefault(); if (!canAdd) return; addToCart(product); setCartOpen(true); }} disabled={!canAdd} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: canAdd ? accent : '#94a3b8' }}><ShoppingCart className="h-4 w-4" />{canAdd ? 'Add to cart' : 'Unavailable'}</button></div></div> })}</div>}
      </section>

      {socialLinks.length > 0 && <div className="border-t border-slate-200 px-5 py-6" style={{ color: accent }}><div className="flex justify-center gap-3">{socialLinks.map(({ key, label, icon: Icon }) => <a key={key} href={storefront.social_links[key]} target="_blank" rel="noreferrer" aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full border border-current transition-opacity hover:opacity-70"><Icon className="h-5 w-5" /></a>)}</div></div>}

      <footer className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500"><a href="https://www.vendari.name.ng" className="font-semibold hover:underline">Powered by Vendari</a></footer>

      {cartOpen && <div className="fixed inset-0 z-50"><button type="button" aria-label="Close cart" className="absolute inset-0 bg-slate-950/45" onClick={() => setCartOpen(false)} /><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><h2 className="text-xl font-bold">Your cart</h2><p className="text-sm text-slate-500">{cartCount} item{cartCount === 1 ? '' : 's'}</p></div><button type="button" onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-slate-100" aria-label="Close cart"><X className="h-5 w-5" /></button></div><div className="flex-1 space-y-4 overflow-y-auto py-5">{cart.length === 0 ? <p className="py-10 text-center text-slate-500">Your cart is empty.</p> : cart.map((item) => <div key={item.product_name} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{item.product_name}</p><p className="text-sm text-slate-500">{money(item.selling_price)}</p></div><div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1"><button type="button" onClick={() => updateQuantity(item.product_name, -1)} aria-label={`Remove one ${item.product_name}`}><Minus className="h-4 w-4" /></button><span className="w-5 text-center text-sm">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.product_name, 1)} aria-label={`Add one ${item.product_name}`}><Plus className="h-4 w-4" /></button></div></div>)}</div><div className="border-t border-slate-200 pt-4"><div className="flex justify-between text-lg font-bold"><span>Total</span><span style={{ color: primary }}>{money(total)}</span></div><button type="button" disabled={cart.length === 0} onClick={() => { setCartOpen(false); setCheckoutOpen(true) }} className="mt-4 w-full rounded-xl px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: primary }}>Continue with order</button></div></aside></div>}
      {checkoutOpen && <div className="fixed inset-0 z-50"><button type="button" aria-label="Close checkout" className="absolute inset-0 bg-slate-950/45" onClick={() => setCheckoutOpen(false)} /><form onSubmit={submitCheckout} className="absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Complete your order</h2><button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X className="h-5 w-5" /></button></div><div className="space-y-3"><input required value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} placeholder="Your name" className="w-full rounded-xl border border-slate-200 px-4 py-3" /><input required value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} placeholder="Phone number" className="w-full rounded-xl border border-slate-200 px-4 py-3" /><textarea value={form.customer_address} onChange={(event) => setForm({ ...form, customer_address: event.target.value })} placeholder="Delivery address (optional for pickup)" className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3" /><select value={form.delivery_option} onChange={(event) => setForm({ ...form, delivery_option: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3"><option value="pickup">Pickup</option><option value="delivery">Delivery</option><option value="both">Delivery or pickup</option></select>{data.has_payments_enabled ? <div className="grid grid-cols-2 gap-2">{(['whatsapp', 'pay_now'] as const).map((method) => <button type="button" key={method} onClick={() => setForm({ ...form, checkout_method: method })} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.checkout_method === method ? 'text-white' : 'text-slate-700'}`} style={form.checkout_method === method ? { backgroundColor: primary, borderColor: primary } : undefined}>{method === 'whatsapp' ? 'Order via WhatsApp' : 'Pay Now'}</button>)}</div> : <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">Order via WhatsApp</div>}{checkoutError && <p className="text-sm text-red-600">{checkoutError}</p>}<button disabled={submitting} type="submit" className="w-full rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50" style={{ backgroundColor: accent }}>{submitting ? 'Submitting...' : form.checkout_method === 'whatsapp' ? 'Open WhatsApp' : 'Continue to payment'}</button></div></form></div>}
    </main>
  )
}